import { useEffect, useState } from 'react';
import { Users, GraduationCap, Layers, BookOpen } from 'lucide-react';
import { getStudents } from '../../api/students';
import { getTeachers } from '../../api/teachers';
import { getGroups } from '../../api/groups';
import { getCourses } from '../../api/courses';
import PageHeader from '../../components/ui/PageHeader';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [counts, setCounts] = useState({ students: 0, teachers: 0, groups: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudents(), getTeachers(), getGroups(), getCourses()])
      .then(([students, teachers, groups, courses]) => {
        setCounts({
          students: students.length,
          teachers: teachers.length,
          groups: groups.length,
          courses: courses.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to IELTS Centre management system"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Students"
          value={loading ? '—' : counts.students}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Teachers"
          value={loading ? '—' : counts.teachers}
          icon={GraduationCap}
          color="bg-purple-500"
        />
        <StatCard
          label="Active Groups"
          value={loading ? '—' : counts.groups}
          icon={Layers}
          color="bg-green-500"
        />
        <StatCard
          label="Courses"
          value={loading ? '—' : counts.courses}
          icon={BookOpen}
          color="bg-orange-500"
        />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/students', label: 'Manage Students', icon: Users, color: 'text-blue-600 bg-blue-50' },
            { href: '/teachers', label: 'Manage Teachers', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
            { href: '/groups', label: 'Manage Groups', icon: Layers, color: 'text-green-600 bg-green-50' },
            { href: '/courses', label: 'Manage Courses', icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
          ].map(({ href, label, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition text-center`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
