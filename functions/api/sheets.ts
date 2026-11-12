/**
 * Cloudflare Pages Function: /api/sheets
 * Server-side Proxy for Google Apps Script Web App API
 * 
 * วัตถุประสงค์และการทำงาน:
 * 1. แปลงคำขอจาก Browser ให้เป็น Same-Origin Request (/api/sheets) 100%
 * 2. ขจัดปัญหา CORS และการบล็อก Redirect (302 จาก script.google.com -> script.googleusercontent.com)
 *    บน Chrome Android, Safari iOS และทุกเบราว์เซอร์
 * 3. ส่งต่อ Query Parameters และ Body ไปยัง Google Apps Script อย่างครบถ้วน
 * 4. ปลอดภัย ไม่เปิดเผย Secret และรองรับทั้ง GET, POST และ OPTIONS
 */

interface Env {
  GOOGLE_SCRIPT_API_URL?: string;
  VITE_GOOGLE_SCRIPT_API_URL?: string;
}

export interface PagesFunctionContext<E = Env> {
  request: Request;
  env: E;
  params?: Record<string, string | string[]>;
  data?: Record<string, unknown>;
  next?: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export const onRequest = async (context: PagesFunctionContext<Env>): Promise<Response> => {
  const { request, env } = context;
  const method = request.method;

  // 1. จัดการ CORS Preflight (OPTIONS Request)
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-url, x-auth-token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 2. ดึงเป้าหมาย URL ของ Google Apps Script
  // ลำดับความสำคัญ:
  // ก) Cloudflare Environment Variables (GOOGLE_SCRIPT_API_URL หรือ VITE_GOOGLE_SCRIPT_API_URL)
  // ข) Header 'x-api-url' จาก Client (ส่งมาจาก Frontend config)
  // ค) Query parameter 'targetUrl'
  const customTargetHeader = request.headers.get('x-api-url');
  const targetScriptUrl = (
    env.GOOGLE_SCRIPT_API_URL ||
    env.VITE_GOOGLE_SCRIPT_API_URL ||
    customTargetHeader ||
    ''
  ).trim();

  if (!targetScriptUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cloudflare Pages Proxy: ยังไม่ได้ระบุ Google Apps Script Web App URL ใน Cloudflare Environment หรือ Header',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const incomingUrl = new URL(request.url);

    // -------------------------------------------------------------
    // GET Requests: ส่งต่อ Query Parameters ทั้งหมด (action, authToken, _t, etc.)
    // -------------------------------------------------------------
    if (method === 'GET') {
      const forwardUrl = new URL(targetScriptUrl);
      incomingUrl.searchParams.forEach((val, key) => {
        forwardUrl.searchParams.set(key, val);
      });

      // ดึง authToken จาก Header หากมี
      const authTokenHeader = request.headers.get('x-auth-token');
      if (authTokenHeader && !forwardUrl.searchParams.has('authToken')) {
        forwardUrl.searchParams.set('authToken', authTokenHeader);
      }

      // ดำเนินการ fetch ฝั่งเซิร์ฟเวอร์ (Cloudflare Workers Runtime)
      // ติดตาม HTTP 302 Redirect ไปยัง script.googleusercontent.com อย่างสมบูรณ์
      const response = await fetch(forwardUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      const responseText = await response.text();

      return new Response(responseText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // -------------------------------------------------------------
    // POST Requests: ส่งต่อ Body (JSON) ไปยัง Google Apps Script
    // -------------------------------------------------------------
    if (method === 'POST') {
      const bodyText = await request.text();

      const response = await fetch(targetScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // รูปแบบ Simple Request ป้องกัน CORS บน Google Apps Script
        },
        body: bodyText,
        redirect: 'follow',
      });

      const responseText = await response.text();

      return new Response(responseText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: `Method ${method} not allowed` }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Cloudflare Pages Proxy ขัดข้อง: ${error.message || String(error)}`,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
