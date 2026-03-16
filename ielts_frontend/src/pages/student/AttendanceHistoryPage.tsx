import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { CheckCircle, XCircle, Clock, FileText, Loader2, TrendingUp } from 'lucide-react';

interface AttendanceRow {
  lessonId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | null;
  comment?: string;
  lessonDate?: string;
  fullName?: string;
}

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['myAttendance', studentId],
    queryFn: () => api.get<AttendanceRow[]>(`/attendance/my/${studentId}`).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: percent } = useQuery({
    queryKey: ['myAttendancePercent', studentId],
    queryFn: () => api.get<number>(`/attendance/my/${studentId}/percent`).then((r) => r.data),
    enabled: !!studentId,
  });

  const sorted = [...rows].sort((a, b) => (b.lessonDate ?? '').localeCompare(a.lessonDate ?? ''));
  const presentCount = rows.filter((r) => r.status === 'present').length;
  const absentCount = rows.filter((r) => r.status === 'absent').length;
  const lateCount = rows.filter((r) => r.status === 'late').length;

  const pct = percent != null ? Math.round(percent) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} />
          <h1 className="text-2xl font-bold">Mening Davomatim</h1>
        </div>
        <p className="text-green-100 text-sm">Barcha darslar bo'yicha davomat tarixi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingUp size={18} className={`mx-auto mb-1 ${pct != null && pct >= 75 ? 'text-green-500' : 'text-orange-500'}`} />
          <div className="text-xl font-bold text-gray-900">{pct != null ? `${pct}%` : '—'}</div>
          <div className="text-xs text-gray-400">Umumiy</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <CheckCircle size={18} className="text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-600">{presentCount}</div>
          <div className="text-xs text-gray-400">Keldi</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <XCircle size={18} className="text-red-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-600">{absentCount}</div>
          <div className="text-xs text-gray-400">Kelmadi</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Clock size={18} className="text-yellow-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-600">{lateCount}</div>
          <div className="text-xs text-gray-400">Kechikdi</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Hali davomat ma'lumoti yo'q</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sorted.map((row, i) => {
              const date = row.lessonDate
                ? new Date(row.lessonDate + 'T00:00:00').toLocaleDateString('uz-UZ', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })
                : '';
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <StatusIcon status={row.status} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{date}</p>
                    {row.comment && <p className="text-xs text-gray-400 mt-0.5">{row.comment}</p>}
                  </div>
                  <StatusBadge status={row.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === 'present') return <CheckCircle size={18} className="text-green-500" />;
  if (status === 'absent') return <XCircle size={18} className="text-red-500" />;
  if (status === 'late') return <Clock size={18} className="text-yellow-500" />;
  return <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200" />;
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'present') return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Keldi</span>;
  if (status === 'absent') return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Kelmadi</span>;
  if (status === 'late') return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">Kechikdi</span>;
  return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">—</span>;
}
