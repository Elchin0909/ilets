import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { getExam, getExamResults, bulkUpsertExamResults } from '../../api/exams';
import type { ExamResultUpsertRequest } from '../../types';
import { showSuccess, showError } from '../../utils/toast';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const examId = Number(id);

  const { data: exam } = useQuery({ queryKey: ['exam', examId], queryFn: () => getExam(examId) });
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['examResults', examId],
    queryFn: () => getExamResults(examId),
  });

  const [scores, setScores] = useState<Record<number, Partial<ExamResultUpsertRequest>>>({});

  const getScore = (studentId: number): Partial<ExamResultUpsertRequest> => {
    if (scores[studentId]) return scores[studentId];
    const existing = results.find((r) => r.studentId === studentId);
    if (existing) return {
      score: existing.score,
      listeningScore: existing.listeningScore,
      readingScore: existing.readingScore,
      writingScore: existing.writingScore,
      speakingScore: existing.speakingScore,
      notes: existing.notes,
    };
    return {};
  };

  const setScore = (studentId: number, field: keyof ExamResultUpsertRequest, value: number | string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...getScore(studentId), [field]: value },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: (records: ExamResultUpsertRequest[]) => bulkUpsertExamResults(examId, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults', examId] });
      showSuccess('Natijalar saqlandi!');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleSave = () => {
    const records = results.map((r) => ({
      studentId: r.studentId,
      ...getScore(r.studentId),
    }));
    saveMutation.mutate(records);
  };

  return (
    <div>
      <button onClick={() => navigate('/exams')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm transition">
        <ArrowLeft size={16} />
        Imtihonlarga qaytish
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{exam?.title || `Exam #${examId}`}</h1>
        {exam && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span>Date: {exam.examDate}</span>
            {exam.maxScore && <span>Max Score: {exam.maxScore}</span>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-medium text-gray-700">{isLoading ? 'Loading...' : `${results.length} students`}</span>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition"
          >
            <Save size={14} />
            {saveMutation.isPending ? 'Saqlanmoqda...' : 'Natijalarni saqlash'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
            Loading...
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No students found for this exam</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Overall</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Listening</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reading</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Writing</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Speaking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => {
                  const s = getScore(r.studentId);
                  return (
                    <tr key={r.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.studentName || `#${r.studentId}`}</td>
                      {(['score', 'listeningScore', 'readingScore', 'writingScore', 'speakingScore'] as const).map((field) => (
                        <td key={field} className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            max={9}
                            step={0.5}
                            value={(s[field] as number | undefined) ?? ''}
                            onChange={(e) => setScore(r.studentId, field, e.target.value ? Number(e.target.value) : '')}
                            className="w-20 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-center"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={(s.notes as string | undefined) ?? ''}
                          onChange={(e) => setScore(r.studentId, 'notes', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
