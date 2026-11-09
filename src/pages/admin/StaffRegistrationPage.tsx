import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertCircle, Clock, ShieldCheck, Filter } from 'lucide-react';
import { ApiService } from '../../services/api';
import { AdminProfile, CustomerStatus, OnlineRegistration, VerificationStatus } from '../../types';

interface StaffRegistrationPageProps {
  currentUser: AdminProfile;
  onSuccess: () => void;
}

export const StaffRegistrationPage: React.FC<StaffRegistrationPageProps> = ({
  currentUser,
  onSuccess,
}) => {
  const [participantCode, setParticipantCode] = useState('');
  const [serviceType, setServiceType] = useState('PWA_PLUS_LIFE');
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>('NEW_SUCCESS');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('VERIFIED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recentRegistrations, setRecentRegistrations] = useState<OnlineRegistration[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerification, setFilterVerification] = useState('');

  const fetchRegistrations = async () => {
    try {
      const items = await ApiService.getRegistrations(filterStatus, filterVerification);
      setRecentRegistrations(items);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus, filterVerification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = participantCode.trim().toUpperCase();
    if (!code) {
      setError('กรุณากรอกรหัสกิจกรรม (เช่น LK69-000108)');
      return;
    }

    setSubmitting(true);
    try {
      await ApiService.submitRegistration({
        participant_code: code,
        service_type: serviceType,
        customer_status: customerStatus,
        verification_status: verificationStatus,
        notes: notes.trim() || undefined,
      });

      setParticipantCode('');
      setNotes('');
      fetchRegistrations();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Verification Guidelines Box */}
      <div className="p-4 rounded-2xl bg-[#073B66]/60 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">คู่มือการตรวจสอบสำหรับเจ้าหน้าที่ กปภ.:</strong>{' '}
          ยอดสมัครใหม่สำเร็จ (ที่จะนับเข้า KPI อัตโนมัติ) ต้องเป็นรายการที่ 1) ผู้เข้าร่วมสมัครแอป PWA Plus Life หรือ LINE @pwathailand ใหม่จริง 2) สมัครในช่วงเวลากิจกรรม 3) เจ้าหน้าที่ตรวจสอบหลักฐานบนหน้าจอมือถือของลูกค้าแล้ว และ 4) มีสถานะ “1. สมัครใหม่สำเร็จ” และ “ตรวจสอบสำเร็จ”
        </div>
      </div>

      {/* Main Registration Form */}
      <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-3xl space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">
          บันทึกผลการสมัครบริการออนไลน์ (Staff Verification Form)
        </h3>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Participant Code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                รหัสกิจกรรม <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="LK69-XXXXXX"
                  value={participantCode}
                  onChange={e => setParticipantCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono uppercase focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                ช่องทางบริการ กปภ.
              </label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
              >
                <option value="PWA_PLUS_LIFE">แอปพลิเคชัน PWA Plus Life</option>
                <option value="LINE_PWA">LINE Official @pwathailand</option>
                <option value="PWA_WEB_PAY">ระบบชำระเงินออนไลน์ (Web Payment)</option>
              </select>
            </div>

            {/* Customer Status (Mandatory 5 states) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                สถานะลูกค้า (5 ระดับ) <span className="text-rose-400">*</span>
              </label>
              <select
                value={customerStatus}
                onChange={e => setCustomerStatus(e.target.value as CustomerStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-cyan-400 focus:outline-none"
              >
                <option value="NEW_SUCCESS">1. สมัครใหม่สำเร็จในกิจกรรม (นับยอดสำเร็จ)</option>
                <option value="EXISTING_USER">2. มีบัญชีอยู่แล้ว (ลูกค้าเดิม)</option>
                <option value="IN_PROGRESS">3. อยู่ระหว่างดำเนินการสมัคร</option>
                <option value="NOT_INTERESTED">4. ยังไม่ประสงค์สมัคร</option>
                <option value="REGISTRATION_FAILED">5. สมัครไม่สำเร็จ</option>
              </select>
            </div>

            {/* Verification Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                ผลการตรวจสอบหลักฐาน
              </label>
              <select
                value={verificationStatus}
                onChange={e => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
              >
                <option value="VERIFIED">✓ ตรวจสอบสำเร็จ (หลักฐานถูกต้อง)</option>
                <option value="PENDING">⏳ รอตรวจสอบ</option>
                <option value="REJECTED">✕ ตรวจสอบไม่ผ่าน</option>
              </select>
            </div>

          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              หมายเหตุการตรวจสอบ (ไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="เช่น ตรวจสอบหน้าจอแอป PWA Plus Life ณ บูธ กปภ. เรียบร้อยแล้ว"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจสอบ'}
          </button>
        </form>
      </div>

      {/* Registrations Filter & Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-semibold text-base text-white">
              ประวัติการตรวจสอบผลการสมัคร ({recentRegistrations.length} รายการ)
            </h4>
            <p className="text-xs text-slate-400">รายการบันทึกสถานะโดยเจ้าหน้าที่ กปภ.</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
            >
              <option value="">ทุกสถานะลูกค้า</option>
              <option value="NEW_SUCCESS">1. สมัครใหม่สำเร็จ</option>
              <option value="EXISTING_USER">2. มีบัญชีอยู่แล้ว</option>
              <option value="IN_PROGRESS">3. อยู่ระหว่างดำเนินการ</option>
              <option value="NOT_INTERESTED">4. ยังไม่ประสงค์สมัคร</option>
              <option value="REGISTRATION_FAILED">5. สมัครไม่สำเร็จ</option>
            </select>

            <select
              value={filterVerification}
              onChange={e => setFilterVerification(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
            >
              <option value="">ทุกผลการตรวจ</option>
              <option value="VERIFIED">ตรวจสอบสำเร็จ</option>
              <option value="PENDING">รอตรวจสอบ</option>
              <option value="REJECTED">ตรวจสอบไม่ผ่าน</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">รหัสกิจกรรม</th>
                <th className="py-3 px-3">ช่องทางบริการ</th>
                <th className="py-3 px-3">สถานะลูกค้า</th>
                <th className="py-3 px-3">ผลการตรวจสอบ</th>
                <th className="py-3 px-3">เจ้าหน้าที่ผู้ตรวจ</th>
                <th className="py-3 px-3">หมายเหตุ</th>
                <th className="py-3 px-3">วันที่บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    ไม่พบข้อมูลการสมัครบริการออนไลน์ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                recentRegistrations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-950/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {r.participant_code}
                    </td>
                    <td className="py-3 px-3">
                      {r.service_type === 'PWA_PLUS_LIFE' ? 'PWA Plus Life' : 'LINE @pwathailand'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.customer_status === 'NEW_SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : r.customer_status === 'EXISTING_USER'
                          ? 'bg-blue-500/20 text-blue-300'
                          : r.customer_status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.customer_status === 'NEW_SUCCESS' && '1. สมัครใหม่สำเร็จ'}
                        {r.customer_status === 'EXISTING_USER' && '2. มีบัญชีอยู่แล้ว'}
                        {r.customer_status === 'IN_PROGRESS' && '3. อยู่ระหว่างดำเนินการ'}
                        {r.customer_status === 'NOT_INTERESTED' && '4. ยังไม่ประสงค์สมัคร'}
                        {r.customer_status === 'REGISTRATION_FAILED' && '5. สมัครไม่สำเร็จ'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.verification_status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : r.verification_status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {r.verification_status === 'VERIFIED' && '✓ ตรวจสอบสำเร็จ'}
                        {r.verification_status === 'PENDING' && '⏳ รอตรวจสอบ'}
                        {r.verification_status === 'REJECTED' && '✕ ไม่ผ่าน'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {r.verified_by_name || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {r.created_at.slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
