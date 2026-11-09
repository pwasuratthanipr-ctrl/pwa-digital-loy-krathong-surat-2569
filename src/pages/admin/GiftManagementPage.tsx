import React, { useState, useEffect } from 'react';
import { Gift, AlertTriangle, CheckCircle2, AlertCircle, PackageCheck, History, Award } from 'lucide-react';
import { ApiService } from '../../services/api';
import { AdminProfile, Gift as GiftType, GiftRedemption } from '../../types';

interface GiftManagementPageProps {
  currentUser: AdminProfile;
  onSuccess: () => void;
}

export const GiftManagementPage: React.FC<GiftManagementPageProps> = ({
  currentUser,
  onSuccess,
}) => {
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [redemptions, setRedemptions] = useState<GiftRedemption[]>([]);
  const [participantCode, setParticipantCode] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchGifts = async () => {
    try {
      const data = await ApiService.getGifts();
      setGifts(data.gifts || []);
      setRedemptions(data.redemptions || []);
      if (data.gifts && data.gifts.length > 0 && !selectedGiftId) {
        setSelectedGiftId(data.gifts[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const code = participantCode.trim().toUpperCase();
    if (!code) {
      setError('กรุณากรอกรหัสกิจกรรม (เช่น LK69-000108)');
      return;
    }
    if (!selectedGiftId) {
      setError('กรุณาเลือกของที่ระลึกที่ต้องการมอบ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.redeemGift(code, selectedGiftId);
      setSuccessMsg(res.message);
      setParticipantCode('');
      fetchGifts();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถมอบของที่ระลึกได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Policy Guidance */}
      <div className="p-4 rounded-2xl bg-[#073B66]/60 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
        <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">เงื่อนไขการมอบของที่ระลึก กปภ.:</strong>{' '}
          ระบบมีกลไกป้องกันการรับของซ้ำ (Anti-Double Redemption) โดย 1 รหัสกิจกรรมสามารถรับของที่ระลึกได้ตามเกณฑ์กิจกรรม และไม่อนุญาตให้ระบบตัดสต็อกของที่ระลึกอัตโนมัติเพียงเพราะผู้ใช้กดปุ่มบนหน้าเว็บ เจ้าหน้าที่จะต้องตรวจสอบหลักฐานก่อนกดยืนยันมอบของที่ระลึกเท่านั้น
        </div>
      </div>

      {/* Gift Inventory Cards */}
      <div>
        <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-300" />
          <span>คลังของที่ระลึก กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ) (Inventory)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gifts.map(g => {
            const isLowStock = g.remaining_quantity <= g.alert_threshold;
            const percentage = Math.round((g.remaining_quantity / (g.initial_quantity || 1)) * 100);

            return (
              <div
                key={g.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLowStock
                    ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-900/90 border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-heading font-bold text-white text-sm">
                    {g.gift_name}
                  </h4>
                  {isLowStock && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/40 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>ใกล้หมด</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {g.description || 'ของที่ระลึกส่งเสริมบริการออนไลน์ กปภ.'}
                </p>

                {/* Stock numbers */}
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs text-slate-400">คงเหลือในคลัง:</span>
                  <span className="font-heading font-extrabold text-xl text-white">
                    <span className={isLowStock ? 'text-rose-400' : 'text-emerald-400'}>
                      {g.remaining_quantity}
                    </span>{' '}
                    <span className="text-xs font-normal text-slate-400">/ {g.initial_quantity} ชิ้น</span>
                  </span>
                </div>

                {/* Stock progress */}
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${
                      isLowStock ? 'bg-rose-500' : percentage < 50 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                  <span>เกณฑ์แจ้งเตือน: &le; {g.alert_threshold} ชิ้น</span>
                  <span>กลุ่มเป้าหมาย: {g.eligible_group === 'NEW_VERIFIED' ? 'ผู้สมัครใหม่' : 'ลูกค้าเดิม'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemption Form */}
      <div className="bg-slate-900/90 border border-amber-400/30 p-6 rounded-3xl space-y-4 shadow-xl">
        <h3 className="font-heading font-bold text-lg text-amber-300 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-amber-400" />
          <span>บันทึกการมอบของที่ระลึกแก่ผู้เข้าร่วม</span>
        </h3>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRedeem} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              รหัสกิจกรรมของผู้รับ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="LK69-XXXXXX"
              value={participantCode}
              onChange={e => setParticipantCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              เลือกของที่ระลึกที่จะมอบ <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedGiftId}
              onChange={e => setSelectedGiftId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            >
              {gifts.map(g => (
                <option key={g.id} value={g.id} disabled={g.remaining_quantity <= 0}>
                  {g.gift_name} (คงเหลือ {g.remaining_quantity} ชิ้น)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-xs rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'ยืนยันมอบของที่ระลึก'}
            </button>
          </div>

        </form>
      </div>

      {/* Recent Redemptions Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-semibold text-base text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>ประวัติการมอบของที่ระลึกล่าสุด ({redemptions.length} รายการ)</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">รหัสกิจกรรม</th>
                <th className="py-3 px-3">ของที่ระลึกที่ได้รับ</th>
                <th className="py-3 px-3">เจ้าหน้าที่ผู้มอบ</th>
                <th className="py-3 px-3">วันและเวลาที่มอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    ยังไม่มีรายการมอบของที่ระลึก
                  </td>
                </tr>
              ) : (
                redemptions.map(r => (
                  <tr key={r.id} className="hover:bg-slate-950/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {r.participant_code}
                    </td>
                    <td className="py-3 px-3 font-medium text-white">
                      {r.gift_name}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {r.redeemed_by_name}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {r.redeemed_at.slice(0, 16).replace('T', ' ')}
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
