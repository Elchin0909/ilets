import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { getGroups } from '../../api/groups';
import { getLessonsByGroup } from '../../api/lessons';
import { getAttendanceByLesson, bulkMarkAttendance } from '../../api/attendance';
import type { AttendanceMarkRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { showSuccess, showError } from '../../utils/toast';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

const statusVariant: Record<string, 'green' | 'red' | 'yellow' | 'gray'> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'yellow',
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialLessonId = searchParams.get('lessonId') ? Number(searchParams.get('lessonId')) : 0;

  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(initialLessonId);
  const [localAttendance, setLocalAttendance] = useState<Record<number, AttendanceStatus>>({});

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', selectedGroupId],
    queryFn: () => getLessonsByGroup(selectedGroupId),
    enabled: selectedGroupId > 0,
  });
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedLessonId],
    queryFn: () => getAttendanceByLesson(selectedLessonId),
    enabled: selectedLessonId > 0,
  });

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      const map: Record<number, AttendanceStatus> = {};
      attendanceRecords.forEach((r) => { if (r.status) map[r.studentId] = r.status; });
      setLocalAttendance(map);
    }
  }, [attendanceRecords]);

  const saveMutation = useMutation({
    mutationFn: (records: AttendanceMarkRequest[]) =>
      bulkMarkAttendance(selectedLessonId, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedLessonId] });
      showSuccess('Davomat saqlandi!');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleSave = () => {
    const records: AttendanceMarkRequest[] = attendanceRecords.map((r) => ({
      studentId: r.studentId,
      lessonId: selectedLessonId,
      status: localAttendance[r.studentId] ?? 'ABSENT',
    }));
    saveMutation.mutate(records);
  };

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map: Record<number, AttendanceStatus> = {};
    attendanceRecords.forEach((r) => { map[r.studentId] = status; });
    setLocalAttendance(map);
  };

  return (
    <div>
      <PageHeader title="Davomat" subtitle="Dars davomatini belgilash va ko'rish" />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedGroupId}
          onChange={(e) => { setSelectedGroupId(Number(e.target.value)); setSelectedLessonId(0); }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Guruhni tanlang...</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        {selectedGroupId > 0 && (
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(Number(e.target.value))}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Darsni tanlang...</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.lessonDate}{l.topic ? ` — ${l.topic}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {selectedLessonId > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-medium text-gray-700">
              {isLoading ? 'Loading...' : `${attendanceRecords.length} students`}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => markAll('PRESENT')} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                Barchasi keldi
              </button>
              <button onClick={() => markAll('ABSENT')} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                Barchasi kelmadi
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition"
              >
                <Save size={14} />
                {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
              Loading...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Bu guruhda talabalar yo'q</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {attendanceRecords.map((r) => {
                const current = localAttendance[r.studentId];
                return (
                  <div key={r.studentId} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {r.studentName?.charAt(0) ?? '?'}
                      </div>
                      <span className="text-sm text-gray-800">{r.studentName || `Student #${r.studentId}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {current && <Badge label={current} variant={statusVariant[current]} />}
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(r.studentId, s)}
                            className={`px-3 py-1 text-xs font-medium transition ${
                              current === s
                                ? s === 'PRESENT' ? 'bg-green-500 text-white' : s === 'LATE' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedLessonId && (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          Guruh va darsni tanlang
        </div>
      )}
    </div>
  );
}
