import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, CheckCircle, Clock } from 'lucide-react';
import { getSessionResults } from '../../api/quiz';

const BAND_COLOR = (score: number) => {
  if (score >= 7) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 5.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export default function QuizResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['quizResults', sessionId],
    queryFn: () => getSessionResults(sessionId!),
    enabled: !!sessionId,
  });

  const avgScore = results.length > 0
    ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : '—';

  const topStudent = results.length > 0
    ? results.reduce((a, b) => a.score > b.score ? a : b)
    : null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-5 text-sm transition">
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Trophy size={20} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Test Natijalari</h1>
          <p className="text-sm text-gray-500">{results.length} ta talaba qatnashdi</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">{results.length}</p>
          <p className="text-xs text-gray-500 mt-1">Qatnashdi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-1">O'rtacha band</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{topStudent?.score.toFixed(1) ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Eng yuqori</p>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Talabalar reytingi</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Hali natija yo'q</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...results]
              .sort((a, b) => b.score - a.score)
              .map((r, idx) => (
                <div key={r.resultId} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{r.studentName || 'Talaba'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle size={10} className="text-green-500" /> {r.correctAnswers}/{r.totalQuestions} to'g'ri
                      <span className="mx-1">·</span>
                      <Clock size={10} />
                      {new Date(r.submittedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Score */}
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${BAND_COLOR(r.score)}`}>
                    {r.score.toFixed(1)}
                  </div>

                  {/* Progress bar */}
                  <div className="w-20 hidden sm:block">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          r.score >= 7 ? 'bg-green-500' : r.score >= 5.5 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${(r.score / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
