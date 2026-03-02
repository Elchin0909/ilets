import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PenLine, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { assessWriting, type WritingAssessResponse } from '../../api/ai';
import toast from 'react-hot-toast';

const LEVELS = ['Beginner', 'Elementary', 'Pre-IELTS', 'IELTS Ready', 'Advanced'];

const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Beginner:     { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: "Boshlang'ich" },
  Elementary:   { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Elementary' },
  'Pre-IELTS':  { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pre-IELTS' },
  'IELTS Ready':{ color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'IELTS Ready' },
  Advanced:     { color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Advanced' },
};

function LevelBar({ result }: { result: WritingAssessResponse }) {
  const idx = LEVELS.indexOf(result.level);
  return (
    <div className="flex gap-1.5 mt-1">
      {LEVELS.map((lvl, i) => {
        const cfg = LEVEL_CONFIG[lvl];
        return (
          <div key={lvl} className="flex-1">
            <div className={`h-2.5 rounded-full transition-all ${i <= idx ? cfg.bg.replace('50', '400') : 'bg-gray-100'} ${i === idx ? 'ring-2 ring-offset-1 ' + cfg.color.replace('text', 'ring') : ''}`} />
            {i === idx && (
              <p className={`text-center text-xs font-semibold mt-1 ${cfg.color}`}>{cfg.label}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CriteriaCard({ label, value }: { label: string; value: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
      >
        <span>{label}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-3 whitespace-pre-line">
          {value}
        </div>
      )}
    </div>
  );
}

export default function WritingAssessmentPage() {
  const [text, setText] = useState('');
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
  const [result, setResult] = useState<WritingAssessResponse | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const { mutate, isPending } = useMutation({
    mutationFn: () => assessWriting(text, taskType),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Baholash tayyor!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const levelCfg = result ? (LEVEL_CONFIG[result.level] ?? LEVEL_CONFIG['Pre-IELTS']) : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <PenLine size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Writing Baholash</h1>
            <p className="text-sm text-gray-500">Yozgan matnizni IELTS mezonlari asosida baholang</p>
          </div>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
        {/* Task type selector */}
        <div className="flex gap-3 mb-4">
          {(['task1', 'task2'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTaskType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                taskType === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'task1' ? 'Task 1 (Report/Letter)' : 'Task 2 (Essay)'}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={
            taskType === 'task1'
              ? "The chart shows... (Task 1 matnini kiriting)"
              : "Some people believe... (Essay matnini kiriting)"
          }
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300 leading-relaxed"
        />

        {/* Word count + submit */}
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-medium ${wordCount < 30 ? 'text-red-400' : wordCount < 150 ? 'text-orange-400' : 'text-green-500'}`}>
            {wordCount} so&apos;z {wordCount < 30 ? "(kamida 30 so'z kerak)" : ''}
          </span>
          <button
            onClick={() => mutate()}
            disabled={isPending || wordCount < 30}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            {isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Baholanmoqda...</>
            ) : (
              <><CheckCircle2 size={16} /> Baholash</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && levelCfg && (
        <div className="space-y-4">
          {/* Level card */}
          <div className={`bg-white rounded-2xl border-2 ${levelCfg.border} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Daraja</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${levelCfg.bg}`}>
                  <span className={`text-xl font-bold ${levelCfg.color}`}>{levelCfg.label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Band Range</p>
                <span className={`text-2xl font-bold ${levelCfg.color}`}>{result.bandRange}</span>
              </div>
            </div>

            {/* Progress levels bar */}
            <LevelBar result={result} />
          </div>

          {/* Criteria cards */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-indigo-500" /> Batafsil Baho
            </h2>
            <div className="space-y-2">
              <CriteriaCard label="Task Achievement (Vazifa bajarish)" value={result.taskAchievement} />
              <CriteriaCard label="Coherence & Cohesion (Mantiqiylik)" value={result.coherence} />
              <CriteriaCard label="Grammatical Range & Accuracy" value={result.grammar} />
              <CriteriaCard label="Lexical Resource (So'z boyligi)" value={result.vocabulary} />
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
            <h2 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <PenLine size={16} /> Tavsiyalar
            </h2>
            <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-line">{result.recommendations}</p>
          </div>

          {/* Try again */}
          <button
            onClick={() => setResult(null)}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            Yangi matn kiritish
          </button>
        </div>
      )}
    </div>
  );
}
