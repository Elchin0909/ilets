import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Save, Check, X, Clock, Users, MessageSquare } from 'lucide-react';
import { getGroups } from '../../api/groups';
import { getLessonsByGroup } from '../../api/lessons';
import {
  getAttendanceByLesson,
  bulkMarkAttendance,
  type AttendanceRow,
  type BulkAttendanceItem,
} from '../../api/attendance';
import PageHeader from '../../components/ui/PageHeader';
import { showSuccess, showError } from '../../utils/toast';

type Status = 'present' | 'absent' | 'late';

interface LocalRecord {
  status: Status;
  comment: string;
}

// Dars mavzusini formatlash
function lessonLabel(l: { lessonDate: string; topic?: string }) {
  return l.topic ? `${l.lessonDate} — ${l.topic}` : l.lessonDate;
}

// Status badge
function StatusBadge({ status }: { status: Status | null }) {
  if (!status) return null;
  const map = {
    present: { bg: 'bg-green-100 text-green-700', label: 'Keldi' },
    late:    { bg: 'bg-yellow-100 text-yellow-700', label: 'Kech' },
    absent:  { bg: 'bg-red-100 text-red-700', label: 'Kelmadi' },
  };
  const { bg, label } = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg}`}>{label}</span>
  );
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    searchParams.get('lessonId') ?? ''
  );
  // { studentId → { status, comment } }
  const [localData, setLocalData] = useState<Record<string, LocalRecord>>({});
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', selectedGroupId],
    queryFn: () => getLessonsByGroup(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const { data: attendanceRows = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedLessonId],
    queryFn: () => getAttendanceByLesson(selectedLessonId),
    enabled: !!selectedLessonId,
  });

  // Backend ma'lumotlari kelganda localData ni to'ldirish
  useEffect(() => {
    if (attendanceRows.length > 0) {
      const map: Record<string, LocalRecord> = {};
      attendanceRows.forEach((r: AttendanceRow) => {
        map[String(r.studentId)] = {
          status: (r.status as Status) || 'absent',
          comment: r.comment || '',
        };
      });
      setLocalData(map);
    }
  }, [attendanceRows]);

  const saveMutation = useMutation({
    mutationFn: (items: BulkAttendanceItem[]) =>
      bulkMarkAttendance(selectedLessonId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedLessonId] });
      showSuccess('Davomat saqlandi! ✅');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleSave = () => {
    const items: BulkAttendanceItem[] = attendanceRows.map((r: AttendanceRow) => {
      const sid = String(r.studentId);
      const rec = localData[sid] ?? { status: 'absent', comment: '' };
      return {
        studentId: sid,
        status: rec.status,
        comment: rec.comment || undefined,
      };
    });
    saveMutation.mutate(items);
  };

  const setStatus = (studentId: string, status: Status) => {
    setLocalData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, comment: prev[studentId]?.comment || '' },
    }));
    // Agar keldi deb belgilansa, izohni yopish
    if (status === 'present') setOpenCommentId(null);
  };

  const setComment = (studentId: string, comment: string) => {
    setLocalData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment },
    }));
  };

  const markAll = (status: Status) => {
    const map: Record<string, LocalRecord> = {};
    attendanceRows.forEach((r: AttendanceRow) => {
      map[String(r.studentId)] = { status, comment: localData[String(r.studentId)]?.comment || '' };
    });
    setLocalData(map);
    setOpenCommentId(null);
  };

  // Statistika hisoblash
  const presentCount = attendanceRows.filter(r => localData[String(r.studentId)]?.status === 'present').length;
  const lateCount = attendanceRows.filter(r => localData[String(r.studentId)]?.status === 'late').length;
  const absentCount = attendanceRows.filter(r => localData[String(r.studentId)]?.status === 'absent').length;

  // Bugun darslarini birinchi ko'rsatish
  const today = new Date().toISOString().slice(0, 10);
  const sortedLessons = [...lessons].sort((a, b) => {
    if (a.lessonDate === today) return -1;
    if (b.lessonDate === today) return 1;
    return a.lessonDate > b.lessonDate ? -1 : 1;
  });

  return (
    <div>
      <PageHeader title="Davomat" subtitle="Dars davomatini belgilash" />

      {/* Filtrlar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedGroupId}
          onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedLessonId(''); setLocalData({}); }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
        >
          <option value="">Guruhni tanlang...</option>
          {groups.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
        </select>

        {selectedGroupId && (
          <select
            value={selectedLessonId}
            onChange={(e) => { setSelectedLessonId(e.target.value); setLocalData({}); setOpenCommentId(null); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[260px]"
          >
            <option value="">Darsni tanlang...</option>
            {sortedLessons.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.lessonDate === today ? '🟢 ' : ''}{lessonLabel(l)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Davomat jadvali */}
      {selectedLessonId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Users size={15} /> {attendanceRows.length} ta talaba
              </span>
              {attendanceRows.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-medium">✓ {presentCount}</span>
                  <span className="text-yellow-600 font-medium">⏰ {lateCount}</span>
                  <span className="text-red-600 font-medium">✗ {absentCount}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => markAll('present')}
                className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
              >
                Barchasi keldi
              </button>
              <button
                onClick={() => markAll('absent')}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                Barchasi kelmadi
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || attendanceRows.length === 0}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition font-medium"
              >
                <Save size={14} />
                {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>

          {/* Talabalar ro'yxati */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
              Yuklanmoqda...
            </div>
          ) : attendanceRows.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              Bu guruhda faol talabalar yo'q
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {attendanceRows.map((r: AttendanceRow) => {
                const sid = String(r.studentId);
                const rec = localData[sid] ?? { status: 'absent' as Status, comment: '' };
                const isAbsentOrLate = rec.status === 'absent' || rec.status === 'late';
                const showComment = openCommentId === sid;

                return (
                  <div key={sid}>
                    {/* Talaba qatori */}
                    <div className="flex items-center justify-between px-5 py-3">
                      {/* Talaba nomi */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          rec.status === 'present' ? 'bg-green-100 text-green-700' :
                          rec.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {(r.fullName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {r.fullName || `Talaba ${sid.slice(0, 8)}`}
                          </p>
                          {rec.comment && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">📝 {rec.comment}</p>
                          )}
                        </div>
                      </div>

                      {/* Status tugmalari */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={rec.status} />

                        {/* Keldi / Kech / Kelmadi tugmalari */}
                        <div className="flex rounded-lg overflow-hidden border border-gray-200">
                          {/* ✓ Keldi */}
                          <button
                            onClick={() => setStatus(sid, 'present')}
                            title="Keldi"
                            className={`w-10 h-9 flex items-center justify-center transition ${
                              rec.status === 'present'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-400 hover:bg-green-50 hover:text-green-600'
                            }`}
                          >
                            <Check size={16} strokeWidth={2.5} />
                          </button>

                          {/* ⏰ Kech */}
                          <button
                            onClick={() => setStatus(sid, 'late')}
                            title="Kech qoldi"
                            className={`w-10 h-9 flex items-center justify-center border-l border-gray-200 transition ${
                              rec.status === 'late'
                                ? 'bg-yellow-400 text-white'
                                : 'bg-white text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                            }`}
                          >
                            <Clock size={15} />
                          </button>

                          {/* ✗ Kelmadi */}
                          <button
                            onClick={() => setStatus(sid, 'absent')}
                            title="Kelmadi"
                            className={`w-10 h-9 flex items-center justify-center border-l border-gray-200 transition ${
                              rec.status === 'absent'
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Izoh tugmasi (faqat kelmadi/kech uchun) */}
                        {isAbsentOrLate && (
                          <button
                            onClick={() => setOpenCommentId(showComment ? null : sid)}
                            title="Sabab yozing"
                            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition ${
                              rec.comment
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-indigo-500'
                            }`}
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Izoh maydoni (kengaytirilgan) */}
                    {showComment && isAbsentOrLate && (
                      <div className="px-5 pb-3">
                        <div className="ml-12 flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={rec.comment}
                            onChange={(e) => setComment(sid, e.target.value)}
                            placeholder={rec.status === 'late' ? "Kech qolish sababi (ixtiyoriy)..." : "Kelmagan sababi (ixtiyoriy)..."}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
                          />
                          <button
                            onClick={() => setOpenCommentId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2"
                          >
                            Yopish
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer - saqlov */}
          {attendanceRows.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition"
              >
                <Save size={16} />
                {saveMutation.isPending ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Guruh va darsni tanlang</p>
          <p className="text-gray-400 text-sm mt-1">
            {selectedGroupId ? 'Darsni tanlang' : 'Avval guruhni tanlang'}
          </p>
        </div>
      )}
    </div>
  );
}
