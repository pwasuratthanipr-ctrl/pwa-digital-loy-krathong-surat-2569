import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Clock } from 'lucide-react';
import { ApiService } from '../../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const items = await ApiService.getAuditLogs();
        setLogs(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div>
        <h4 className="font-heading font-semibold text-base text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>บันทึกความปลอดภัยและประวัติการทำงาน (Security & Audit Trail)</span>
        </h4>
        <p className="text-xs text-slate-400">
          บันทึกทุกการเข้าสู่ระบบ การตรวจสอบการสมัคร การมอบของที่ระลึก และการส่งออกข้อมูล
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">วันและเวลา</th>
              <th className="py-3 px-3">ผู้ปฏิบัติการ</th>
              <th className="py-3 px-3">การกระทำ (Action)</th>
              <th className="py-3 px-3">เป้าหมาย (Entity)</th>
              <th className="py-3 px-3">ข้อมูลประกอบ (Metadata)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  {loading ? 'กำลังโหลดบันทึก...' : 'ยังไม่มีบันทึกประวัติการทำงาน'}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('th-TH')}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {log.actor_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {log.safe_metadata ? JSON.stringify(log.safe_metadata) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
