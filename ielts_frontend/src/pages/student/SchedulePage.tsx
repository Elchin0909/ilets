import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEnrollments } from '../../api/groups';
import { getLessonsByGroup } from '../../api/lessons';
import { CalendarDays, Clock, BookOpen, FileText, Loader2 } from 'lucide-react';
import type { Lesson } from '../../types';

export default function SchedulePage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollmentsByStudent', studentId],
    queryFn: () => getMyEnrollments(studentId),
    enabled: !!studentId,
  });

  const activeGroupIds = enrollments
    .filter((e) => e.status === 'active' || e.status === 'ACTIVE')
    .map((e) => e.groupId);

  // Fetch lessons for all active groups
  const { data: allLessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['myLessons', activeGroupIds],
    queryFn: async () => {
      const results: (Lesson & { groupName?: string })[] = [];
      for (const gid of activeGroupIds) {
        const enrollment = enrollments.find((e) => e.groupId === gid);
        const lessons = await getLessonsByGroup(gid);
        lessons.forEach((l: any) => results.push({ ...l, groupName: enrollment?.groupName }));
      }
      return results.sort((a: any, b: any) => {
        const da = a.lessonDate || '';
        const db = b.lessonDate || '';
        return db.localeCompare(da);
      });
    },
    enabled: activeGroupIds.length > 0,
  });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = allLessons.filter((l: any) => (l.lessonDate ?? '') >= today);
  const past = allLessons.filter((l: any) => (l.lessonDate ?? '') < today);

  const isLoading = loadingEnrollments || loadingLessons;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays size={28} />
          <h1 className="text-2xl font-bold">Dars Jadvali</h1>
        </div>
        <p className="text-sky-100 text-sm">Barcha darslar va uy vazifalari</p>
        {!isLoading && (
          <div className="flex gap-3 mt-3 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-lg">{upcoming.length} kelasi</span>
            <span className="bg-white/20 px-3 py-1 rounded-lg">{past.length} o'tgan</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
      ) : allLessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          Hali darslar yo'q
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Kelasi darslar</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {upcoming.slice(0, 20).map((l: any) => (
                  <LessonRow key={l.lessonId ?? l.id} lesson={l} isUpcoming />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">O'tgan darslar</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {past.slice(0, 30).map((l: any) => (
                  <LessonRow key={l.lessonId ?? l.id} lesson={l} isUpcoming={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LessonRow({ lesson, isUpcoming }: { lesson: any; isUpcoming: boolean }) {
  const date = lesson.lessonDate
    ? new Date(lesson.lessonDate + 'T00:00:00').toLocaleDateString('uz-UZ', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : '';

  return (
    <div className={`px-5 py-4 ${isUpcoming ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUpcoming ? 'bg-sky-50' : 'bg-gray-50'
        }`}>
          <CalendarDays size={16} className={isUpcoming ? 'text-sky-500' : 'text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-gray-500">{date}</span>
            {lesson.startTime && (
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <Clock size={10} /> {lesson.startTime}
              </span>
            )}
            {lesson.groupName && (
              <span className="text-xs px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded">{lesson.groupName}</span>
            )}
          </div>
          {lesson.topic && (
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
              <BookOpen size={12} className="text-gray-400" /> {lesson.topic}
            </p>
          )}
          {lesson.homework && (
            <p className="text-xs text-orange-600 mt-1 flex items-start gap-1">
              <FileText size={11} className="mt-0.5 flex-shrink-0" /> {lesson.homework}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
