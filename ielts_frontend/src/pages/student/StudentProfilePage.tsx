import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudent } from '../../api/students';
import { updateStudentAvatar } from '../../api/students';
import { getEnrollmentsByStudent } from '../../api/groups';
import { getStudentAttendancePercent } from '../../api/attendance';
import { getStudentExamResults } from '../../api/exams';
import { getActiveSession } from '../../api/quiz';
import { getLessonsByGroup } from '../../api/lessons';
import { uploadAvatar } from '../../api/upload';
import { BookOpen, TrendingUp, ClipboardList, Phone, Mail, Calendar, PlayCircle, FileText, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8080';

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <Icon size={22} className={`${color} mx-auto mb-2`} />
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-gray-300">—</span>;
  const color = score >= 7
    ? 'text-green-600 bg-green-50'
    : score >= 5.5
    ? 'text-yellow-600 bg-yellow-50'
    : 'text-red-600 bg-red-50';
  return <span className={`px-2 py-0.5 rounded-md text-sm font-semibold ${color}`}>{score}</span>;
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentId = user?.studentId ?? '';
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollmentsByStudent', studentId],
    queryFn: () => getEnrollmentsByStudent(studentId),
    enabled: !!studentId,
  });

  const { data: attendancePercent, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendancePercent', studentId],
    queryFn: () => getStudentAttendancePercent(studentId),
    enabled: !!studentId,
  });

  const { data: examResults = [], isLoading: loadingExams } = useQuery({
    queryKey: ['studentExamResults', studentId],
    queryFn: () => getStudentExamResults(studentId),
    enabled: !!studentId,
  });

  const { data: activeSession } = useQuery({
    queryKey: ['activeQuizSession', studentId],
    queryFn: getActiveSession,
    enabled: !!studentId,
    refetchInterval: 30000,
  });

  // Fetch lessons for first active group to show homework
  const firstActiveGroupId = enrollments.find(e => e.status === 'active' || e.status === 'ACTIVE')?.groupId ?? null;
  const { data: groupLessons = [] } = useQuery({
    queryKey: ['lessons', firstActiveGroupId],
    queryFn: () => getLessonsByGroup(firstActiveGroupId!),
    enabled: !!firstActiveGroupId,
  });
  const homeworkLessons = groupLessons.filter((l: any) => l.homework && l.homework.trim() !== '').slice(-5).reverse();

  const avatarMutation = useMutation({
    mutationFn: ({ url }: { url: string }) => updateStudentAvatar(studentId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast.success('Rasm yangilandi!');
    },
    onError: () => toast.error('Rasmni saqlashda xatolik'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await avatarMutation.mutateAsync({ url });
    } catch {
      toast.error('Rasmni yuklashda xatolik');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayName = student?.fullName ?? user?.username ?? '?';
  const attendancePct = attendancePercent != null ? Math.round(Number(attendancePercent)) : null;

  const avatarSrc = student?.avatarUrl
    ? (student.avatarUrl.startsWith('http') ? student.avatarUrl : `${BASE_URL}${student.avatarUrl}`)
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Active Exam Alert */}
      {activeSession && !activeSession.alreadySubmitted && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4 animate-pulse-once">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <PlayCircle size={22} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm">🔴 Faol Imtihon!</p>
              <p className="text-red-600 text-xs mt-0.5">{activeSession.testTitle} — {activeSession.questions?.length ?? '?'} savol</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/quiz/take/${activeSession.sessionId}`)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition whitespace-nowrap"
          >
            <PlayCircle size={16} /> Imtihonni Boshlash
          </button>
        </div>
      )}
      {activeSession && activeSession.alreadySubmitted && (
        <div className="bg-green-50 border border-green-300 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={16} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700 text-sm">Imtihon topshirildi ✓</p>
            <p className="text-green-600 text-xs">{activeSession.testTitle}</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50"
              title="Rasmni o'zgartirish"
            >
              {uploading ? <Loader2 size={13} className="text-indigo-600 animate-spin" /> : <Camera size={13} className="text-indigo-600" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {loadingStudent ? <span className="opacity-50">Yuklanmoqda...</span> : displayName}
            </h1>
            <p className="text-indigo-100 mt-1">Talaba</p>
            {student?.phone && (
              <p className="text-indigo-200 text-sm mt-0.5 flex items-center gap-1">
                <Phone size={13} /> {student.phone}
              </p>
            )}
            {student?.email && (
              <p className="text-indigo-200 text-sm mt-0.5 flex items-center gap-1">
                <Mail size={13} /> {student.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={BookOpen}
          value={loadingEnrollments ? '…' : enrollments.length}
          label="Guruhlar"
          color="text-indigo-500"
        />
        <StatCard
          icon={TrendingUp}
          value={loadingAttendance ? '…' : attendancePct != null ? `${attendancePct}%` : '—'}
          label="Davomat"
          color={attendancePct != null && attendancePct >= 75 ? 'text-green-500' : 'text-orange-500'}
        />
        <StatCard
          icon={ClipboardList}
          value={loadingExams ? '…' : examResults.length}
          label="Imtihonlar"
          color="text-purple-500"
        />
      </div>

      {/* My groups */}
      <div className="bg-white rounded-xl border border-gray-200 mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" /> Mening Guruhlarim
          </h2>
        </div>
        {loadingEnrollments ? (
          <div className="p-5 space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Hali birorta guruhga yozilmagan</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <BookOpen size={14} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {e.groupName ?? `Guruh #${e.groupId.slice(0, 6)}`}
                    </p>
                    {e.enrolledAt && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {new Date(e.enrolledAt).toLocaleDateString('uz-UZ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  e.status === 'active' || e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  e.status === 'completed' || e.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {(e.status === 'active' || e.status === 'ACTIVE') ? 'Faol' : (e.status === 'completed' || e.status === 'COMPLETED') ? 'Tugallangan' : e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Homework section */}
      {homeworkLessons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-5">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={16} className="text-orange-500" /> Uy Vazifalari
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {homeworkLessons.map((l: any) => (
              <div key={l.id ?? l.lessonId} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {l.lessonDate ? new Date(l.lessonDate + 'T00:00:00').toLocaleDateString('uz-UZ') : ''} 
                      {l.topic ? ` — ${l.topic}` : ''}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{l.homework}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam results */}
      <div className="bg-white rounded-xl border border-gray-200 mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-purple-500" /> So'nggi Imtihon Natijalari
          </h2>
        </div>
        {loadingExams ? (
          <div className="p-5 space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : examResults.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Hali imtihon natijasi yo'q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Imtihon</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Overall</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">L</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">R</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">W</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">S</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {examResults.slice(0, 5).map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.examTitle ?? `Imtihon #${i + 1}`}</td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.overall ?? r.score} /></td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.listening ?? r.listeningScore} /></td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.reading ?? r.readingScore} /></td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.writing ?? r.writingScore} /></td>
                    <td className="px-4 py-3 text-center"><ScoreBadge score={r.speaking ?? r.speakingScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Mening Ma'lumotlarim</h2>
        </div>
        <div className="px-5 text-sm">
          {[
            { label: 'Username', value: `@${user?.username}` },
            { label: "To'liq ism", value: student?.fullName },
            { label: 'Telefon', value: student?.phone },
            { label: 'Email', value: student?.email },
          ].filter(({ value }) => value).map(({ label, value }) => (
            <div key={label} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
          <div className="flex justify-between py-3">
            <span className="text-gray-500">Rol</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-medium text-xs">Talaba</span>
          </div>
        </div>
      </div>
    </div>
  );
}
