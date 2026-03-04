import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, BookOpen } from 'lucide-react';
import { createTest } from '../../api/quiz';
import type { QuizTestRequest } from '../../api/quiz';
import { showSuccess, showError } from '../../utils/toast';

const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: "Boshlang'ich (Beginner)" },
  { value: 'ELEMENTARY', label: 'Elementar (Elementary)' },
  { value: 'PRE_IELTS', label: 'Pre-IELTS' },
  { value: 'IELTS_READY', label: 'IELTS Ready' },
  { value: 'ADVANCED', label: "Ilg'or (Advanced)" },
];

const OPTION_LABELS: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
};

interface QuestionDraft {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string; // A | B | C | D
}

const emptyQuestion = (): QuestionDraft => ({
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correct: 'A',
});

export default function CreateTestPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [submitted, setSubmitted] = useState(false);

  const createMutation = useMutation({
    mutationFn: createTest,
    onSuccess: () => {
      showSuccess("Test muvaffaqiyatli yaratildi!");
      navigate('/quiz/tests');
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const addQuestion = () => {
    if (questions.length >= 20) {
      showError("Maksimal 20 ta savol kiritish mumkin");
      return;
    }
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!title.trim()) {
      showError("Test nomini kiriting");
      return;
    }
    if (!level) {
      showError("Darajani tanlang");
      return;
    }
    if (questions.length < 5) {
      showError("Kamida 5 ta savol kiritish kerak");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        showError(`${i + 1}-savol to'liq to'ldirilmagan`);
        return;
      }
    }

    const req: QuizTestRequest = {
      title: title.trim(),
      level,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        optionA: q.optionA.trim(),
        optionB: q.optionB.trim(),
        optionC: q.optionC.trim(),
        optionD: q.optionD.trim(),
        correct: q.correct,
      })),
    };

    createMutation.mutate(req);
  };

  const fieldError = (val: string) => submitted && !val.trim();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/quiz/tests')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition"
      >
        <ArrowLeft size={16} />
        Test bankiga qaytish
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Yangi test yaratish</h1>
            <p className="text-sm text-gray-500">Kamida 5, ko'pi bilan 20 ta savol</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="masalan: IELTS Mock Test #1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition ${
                fieldError(title) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {fieldError(title) && (
              <p className="mt-1 text-xs text-red-500">Test nomini kiriting</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daraja <span className="text-red-500">*</span>
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition ${
                submitted && !level ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Darajani tanlang...</option>
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {submitted && !level && (
              <p className="mt-1 text-xs text-red-500">Darajani tanlang</p>
            )}
          </div>

          {/* Questions section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Savollar{' '}
                <span
                  className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    questions.length < 5
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {questions.length} / 20
                </span>
              </label>
              <button
                type="button"
                onClick={addQuestion}
                disabled={questions.length >= 20}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 font-medium transition"
              >
                <Plus size={14} />
                Savol qo'shish
              </button>
            </div>

            {submitted && questions.length < 5 && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                Kamida 5 ta savol kiritilishi kerak. Hozir {questions.length} ta savol bor.
              </div>
            )}

            <div className="space-y-5">
              {questions.map((q, index) => (
                <QuestionBlock
                  key={index}
                  index={index}
                  question={q}
                  showErrors={submitted}
                  canDelete={questions.length > 1}
                  onChange={(patch) => updateQuestion(index, patch)}
                  onDelete={() => removeQuestion(index)}
                />
              ))}
            </div>

            {/* Add question button (bottom) */}
            <button
              type="button"
              onClick={addQuestion}
              disabled={questions.length >= 20}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              Savol qo'shish
            </button>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/quiz/tests')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-lg transition text-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                'Testni saqlash'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface QuestionBlockProps {
  index: number;
  question: QuestionDraft;
  showErrors: boolean;
  canDelete: boolean;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onDelete: () => void;
}

function QuestionBlock({
  index,
  question,
  showErrors,
  canDelete,
  onChange,
  onDelete,
}: QuestionBlockProps) {
  const optionFields: Array<{ key: keyof QuestionDraft; label: string }> = [
    { key: 'optionA', label: 'A' },
    { key: 'optionB', label: 'B' },
    { key: 'optionC', label: 'C' },
    { key: 'optionD', label: 'D' },
  ];

  const hasTextError = showErrors && !question.text.trim();
  const hasOptionError = (key: keyof QuestionDraft) =>
    showErrors && !(question[key] as string).trim();

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40 hover:bg-white hover:border-indigo-200 transition">
      {/* Question header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {index + 1}-savol
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Savolni o'chirish"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Question text */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Savol matni <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          placeholder="Savol matnini kiriting..."
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition ${
            hasTextError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {hasTextError && (
          <p className="mt-0.5 text-xs text-red-500">Savol matnini kiriting</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {optionFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {OPTION_LABELS[label]} varianti <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question[key] as string}
              onChange={(e) => onChange({ [key]: e.target.value })}
              placeholder={`${label} variantini kiriting`}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition ${
                hasOptionError(key) ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Correct answer */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          To'g'ri javob <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                question.correct === opt
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}
            >
              <input
                type="radio"
                name={`correct-${index}`}
                value={opt}
                checked={question.correct === opt}
                onChange={() => onChange({ correct: opt })}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
