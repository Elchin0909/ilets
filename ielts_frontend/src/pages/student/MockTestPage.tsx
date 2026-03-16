import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList, Trophy, Target, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentQuizResults, listTests } from '../../api/quiz';

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-red-50 text-red-600 border-red-200',
  ELEMENTARY: 'bg-orange-50 text-orange-600 border-orange-200',
  PRE_IELTS: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  IELTS_READY: 'bg-blue-50 text-blue-600 border-blue-200',
  ADVANCED: 'bg-green-50 text-green-600 border-green-200',
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Boshlang\'ich',
  ELEMENTARY: 'Elementar',
  PRE_IELTS: 'Pre-IELTS',
  IELTS_READY: 'IELTS Ready',
  ADVANCED: 'Ilg\'or',
};

export default function MockTestPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const [selectedLevel, setSelectedLevel] = useState('');

  const { data: tests = [] } = useQuery({
    queryKey: ['quiz-tests'],
    queryFn: listTests,
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['student-quiz-results', studentId],
    queryFn: () => getStudentQuizResults(studentId),
    enabled: !!studentId,
  });

  // Only show approved tests
  const availableTests = tests.filter((t) => t.approved);
  const filtered = selectedLevel
    ? availableTests.filter((t) => t.level === selectedLevel)
    : availableTests;

  // Build results map
  const resultsByTest: Record<string, any> = {};
  results.forEach((r: any) => {
    if (!resultsByTest[r.testId] || new Date(r.submittedAt) > new Date(resultsByTest[r.testId].submittedAt)) {
      resultsByTest[r.testId] = r;
    }
  });

  // Stats
  const totalTests = results.length;
  const avgScore = totalTests > 0
    ? Math.round(results.reduce((a: number, r: any) => a + (r.score ?? 0), 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...results.map((r: any) => r.score ?? 0))
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border p-5 h-20 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mock Testlar</h1>
          <p className="text-sm text-gray-500">IELTS tayyorgarlik testlari</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Target size={18} className="text-indigo-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{totalTests}</p>
          <p className="text-[11px] text-gray-500">Yechilgan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Trophy size={18} className="text-yellow-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{bestScore}%</p>
          <p className="text-[11px] text-gray-500">Eng yuqori</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <BookOpen size={18} className="text-green-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{avgScore}%</p>
          <p className="text-[11px] text-gray-500">O'rtacha</p>
        </div>
      </div>

      {/* Level filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setSelectedLevel('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            !selectedLevel ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          Barchasi
        </button>
        {Object.entries(LEVEL_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setSelectedLevel(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedLevel === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Test list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Hozircha test mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((test) => {
            const result = resultsByTest[test.testId];
            const hasResult = !!result;
            return (
              <div key={test.testId}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${LEVEL_COLORS[test.level] || 'bg-gray-50 text-gray-600'}`}>
                    <ClipboardList size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{test.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${LEVEL_COLORS[test.level] || ''}`}>
                        {LEVEL_LABELS[test.level] || test.level}
                      </span>
                      <span>{test.questionCount} savol</span>
                      {test.teacherName && <span>{test.teacherName}</span>}
                    </div>
                  </div>
                  {hasResult ? (
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        result.score >= 80 ? 'bg-green-100 text-green-700' :
                        result.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {result.score}%
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {result.correctAnswers}/{result.totalQuestions}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                      Yechilmagan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent results */}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">So'nggi Natijalar</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-medium">Test</th>
                  <th className="text-center px-4 py-2.5 font-medium">Ball</th>
                  <th className="text-center px-4 py-2.5 font-medium">Natija</th>
                  <th className="text-right px-4 py-2.5 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.slice(0, 10).map((r: any) => (
                  <tr key={r.resultId || r.submittedAt} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{r.testTitle || 'Test'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`font-semibold ${
                        r.score >= 80 ? 'text-green-600' : r.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{r.score}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">
                      {r.correctAnswers}/{r.totalQuestions}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                      {new Date(r.submittedAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
