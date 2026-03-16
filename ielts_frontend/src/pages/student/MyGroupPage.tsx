import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEnrollments, getGroupEnrollments, getGroup } from '../../api/groups';
import { Users, Layers, Calendar, User, Loader2 } from 'lucide-react';

export default function MyGroupPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Talabaning guruhlari
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollmentsByStudent', studentId],
    queryFn: () => getMyEnrollments(studentId),
    enabled: !!studentId,
  });

  const activeEnrollments = enrollments.filter(
    (e) => e.status === 'active' || e.status === 'ACTIVE'
  );

  // Agar bitta guruh bo'lsa avtomatik tanlash
  const effectiveGroupId = selectedGroupId ?? (activeEnrollments.length === 1 ? activeEnrollments[0].groupId : null);

  // Tanlangan guruh ma'lumoti
  const { data: group } = useQuery({
    queryKey: ['group', effectiveGroupId],
    queryFn: () => getGroup(effectiveGroupId!),
    enabled: !!effectiveGroupId,
  });

  // Guruh a'zolari
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['groupEnrollments', effectiveGroupId],
    queryFn: () => getGroupEnrollments(effectiveGroupId!),
    enabled: !!effectiveGroupId,
  });

  const activeMembers = members.filter(
    (m) => m.status === 'active' || m.status === 'ACTIVE'
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} />
          <h1 className="text-2xl font-bold">Mening Guruhim</h1>
        </div>
        <p className="text-blue-100 text-sm">Guruhdagi sheriklaingizni ko'ring</p>
      </div>

      {/* Group selector (agar bir nechta guruh bo'lsa) */}
      {loadingEnrollments ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : activeEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          Hali birorta guruhga yozilmagan
        </div>
      ) : (
        <>
          {activeEnrollments.length > 1 && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {activeEnrollments.map((e) => (
                <button
                  key={e.groupId}
                  onClick={() => setSelectedGroupId(e.groupId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    effectiveGroupId === e.groupId
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Layers size={14} />
                  {e.groupName ?? `Guruh #${e.groupId.slice(0, 6)}`}
                </button>
              ))}
            </div>
          )}

          {/* Group info */}
          {effectiveGroupId && group && (
            <div className="bg-white rounded-xl border border-gray-200 mb-5">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Layers size={16} className="text-blue-500" />
                  {group.name}
                </h2>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-4 text-sm">
                {group.teacherName && (
                  <span className="text-gray-600">
                    <span className="text-gray-400">O'qituvchi: </span>
                    <span className="font-medium">{group.teacherName}</span>
                  </span>
                )}
                {group.courseName && (
                  <span className="text-gray-600">
                    <span className="text-gray-400">Kurs: </span>
                    <span className="font-medium">{group.courseName}</span>
                  </span>
                )}
                {group.schedule && (
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    {group.schedule}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Members */}
          {effectiveGroupId && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Guruh a'zolari
                </h2>
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                  {activeMembers.length} ta talaba
                </span>
              </div>

              {loadingMembers ? (
                <div className="py-8 flex justify-center">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : activeMembers.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  Guruhda hali talaba yo'q
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeMembers.map((member, idx) => {
                    const isMe = member.studentId === studentId;
                    const initial = (member.studentName ?? '?').charAt(0).toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-5 py-3.5 ${isMe ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-center justify-center w-5 text-xs text-gray-400 font-medium">
                          {idx + 1}
                        </div>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isMe
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {initial}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                            {member.studentName ?? 'Noma\'lum'}
                            {isMe && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">siz</span>
                            )}
                          </p>
                          {member.enrolledAt && (
                            <p className="text-xs text-gray-400">
                              {new Date(member.enrolledAt).toLocaleDateString('uz-UZ')} dan
                            </p>
                          )}
                        </div>
                        <User size={14} className="text-gray-300" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* No group selected */}
          {!effectiveGroupId && activeEnrollments.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
              Guruhni tanlang
            </div>
          )}
        </>
      )}
    </div>
  );
}
