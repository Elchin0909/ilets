import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { getSessionForTaking, submitAnswers } from '../../api/quiz';
import type { QuizResultResponse, QuizQuestionDto } from '../../api/quiz';
import { showError } from '../../utils/toast';

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Boshlang\'ich',
  ELEMENTARY: 'Elementar',
  PRE_IELTS: 'Pre-IELTS',
  IELTS_READY: 'IELTS Ready',
  ADVANCED: 'Ilg\'or',
};

export default function TakeQuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // selectedAnswers: questionId → selectedOption (A|B|C|D)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<QuizResultResponse | null>(null);

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['quiz-session-take', sessionId],
    queryFn: () => getSessionForTaking(sessionId!),
    enabled: !!sessionId,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (answers: Array<{ questionId: string; selectedOption: string }>) =>
      submitAnswers(sessionId!, answers),
    onSuccess: (res) => {
      setResult(res);
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Sessiya topilmadi</h2>
          <p className="text-gray-500 text-sm mb-5">
            Bu sessiya mavjud emas yoki muddati tugagan.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft size={15} />
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Already submitted state
  if (session.alreadySubmitted && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <CheckCircle size={44} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Allaqachon topshirilgan</h2>
          <p className="text-gray-500 text-sm mb-6">
            Siz bu imtihonni allaqachon topshirgansiz.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition"
          >
            <ArrowLeft size={15} />
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    const pct = Math.round((result.correctAnswers / result.totalQuestions) * 100);
    const passed = pct >= 60;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          {/* Award icon with color based on score */}
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${
              passed ? 'bg-green-100' : 'bg-orange-100'
            }`}
          >
            <Award size={36} className={passed ? 'text-green-600' : 'text-orange-500'} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {passed ? 'Ajoyib natija!' : "Kuchliroq harakat qiling!"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">{session.testTitle}</p>

          {/* Score ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg width="120" height="120" className="rotate-[-90deg]">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={passed ? '#16a34a' : '#f97316'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-bold text-gray-900">{pct}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Jami savollar" value={result.totalQuestions} color="text-gray-700" />
            <StatCard
              label="To'g'ri javoblar"
              value={result.correctAnswers}
              color="text-green-600"
            />
            <StatCard
              label="Noto'g'ri"
              value={result.totalQuestions - result.correctAnswers}
              color="text-red-500"
            />
          </div>

          {/* Score badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
              passed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}
          >
            {passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Ball: {result.score.toFixed ? result.score.toFixed(1) : result.score}
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition"
          >
            <ArrowLeft size={16} />
            Sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const questions: QuizQuestionDto[] = session.questions ?? [];
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Bu sessiyada savollar mavjud emas.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = Math.round((answeredCount / total) * 100);

  const handleSelectOption = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (answeredCount < total) {
      const unanswered = total - answeredCount;
      if (
        !window.confirm(
          `${unanswered} ta savolga javob bermagansiz. Shunday ham topshirasizmi?`
        )
      ) {
        return;
      }
    }

    const answers = questions.map((q) => ({
      questionId: q.questionId,
      selectedOption: selectedAnswers[q.questionId] ?? '',
    }));

    submitMutation.mutate(answers);
  };

  const options: Array<{ key: string; label: string; text: string }> = [
    { key: 'A', label: 'A', text: currentQuestion.optionA },
    { key: 'B', label: 'B', text: currentQuestion.optionB },
    { key: 'C', label: 'C', text: currentQuestion.optionC },
    { key: 'D', label: 'D', text: currentQuestion.optionD },
  ];

  const selectedForCurrent = selectedAnswers[currentQuestion.questionId];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm("Imtihondan chiqmoqchimisiz? Jarayondan chiqilsa ma'lumotlar saqlanmaydi.")) {
                navigate(-1);
              }
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft size={16} />
            Chiqish
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
              {session.testTitle}
            </p>
            <p className="text-xs text-gray-400">
              {LEVEL_LABELS[session.testLevel] ?? session.testLevel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Javob berildi</p>
            <p className="text-sm font-semibold text-indigo-600">
              {answeredCount}/{total}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-1.5 bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Question number indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {total}
            </span>
            {/* Mini question navigation dots */}
            <div className="flex gap-1 flex-wrap justify-end max-w-xs">
              {questions.map((q, i) => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIndex(i)}
                  title={`${i + 1}-savol`}
                  className={`w-5 h-5 rounded-full text-[10px] font-medium transition border ${
                    i === currentIndex
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : selectedAnswers[q.questionId]
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
            <p className="text-base font-medium text-gray-900 leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {options.map(({ key, label, text }) => {
              const isSelected = selectedForCurrent === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-300'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-sm leading-snug">{text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft size={15} />
              Oldingi
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-6 rounded-xl transition"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Topshirilmoqda...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Topshirish
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition"
              >
                Keyingi
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
