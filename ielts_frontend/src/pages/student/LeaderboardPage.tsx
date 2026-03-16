import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEnrollments, getGroupEnrollments } from '../../api/groups';
import { getExamsByGroup, getExamResults } from '../../api/exams';
import { Trophy, Medal, Layers, Loader2, TrendingUp } from 'lucide-react';

interface StudentScore {
  studentId: string;
  studentName: string;
  avgScore: number;
  examCount: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollmentsByStudent', studentId],
    queryFn: () => getMyEnrollments(studentId),
    enabled: !!studentId,
  });

  const activeEnrollments = enrollments.filter(
    (e) => e.status === 'active' || e.status === 'ACTIVE'
  );
  const effectiveGroupId = selectedGroupId ?? (activeEnrollments.length >= 1 ? activeEnrollments[0].groupId : null);

  // Get group members
  const { data: members = [] } = useQuery({
    queryKey: ['groupEnrollments', effectiveGroupId],
    queryFn: () => getGroupEnrollments(effectiveGroupId!),
    enabled: !!effectiveGroupId,
  });

  // Get exams for group
  const { data: exams = [] } = useQuery({
    queryKey: ['examsByGroup', effectiveGroupId],
    queryFn: () => getExamsByGroup(effectiveGroupId!),
    enabled: !!effectiveGroupId,
  });

  // Get all exam results and compute leaderboard
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', effectiveGroupId, exams.length],
    queryFn: async () => {
      if (exams.length === 0) return [];

      const allResults: any[] = [];
      for (const exam of exams) {
        const examId = (exam as any).examId ?? (exam as any).id;
        try {
          const results = await getExamResults(examId);
          allResults.push(...results);
        } catch { /* skip */ }
      }

      // Aggregate by student
      const scoreMap = new Map<string, { total: number; count: number; name: string }>();

      const activeMembers = members.filter(
        (m) => m.status === 'active' || m.status === 'ACTIVE'
      );

      // Init all members
      for (const m of activeMembers) {
        scoreMap.set(m.studentId, { total: 0, count: 0, name: m.studentName ?? 'Noma\'lum' });
      }

      // Add scores
      for (const r of allResults) {
        const sid = String(r.studentId);
        const overall = r.overall ?? r.score ?? 0;
        if (overall > 0) {
          const entry = scoreMap.get(sid);
          if (entry) {
            entry.total += overall;
            entry.count += 1;
          }
        }
      }

      const result: StudentScore[] = [];
      scoreMap.forEach((v, k) => {
        result.push({
          studentId: k,
          studentName: v.name,
          avgScore: v.count > 0 ? Math.round((v.total / v.count) * 10) / 10 : 0,
          examCount: v.count,
        });
      });

      return result.sort((a, b) => b.avgScore - a.avgScore);
    },
    enabled: !!effectiveGroupId && exams.length > 0,
  });

  const isLoading = loadingEnrollments || loadingLeaderboard;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={28} />
          <h1 className="text-2xl font-bold">Reyting</h1>
        </div>
        <p className="text-yellow-100 text-sm">Guruhdagi talabalar reytingi (imtihon ballari bo'yicha)</p>
      </div>

      {/* Group selector */}
      {activeEnrollments.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {activeEnrollments.map((e) => (
            <button
              key={e.groupId}
              onClick={() => setSelectedGroupId(e.groupId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                effectiveGroupId === e.groupId
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Layers size={14} />
              {e.groupName ?? `Guruh #${e.groupId.slice(0, 6)}`}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
        ) : !effectiveGroupId ? (
          <div className="py-12 text-center text-gray-400 text-sm">Guruh tanlang</div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Hali imtihon natijalari yo'q
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.studentId === studentId;
              const rank = idx + 1;
              return (
                <div
                  key={entry.studentId}
                  className={`flex items-center gap-3 px-5 py-4 ${isMe ? 'bg-amber-50/50' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {rank === 1 ? (
                      <Medal size={22} className="text-yellow-500" />
                    ) : rank === 2 ? (
                      <Medal size={22} className="text-gray-400" />
                    ) : rank === 3 ? (
                      <Medal size={22} className="text-amber-700" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isMe ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.studentName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isMe ? 'text-amber-700' : 'text-gray-800'}`}>
                      {entry.studentName}
                      {isMe && <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">siz</span>}
                    </p>
                    <p className="text-xs text-gray-400">{entry.examCount} ta imtihon</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      entry.avgScore >= 7 ? 'text-green-600' :
                      entry.avgScore >= 5.5 ? 'text-yellow-600' :
                      entry.avgScore > 0 ? 'text-red-600' : 'text-gray-300'
                    }`}>
                      {entry.avgScore > 0 ? entry.avgScore : '—'}
                    </div>
                    {entry.avgScore > 0 && (
                      <div className="text-xs text-gray-400 flex items-center justify-end gap-0.5">
                        <TrendingUp size={10} /> o'rtacha
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
