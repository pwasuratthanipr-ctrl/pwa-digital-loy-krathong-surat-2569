import React, { useState } from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestType, setRequestType] = useState('DELETE_WISH');
  const [requestDetails, setRequestDetails] = useState('');
  const [participantCode, setParticipantCode] = useState('');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantCode.trim()) return;
    setRequestSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              ประกาศความเป็นส่วนตัว (Privacy Notice)
            </h1>
            <p className="text-xs text-sky-200">
              โครงการ “ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ประจำปี ๒๕๖๙” การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
            </p>
          </div>
        </div>
      </div>

      {/* Main Notice Content */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed backdrop-blur-md">
        
        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-amber-300">
            1. บทนำและเจตนารมณ์ในการคุ้มครองข้อมูล
          </h2>
          <p>
            การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) ตระหนักและให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของประชาชนผู้เข้าร่วมกิจกรรม ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) โดยยึดหลักการ <strong>Data Minimization (การเก็บรวบรวมข้อมูลเท่าที่จำเป็น)</strong> เพื่อให้ท่านสามารถร่วมประเพณีไทยได้อย่างมั่นใจและปลอดภัย
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-amber-300">
            2. ข้อมูลที่เราเก็บรวบรวม และสิ่งที่เราไม่เก็บ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30">
              <span className="font-semibold text-emerald-400 text-xs block mb-1">ข้อมูลที่ระบบบันทึก (เท่าที่จำเป็น):</span>
              <ul className="text-xs space-y-1 text-slate-300">
                <li>• รหัสกิจกรรมสุ่มจากเซิร์ฟเวอร์ (เช่น LK69-000108)</li>
                <li>• รูปแบบกระทงที่ท่านเลือก</li>
                <li>• ชื่อเล่นหรือนามสมมติที่ท่านระบุ (ไม่บังคับ)</li>
                <li>• ข้อความคำอธิษฐาน (ความยินยอมแยกชัดเจน)</li>
                <li>• วันและเวลาในการลอยกระทง</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/30">
              <span className="font-semibold text-rose-400 text-xs block mb-1">ข้อมูลที่ระบบไม่มีการเก็บเด็ดขาด:</span>
              <ul className="text-xs space-y-1 text-slate-300">
                <li>✕ ไม่เก็บเลขบัตรประจำตัวประชาชน</li>
                <li>✕ ไม่เก็บรหัสผ่านหรือ PIN ทุกประเภท</li>
                <li>✕ ไม่เก็บรหัส OTP หรือข้อมูลการเงิน</li>
                <li>✕ ไม่เก็บเบอร์โทรศัพท์ส่วนตัวบนหน้าเว็บสาธารณะ</li>
                <li>✕ ไม่มีการเข้าถึงกล้อง ไมโครโฟน หรือ GPS</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-amber-300">
            3. วัตถุประสงค์ในการประมวลผลข้อมูล
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>เพื่อแสดงผลกระทงจำลองในแม่น้ำตาปีตามความประสงค์ของท่าน</li>
            <li>เพื่อออกบัตรบันทึกกิจกรรมดิจิทัล (Digital Certificate) ให้ท่านดาวน์โหลดหรือแชร์</li>
            <li>เพื่อใช้ตรวจสอบสิทธิ์ในการรับของที่ระลึกสำหรับผู้สมัครบริการออนไลน์ กปภ. ณ จุดกิจกรรม</li>
            <li>เพื่อรวบรวมสถิติภาพรวมของผู้เข้าร่วมกิจกรรมสำหรับรายงานเชิงบริหาร (ข้อมูลนิรนาม ไม่สามารถระบุตัวตนได้)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-amber-300">
            4. ระยะเวลาการเก็บรักษาข้อมูล
          </h2>
          <p className="text-xs">
            ข้อมูลคำอธิษฐานและกระทงดิจิทัลจะถูกจัดเก็บไว้ตลอดช่วงระยะเวลาการจัดกิจกรรมลอยกระทงออนไลน์ประจำปี ๒๕๖๙ และจะถูกลบหรือแปลงเป็นข้อมูลสถิตินิรนามหลังจากเสร็จสิ้นกิจกรรมภายในระยะเวลา 60 วัน
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-semibold text-lg text-amber-300">
            5. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)
          </h2>
          <p className="text-xs">
            ท่านมีสิทธิตามกฎหมาย PDPA ในการขอเข้าถึง ขอรับสำเนา ขอแก้ไข ขอให้ระงับ หรือขอลบข้อมูลคำอธิษฐานของท่านได้ตลอดเวลา โดยสามารถแจ้งรหัสกิจกรรมของท่านผ่านแบบฟอร์มด้านล่าง หรือติดต่อเจ้าหน้าที่ กปภ.
          </p>
        </section>

      </div>

      {/* Data Subject Request Form */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <span>แบบฟอร์มใช้สิทธิของเจ้าของข้อมูล (Data Subject Request)</span>
        </h3>
        <p className="text-xs text-slate-400">
          หากท่านประสงค์จะขอลบคำอธิษฐาน หรือถอนความยินยอมในการแสดงผลในสายน้ำตาปี สามารถส่งคำร้องได้ที่นี่
        </p>

        {requestSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>ระบบได้รับคำร้องขอใช้สิทธิของท่านเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตามคำขอภายใน 3 วันทำการ</span>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">รหัสกิจกรรมของคุณ (LK69-XXXXXX)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น LK69-000108"
                  value={participantCode}
                  onChange={e => setParticipantCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ประเภทคำร้อง</label>
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                >
                  <option value="DELETE_WISH">ขอลบคำอธิษฐานออกจากระบบ</option>
                  <option value="WITHDRAW_CONSENT">ขอถอนความยินยอมในการแสดงผลในสายน้ำ</option>
                  <option value="CORRECT_INFO">ขอแก้ไขข้อมูลคำอธิษฐาน</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
              <textarea
                rows={2}
                value={requestDetails}
                onChange={e => setRequestDetails(e.target.value)}
                placeholder="ระบุเหตุผลหรือรายละเอียดที่ต้องการให้ดำเนินการ..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-xs rounded-xl shadow transition-all"
            >
              ส่งคำร้องใช้สิทธิด้านข้อมูล
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
