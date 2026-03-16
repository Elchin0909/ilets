import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessWriting, getStudentWritingLogs, type WritingAssessResponse } from '../../api/ai';
import { useAuth } from '../../contexts/AuthContext';
import { PenLine, Send, Loader2, BarChart2, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Beginner: 'bg-red-100 text-red-700',
    Elementary: 'bg-orange-100 text-orange-700',
    'Pre-IELTS': 'bg-yellow-100 text-yellow-700',
    'IELTS Ready': 'bg-green-100 text-green-700',
    Advanced: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[level] ?? 'bg-gray-100 text-gray-700'}`}>
      {level}
    </span>
  );
}

export default function WritingPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const [text, setText] = useState('');
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
  const [result, setResult] = useState<WritingAssessResponse | null>(null);
  const [view, setView] = useState<'write' | 'result' | 'history'>('write');

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['writingLogs', studentId],
    queryFn: () => getStudentWritingLogs(studentId),
    enabled: !!studentId,
  });

  const assessMutation = useMutation({
    mutationFn: () => assessWriting(text, taskType, studentId || undefined),
    onSuccess: (data) => {
      setResult(data);
      setView('result');
      refetchHistory();
    },
    onError: () => toast.error('Baholashda xatolik yuz berdi'),
  });

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <PenLine size={28} />
          <h1 className="text-2xl font-bold">Writing Baholash</h1>
        </div>
        <p className="text-violet-100 text-sm">IELTS Writing yozmasini AI baholaydi va tavsiyalar beradi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView('write')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'write' ? 'bg-violet-100 text-violet-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <PenLine size={14} className="inline mr-1.5" />Yozish
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'history' ? 'bg-violet-100 text-violet-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <FileText size={14} className="inline mr-1.5" />Tarix ({history.length})
        </button>
      </div>

      {/* Write view */}
      {view === 'write' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {/* Task type */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTaskType('task1')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                taskType === 'task1'
                  ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              Task 1 (Letter / Report)
            </button>
            <button
              onClick={() => setTaskType('task2')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                taskType === 'task2'
                  ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              Task 2 (Essay)
            </button>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={taskType === 'task1'
              ? 'Task 1 yozmangizni shu yerga yozing (kamida 150 so\'z)...'
              : 'Task 2 esse yozmangizni shu yerga yozing (kamida 250 so\'z)...'}
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${wordCount >= 30 ? 'text-gray-500' : 'text-red-500'}`}>
              {wordCount} so'z {wordCount < 30 && '(kamida 30)'}
            </span>
            <button
              onClick={() => assessMutation.mutate()}
              disabled={assessMutation.isPending || wordCount < 30}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition"
            >
              {assessMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Baholanmoqda...</>
              ) : (
                <><Send size={16} /> Baholash</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result view */}
      {view === 'result' && result && (
        <div className="space-y-4">
          <button
            onClick={() => setView('write')}
            className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-medium transition"
          >
            <ArrowLeft size={14} /> Qayta yozish
          </button>

          {/* Score header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Natija</h3>
                <p className="text-xs text-gray-400 mt-0.5">AI tomonidan baholandi</p>
              </div>
              <div className="flex items-center gap-3">
                <LevelBadge level={result.level} />
                <span className="text-2xl font-bold text-violet-700">Band {result.bandRange}</span>
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-3">
              {[
                { key: 'taskAchievement', label: 'Task Achievement' },
                { key: 'coherence', label: 'Coherence & Cohesion' },
                { key: 'grammar', label: 'Grammar' },
                { key: 'vocabulary', label: 'Vocabulary' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</h4>
                  <p className="text-sm text-gray-700">{(result as any)[key]}</p>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {result.recommendations && (
              <div className="mt-4 bg-violet-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-violet-600 uppercase mb-1 flex items-center gap-1">
                  <BarChart2 size={12} /> Tavsiyalar
                </h4>
                <p className="text-sm text-violet-800">{result.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History view */}
      {view === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Hali yozma baholash amalga oshirilmagan</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((log) => (
                <div key={log.logId} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={log.level} />
                      <span className="text-sm font-semibold text-gray-700">Band {log.bandRange}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {log.taskType === 'task2' ? 'Task 2 (Essay)' : 'Task 1'}
                    </span>
                  </div>
                  {log.textSnippet && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{log.textSnippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
