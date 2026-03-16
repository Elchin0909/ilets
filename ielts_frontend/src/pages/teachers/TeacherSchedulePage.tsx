import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Users, Layers } from 'lucide-react';
import { getGroups, getEnrollments } from '../../api/groups';
import { getTeachers } from '../../api/teachers';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const DAY_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-red-50 border-red-200 text-red-800',
];

function parseSchedule(schedule?: string): { day: string; time: string }[] {
  if (!schedule) return [];
  // Parse formats like "Du, Cho, Ju 14:00-16:00" or "Dushanba 09:00"
  const parts: { day: string; time: string }[] = [];
  const dayMap: Record<string, string> = {
    'du': 'Dushanba', 'se': 'Seshanba', 'cho': 'Chorshanba', 'ch': 'Chorshanba',
    'pa': 'Payshanba', 'ju': 'Juma', 'sha': 'Shanba', 'sh': 'Shanba', 'ya': 'Yakshanba',
    'dushanba': 'Dushanba', 'seshanba': 'Seshanba', 'chorshanba': 'Chorshanba',
    'payshanba': 'Payshanba', 'juma': 'Juma', 'shanba': 'Shanba', 'yakshanba': 'Yakshanba',
    'mon': 'Dushanba', 'tue': 'Seshanba', 'wed': 'Chorshanba',
    'thu': 'Payshanba', 'fri': 'Juma', 'sat': 'Shanba', 'sun': 'Yakshanba',
  };

  const timeMatch = schedule.match(/(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)/);
  const time = timeMatch ? timeMatch[1] : '';

  const dayPart = schedule.replace(timeMatch?.[0] || '', '').trim();
  const dayTokens = dayPart.split(/[,\s]+/).filter(Boolean);

  dayTokens.forEach((t) => {
    const key = t.toLowerCase().replace(/[^a-z]/g, '');
    const day = dayMap[key];
    if (day) parts.push({ day, time });
  });

  if (parts.length === 0 && schedule.trim()) {
    parts.push({ day: schedule, time: '' });
  }
  return parts;
}

export default function TeacherSchedulePage() {
  const { data: teachers = [], isLoading: lt } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers });
  const { data: groups = [], isLoading: lg } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });

  if (lt || lg) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border p-6 h-32 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">O'qituvchilar Jadvali</h1>
          <p className="text-sm text-gray-500">{(teachers as any[]).length} ta o'qituvchi</p>
        </div>
      </div>

      <div className="space-y-4">
        {(teachers as any[]).map((teacher) => {
          const tGroups = groups.filter((g) => String(g.teacherId) === String(teacher.id ?? teacher.teacherId));
          const totalStudents = tGroups.reduce((acc, g) =>
            acc + enrollments.filter((e) => String(e.groupId) === String(g.id)).length, 0);

          const allSchedules: { groupName: string; day: string; time: string; studentCount: number }[] = [];
          tGroups.forEach((g) => {
            const parsed = parseSchedule(g.schedule);
            const sc = enrollments.filter((e) => String(e.groupId) === String(g.id)).length;
            parsed.forEach(({ day, time }) => allSchedules.push({ groupName: g.name, day, time, studentCount: sc }));
          });

          return (
            <div key={teacher.id ?? teacher.teacherId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Teacher header */}
              <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {teacher.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{teacher.fullName}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Layers size={12} /> {tGroups.length} guruh</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {totalStudents} talaba</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {tGroups.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">Guruh biriktirilmagan</div>
              ) : (
                <div className="p-4">
                  {/* Weekly view */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {tGroups.map((g) => {
                      const sc = enrollments.filter((e) => String(e.groupId) === String(g.id)).length;
                      return (
                        <div key={g.id} className="border border-gray-100 rounded-xl p-3">
                          <p className="font-medium text-sm text-gray-800">{g.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{g.courseName}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock size={11} /> {g.schedule || 'Jadval belgilanmagan'}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Users size={11} /> {sc} talaba
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day tags */}
                  {allSchedules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {DAYS.filter((d) => allSchedules.some((s) => s.day === d)).map((day) => {
                        const dayIdx = DAYS.indexOf(day);
                        const daySch = allSchedules.filter((s) => s.day === day);
                        return (
                          <span key={day} className={`text-xs px-2.5 py-1 rounded-lg border ${DAY_COLORS[dayIdx]}`}>
                            {day.substring(0, 3)}: {daySch.map(s => s.groupName).join(', ')} {daySch[0]?.time && `(${daySch[0].time})`}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
