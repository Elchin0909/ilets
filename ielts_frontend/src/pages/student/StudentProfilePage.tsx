import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getGroups } from '../../api/groups';
import { getStudents } from '../../api/students';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();

  // Get all students to find this student's info
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const myStudent = students.find(s => s.id === user?.studentId);

  // Find groups where this student is enrolled
  // We'll check enrollments for each group — but to avoid N+1 we just show groups list
  // A simpler approach: show all groups and let the student see their groups via enrollment
  // Actually, let's just show a welcome page with basic info

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {(myStudent?.fullName ?? user?.username ?? '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{myStudent?.fullName ?? user?.username}</h1>
            <p className="text-indigo-100 mt-1">Talaba</p>
            {myStudent?.phone && <p className="text-indigo-100 text-sm mt-0.5">{myStudent.phone}</p>}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <BookOpen size={24} className="text-indigo-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{allGroups.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Guruhlar mavjud</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <GraduationCap size={24} className="text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">IELTS</div>
          <div className="text-xs text-gray-500 mt-0.5">Kurs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <Users size={24} className="text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Jami talabalar</div>
        </div>
      </div>

      {/* Info block */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Mening ma'lumotlarim</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Username</span>
            <span className="font-medium text-gray-800">@{user?.username}</span>
          </div>
          {myStudent?.fullName && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">To'liq ism</span>
              <span className="font-medium text-gray-800">{myStudent.fullName}</span>
            </div>
          )}
          {myStudent?.phone && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Telefon</span>
              <span className="font-medium text-gray-800">{myStudent.phone}</span>
            </div>
          )}
          {myStudent?.email && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{myStudent.email}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Rol</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-medium">Talaba</span>
          </div>
        </div>
      </div>
    </div>
  );
}
