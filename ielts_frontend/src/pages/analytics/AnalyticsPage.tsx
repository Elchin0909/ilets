import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Layers, BookOpen, TrendingUp, Award, BarChart2, ClipboardList, PenLine, FileText } from 'lucide-react';
import { getStudents } from '../../api/students';
import { getTeachers } from '../../api/teachers';
import { getGroups, getEnrollments } from '../../api/groups';
import { getCourses } from '../../api/courses';
import { getWritingStats } from '../../api/ai';

/* ── Helpers ─────────────────────────────── */
function StatBlock({ icon: Icon, value, label, color, bg }: {
  icon: React.ElementType; value: string | number; label: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-gray-500 truncate text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-xs font-semibold text-gray-700 text-right">{value}</span>
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner:      'bg-red-400',
  Elementary:    'bg-orange-400',
  'Pre-IELTS':   'bg-yellow-400',
  'IELTS Ready': 'bg-blue-400',
  Advanced:      'bg-green-500',
};
const LEVEL_TEXT: Record<string, string> = {
  Beginner:      'text-red-600',
  Elementary:    'text-orange-600',
  'Pre-IELTS':   'text-yellow-600',
  'IELTS Ready': 'text-blue-600',
  Advanced:      'text-green-600',
};

/* ── Main ──────────────────────────────────── */
export default function AnalyticsPage() {
  const { data: students = [], isLoading: ls } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: teachers = [], isLoading: lt } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers });
  const { data: groups = [], isLoading: lg } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: courses = [], isLoading: lc } = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });
  const { data: writingStats } = useQuery({ queryKey: ['writing-stats'], queryFn: getWritingStats });

  const loading = ls || lt || lg || lc;

  /* Students per teacher */
  const teacherEnrollCount: Record<string, { name: string; count: number }> = {};
  groups.forEach((g) => {
    const teachId = String(g.teacherId);
    const teacher = (teachers as any[]).find((t) => String(t.id ?? t.teacherId) === teachId);
    const name = teacher?.fullName ?? `O'qituvchi`;
    if (!teacherEnrollCount[teachId]) teacherEnrollCount[teachId] = { name, count: 0 };
    teacherEnrollCount[teachId].count += enrollments.filter((e) => String(e.groupId) === String(g.id)).length;
  });
  const topTeachers = Object.values(teacherEnrollCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxTeacher = Math.max(...topTeachers.map((t) => t.count), 1);

  /* Students per group */
  const groupStudentCount = groups.map((g) => ({
    name: g.name,
    count: enrollments.filter((e) => String(e.groupId) === String(g.id)).length,
  })).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxGroup = Math.max(...groupStudentCount.map((g) => g.count), 1);

  /* Students per course */
  const courseStudentCount: Record<string, { name: string; count: number }> = {};
  groups.forEach((g) => {
    const cId = String(g.courseId);
    const course = (courses as any[]).find((c) => String(c.id ?? c.courseId) === cId);
    const name = course?.name ?? `Kurs`;
    if (!courseStudentCount[cId]) courseStudentCount[cId] = { name, count: 0 };
    courseStudentCount[cId].count += enrollments.filter((e) => String(e.groupId) === String(g.id)).length;
  });
  const topCourses = Object.values(courseStudentCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCourse = Math.max(...topCourses.map((c) => c.count), 1);

  /* Enrollment status breakdown */
  const statusCounts = { ACTIVE: 0, COMPLETED: 0, DROPPED: 0 };
  enrollments.forEach((e) => {
    const s = e.status?.toUpperCase() as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });
  const totalEnr = enrollments.length || 1;

  /* Writing stats */
  const writingByLevel = Object.entries(writingStats?.byLevel ?? {}).sort((a, b) => b[1] - a[1]);
  const maxWritingLevel = Math.max(...writingByLevel.map(([, v]) => v), 1);
  const task1Count = writingStats?.byTaskType?.['task1'] ?? 0;
  const task2Count = writingStats?.byTaskType?.['task2'] ?? 0;
  const totalTasks = (task1Count + task2Count) || 1;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BarChart2 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Umumiy Statistika</h1>
          <p className="text-sm text-gray-500">Markazning to'liq tahlili</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock icon={Users} value={students.length} label="Jami Talabalar" color="text-blue-600" bg="bg-blue-50" />
        <StatBlock icon={GraduationCap} value={teachers.length} label="Jami O'qituvchilar" color="text-purple-600" bg="bg-purple-50" />
        <StatBlock icon={Layers} value={groups.length} label="Jami Guruhlar" color="text-green-600" bg="bg-green-50" />
        <StatBlock icon={BookOpen} value={courses.length} label="Jami Kurslar" color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Enrollment status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Faol', count: statusCounts.ACTIVE, color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-100' },
          { label: 'Tugallangan', count: statusCounts.COMPLETED, color: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: "Tark etgan", count: statusCounts.DROPPED, color: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50 border-red-100' },
        ].map(({ label, count, color, text, bg }) => (
          <div key={label} className={`rounded-2xl border p-5 ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">{label}</span>
              <span className={`text-lg font-bold ${text}`}>{count}</span>
            </div>
            <div className="h-2 bg-white/70 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((count / totalEnr) * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{Math.round((count / totalEnr) * 100)}% barcha yozilishlardan</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top teachers by students */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={16} className="text-purple-500" /> O'qituvchilar — Talabalar soni
          </h2>
          {topTeachers.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {topTeachers.map((t) => (
                <BarRow key={t.name} label={t.name} value={t.count} max={maxTeacher} color="bg-purple-400" />
              ))}
            </div>
          )}
        </div>

        {/* Top groups by students */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Layers size={16} className="text-green-500" /> Guruhlar — Talabalar soni
          </h2>
          {groupStudentCount.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {groupStudentCount.map((g) => (
                <BarRow key={g.name} label={g.name} value={g.count} max={maxGroup} color="bg-green-400" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-orange-500" /> Kurslar — Talabalar soni
        </h2>
        {topCourses.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Ma'lumot yo'q</p>
        ) : (
          <div className="space-y-2.5">
            {topCourses.map((c) => (
              <BarRow key={c.name} label={c.name} value={c.count} max={maxCourse} color="bg-orange-400" />
            ))}
          </div>
        )}
      </div>

      {/* ── AI Writing Statistikasi ─────────────────────────────────── */}
      {writingStats && (
        <>
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <PenLine size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">AI Writing Statistikasi</h2>
              <p className="text-xs text-gray-500">Jami {writingStats.total} ta tekshiruv amalga oshirilgan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Level distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <BarChart2 size={15} className="text-indigo-500" /> Darajalar bo'yicha
              </h3>
              {writingByLevel.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Hali tekshiruv yo'q</p>
              ) : (
                <div className="space-y-2.5">
                  {writingByLevel.map(([level, count]) => (
                    <BarRow
                      key={level}
                      label={level}
                      value={count}
                      max={maxWritingLevel}
                      color={LEVEL_COLORS[level] ?? 'bg-indigo-400'}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Task type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <FileText size={15} className="text-blue-500" /> Task turi bo'yicha
              </h3>
              {(task1Count + task2Count) === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Hali tekshiruv yo'q</p>
              ) : (
                <div className="space-y-5">
                  {[
                    { label: 'Task 1 (Report/Letter)', count: task1Count, color: 'bg-blue-400', textColor: 'text-blue-700' },
                    { label: 'Task 2 (Essay)', count: task2Count, color: 'bg-indigo-500', textColor: 'text-indigo-700' },
                  ].map(({ label, count, color, textColor }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-medium">{label}</span>
                        <span className={`font-bold ${textColor}`}>
                          {count} ta ({Math.round((count / totalTasks) * 100)}%)
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.round((count / totalTasks) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent writing logs table */}
          {writingStats.recent.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <PenLine size={15} className="text-indigo-500" /> So'nggi tekshiruvlar
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2.5 font-medium">Talaba</th>
                      <th className="text-left pb-2.5 font-medium">Task</th>
                      <th className="text-left pb-2.5 font-medium">Daraja</th>
                      <th className="text-left pb-2.5 font-medium">Band</th>
                      <th className="text-left pb-2.5 font-medium">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {writingStats.recent.map((log: any) => (
                      <tr key={log.logId} className="hover:bg-gray-50 transition">
                        <td className="py-2.5 text-gray-700 font-medium">
                          {log.studentName ?? <span className="text-gray-400 italic text-xs">—</span>}
                        </td>
                        <td className="py-2.5 text-gray-500 text-xs">
                          {log.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-xs font-semibold ${LEVEL_TEXT[log.level] ?? 'text-gray-600'}`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-600 font-mono text-xs">{log.bandRange}</td>
                        <td className="py-2.5 text-gray-400 text-xs">
                          {new Date(log.createdAt).toLocaleDateString('uz-UZ', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <TrendingUp size={20} className="text-indigo-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          <p className="text-xs text-gray-500">Jami Yozilishlar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <Users size={20} className="text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {groups.length > 0 ? Math.round(enrollments.length / groups.length) : 0}
          </p>
          <p className="text-xs text-gray-500">O'rtacha talaba/guruh</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <GraduationCap size={20} className="text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {teachers.length > 0 ? Math.round(groups.length / teachers.length) : 0}
          </p>
          <p className="text-xs text-gray-500">O'rtacha guruh/o'qituvchi</p>
        </div>
      </div>
    </div>
  );
}
