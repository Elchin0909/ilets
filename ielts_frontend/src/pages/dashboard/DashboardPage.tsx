import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, Layers, BookOpen, TrendingUp,
  ArrowRight, BotMessageSquare, X, Send, Loader2,
  AlertTriangle, CalendarCheck, CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../api/students';
import { getTeachers } from '../../api/teachers';
import { getGroups } from '../../api/groups';
import { getCourses } from '../../api/courses';
import { useAuth } from '../../contexts/AuthContext';
import { aiChat } from '../../api/ai';
import { getLowAttendanceStudents, type LowAttendanceStudent } from '../../api/attendance';
import api from '../../api/axios';

// Backend Lesson entity (raw from /api/lessons/today)
interface LessonRaw {
  lessonId: string;
  groupId: string;
  lessonDate: string;
  topic?: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  to: string;
}

function StatCard({ label, value, icon: Icon, color, bg, to }: StatCardProps) {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} flex-shrink-0`}>
        <Icon size={24} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-100 rounded w-16" />
      </div>
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Salom! Men IELTS markazi yordamchisiman. Savollaringizga javob berishga tayyorman 🎓" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const reply = await aiChat(msg);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "Kechirasiz, xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="AI Yordamchi"
      >
        {open ? <X size={22} /> : <BotMessageSquare size={22} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <BotMessageSquare size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">IELTS AI Yordamchi</p>
              <p className="text-indigo-200 text-xs">Powered by OpenAI</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-indigo-200 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Savol yozing..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white rounded-xl flex items-center justify-center transition flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Bugungi darslar widget
function TodayLessonsWidget({ groups }: { groups: Array<{ id: string; name: string }> }) {
  const { data: todayLessons = [], isLoading } = useQuery({
    queryKey: ['lessons-today'],
    queryFn: () => api.get<LessonRaw[]>('/lessons/today').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarCheck size={18} className="text-blue-500" /> Bugungi Darslar
          </h2>
        </div>
        <div className="p-6 space-y-3">
          {[1, 2].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  const groupMap: Record<string, string> = {};
  for (const g of groups) groupMap[g.id] = g.name;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarCheck size={18} className="text-blue-500" /> Bugungi Darslar
        </h2>
        <Link to="/calendar" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
          <CalendarDays size={14} /> Kalendar
        </Link>
      </div>
      {todayLessons.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">
          Bugun dars yo'q
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {todayLessons.slice(0, 6).map((lesson: LessonRaw) => (
            <Link
              key={lesson.lessonId}
              to={`/groups/${lesson.groupId}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarCheck size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {groupMap[lesson.groupId] ?? 'Guruh'}
                  </p>
                  {lesson.topic && (
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{lesson.topic}</p>
                  )}
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Kam davomat ogohlantirishlari
function LowAttendanceWidget() {
  const { data: lowStudents = [], isLoading } = useQuery({
    queryKey: ['low-attendance'],
    queryFn: () => getLowAttendanceStudents(75),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading || lowStudents.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100">
      <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between">
        <h2 className="font-semibold text-red-700 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          Kam Davomat ({lowStudents.length} ta talaba)
        </h2>
        <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">75% dan past</span>
      </div>
      <div className="divide-y divide-gray-50">
        {lowStudents.slice(0, 5).map((s: LowAttendanceStudent) => (
          <Link
            key={s.studentId}
            to={`/students/${s.studentId}`}
            className="flex items-center justify-between px-6 py-3 hover:bg-red-50/50 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">
                {s.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{s.fullName}</p>
                <p className="text-xs text-gray-400">
                  {s.presentCount}/{s.totalLessons} dars
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${s.attendancePercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-red-600 w-12 text-right">
                {s.attendancePercent.toFixed(0)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
      {lowStudents.length > 5 && (
        <div className="px-6 py-3 border-t border-gray-50">
          <Link to="/students" className="text-sm text-red-600 hover:underline">
            + {lowStudents.length - 5} ta boshqa talaba →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  });
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const isTeacher = user?.role === 'TEACHER';
  const isAdminOrReception = user?.role === 'ADMIN' || user?.role === 'RECEPTION';

  const myGroups = isTeacher
    ? groups.filter((g) => g.teacherId === user?.teacherId)
    : groups;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Xayrli tong';
    if (h < 17) return 'Xayrli kun';
    return 'Xayrli kech';
  };

  // groups as simple {id, name} map for TodayLessonsWidget
  const groupList = groups.map(g => ({ id: String(g.id), name: g.name }));

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, <span className="text-indigo-600">{user?.username}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">IELTS Centre boshqaruv tizimiga xush kelibsiz</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loadingStudents ? <SkeletonCard /> : (
          <StatCard label="Jami Talabalar" value={students.length} icon={Users}
            color="text-blue-600" bg="bg-blue-50" to="/students" />
        )}
        {!isTeacher && (
          loadingTeachers ? <SkeletonCard /> : (
            <StatCard label="Jami O'qituvchilar" value={teachers.length} icon={GraduationCap}
              color="text-purple-600" bg="bg-purple-50" to="/teachers" />
          )
        )}
        {loadingGroups ? <SkeletonCard /> : (
          <StatCard
            label={isTeacher ? 'Mening Guruhlarim' : 'Faol Guruhlar'}
            value={myGroups.length}
            icon={Layers}
            color="text-green-600" bg="bg-green-50" to="/groups"
          />
        )}
        {!isTeacher && (
          loadingCourses ? <SkeletonCard /> : (
            <StatCard label="Kurslar" value={courses.length} icon={BookOpen}
              color="text-orange-600" bg="bg-orange-50" to="/courses" />
          )
        )}
        {isTeacher && (
          <StatCard label="Barcha Guruhlar" value={groups.length} icon={TrendingUp}
            color="text-indigo-600" bg="bg-indigo-50" to="/groups" />
        )}
      </div>

      {/* Low attendance alert (Admin/Reception only) */}
      {isAdminOrReception && <div className="mb-6"><LowAttendanceWidget /></div>}

      {/* Main grid: Today's lessons + My groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bugungi darslar */}
        <TodayLessonsWidget groups={groupList} />

        {/* My groups — teacher view */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-green-500" />
              {isTeacher ? 'Mening Guruhlarim' : 'Guruhlar'}
            </h2>
            <Link to="/groups" className="text-sm text-indigo-600 hover:underline">Barchasi →</Link>
          </div>
          {loadingGroups ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : myGroups.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Guruh yo'q</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myGroups.slice(0, 5).map((g) => (
                <Link key={g.id} to={`/groups/${g.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Layers size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                      {g.schedule && <p className="text-xs text-gray-400">{g.schedule}</p>}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tez O'tish</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/students', label: 'Talabalar', icon: Users, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { to: isTeacher ? '/groups' : '/teachers', label: isTeacher ? 'Guruhlar' : "O'qituvchilar", icon: isTeacher ? Layers : GraduationCap, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { to: '/calendar', label: 'Kalendar', icon: CalendarDays, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
            { to: '/ai/writing', label: 'AI Writing', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl ${color} transition text-center`}>
              <Icon size={22} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Chat Widget */}
      <AiChatWidget />
    </div>
  );
}
