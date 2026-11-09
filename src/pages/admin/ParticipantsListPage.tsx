import React, { useState, useEffect } from 'react';
import { Search, Users, Gift, CheckCircle2, Waves } from 'lucide-react';
import { ApiService } from '../../services/api';

export const ParticipantsListPage: React.FC = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = async (searchStr?: string) => {
    setLoading(true);
    try {
      const items = await ApiService.getParticipants(searchStr);
      setParticipants(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchList(query);
  };

  const krathongNameMap: Record<string, string> = {
    pwa_blue: 'กระทงสีฟ้า กปภ.',
    eco_banana: 'กระทงรักษ์โลก',
    lotus_pink: 'กระทงดอกบัว',
    moonlight_gold: 'กระทงแสงจันทร์',
    tapi_river: 'กระทงสายน้ำตาปี',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-semibold text-base text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>ทะเบียนผู้เข้าร่วมกิจกรรมทั้งหมด ({participants.length} รายการ)</span>
          </h4>
          <p className="text-xs text-slate-400">
            แสดงสถานะการลอยกระทง และการลงทะเบียนออนไลน์
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xs w-full">
          <input
            type="text"
            placeholder="ค้นหารหัส เช่น LK69-000108"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="py-1.5 px-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold"
          >
            ค้นหา
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">รหัสกิจกรรม</th>
              <th className="py-3 px-3">ชื่อเล่น/นามสมมติ</th>
              <th className="py-3 px-3">รูปแบบกระทง</th>
              <th className="py-3 px-3">ช่องทาง</th>
              <th className="py-3 px-3">สถานะสมัครออนไลน์</th>
              <th className="py-3 px-3">วันที่เข้าร่วม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลผู้เข้าร่วม'}
                </td>
              </tr>
            ) : (
              participants.map(p => (
                <tr key={p.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-3 font-mono font-bold text-amber-300">
                    {p.participant_code}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {p.nickname}
                  </td>
                  <td className="py-3 px-3 text-cyan-200">
                    {krathongNameMap[p.krathong_type] || p.krathong_type}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {p.source_channel === 'WEB_DIRECT' ? 'เว็บตรง' : p.source_channel === 'QR_ONSITE' ? 'สแกน QR บูธ' : 'LINE'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.registration_status === 'NEW_SUCCESS' && p.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : p.registration_status === 'EXISTING_USER'
                        ? 'bg-blue-500/20 text-blue-300'
                        : p.registration_status === 'NOT_RECORDED'
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {p.registration_status === 'NEW_SUCCESS' && 'สมัครใหม่สำเร็จ'}
                      {p.registration_status === 'EXISTING_USER' && 'ลูกค้าเดิม'}
                      {p.registration_status === 'IN_PROGRESS' && 'กำลังดำเนินการ'}
                      {p.registration_status === 'NOT_RECORDED' && 'ยังไม่บันทึก'}
                      {p.registration_status === 'NOT_INTERESTED' && 'ยังไม่ประสงค์'}
                      {p.registration_status === 'REGISTRATION_FAILED' && 'สมัครไม่สำเร็จ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {p.created_at.slice(0, 16).replace('T', ' ')}
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
