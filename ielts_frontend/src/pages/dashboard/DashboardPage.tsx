import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Layers, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../api/students';
import { getTeachers } from '../../api/teachers';
import { getGroups } from '../../api/groups';
import { getCourses } from '../../api/courses';
import { useAuth } from '../../contexts/AuthContext';

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
  const myGroups = isTeacher
    ? groups.filter((g) => g.teacherId === user?.teacherId)
    : groups;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Xayrli tong';
    if (h < 17) return 'Xayrli kun';
    return 'Xayrli kech';
  };

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

      {/* My groups — teacher view */}
      {isTeacher && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-green-500" />
              Mening Guruhlarim
            </h2>
            <Link to="/groups" className="text-sm text-indigo-600 hover:underline">Barchasi →</Link>
          </div>
          {loadingGroups ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : myGroups.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Sizga biriktirilgan guruh yo'q</div>
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
      )}

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tez O'tish</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/students', label: 'Talabalar', icon: Users, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { to: isTeacher ? '/groups' : '/teachers', label: isTeacher ? 'Guruhlar' : "O'qituvchilar", icon: isTeacher ? Layers : GraduationCap, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { to: '/attendance', label: 'Davomat', icon: TrendingUp, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
            { to: '/exams', label: 'Imtihonlar', icon: BookOpen, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl ${color} transition text-center`}>
              <Icon size={22} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
