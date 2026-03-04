import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Plus,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { listTests, approveTest } from '../../api/quiz';
import type { QuizTestResponse } from '../../api/quiz';
import { getGroups } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { showSuccess, showError } from '../../utils/toast';

type TabKey = 'all' | 'approved' | 'pending';

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Boshlang\'ich',
  ELEMENTARY: 'Elementar',
  PRE_IELTS: 'Pre-IELTS',
  IELTS_READY: 'IELTS Ready',
  ADVANCED: 'Ilg\'or',
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-red-100 text-red-700',
  ELEMENTARY: 'bg-orange-100 text-orange-700',
  PRE_IELTS: 'bg-yellow-100 text-yellow-700',
  IELTS_READY: 'bg-blue-100 text-blue-700',
  ADVANCED: 'bg-green-100 text-green-700',
};

export default function TestBankPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [startTestId, setStartTestId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['quiz-tests'],
    queryFn: listTests,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const approveMutation = useMutation({
    mutationFn: approveTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-tests'] });
      showSuccess("Test tasdiqlandi!");
    },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'Barchasi', count: tests.length },
    { key: 'approved', label: 'Tasdiqlangan', count: tests.filter((t) => t.approved).length },
    { key: 'pending', label: 'Kutilmoqda', count: tests.filter((t) => !t.approved).length },
  ];

  const filteredTests = tests.filter((t) => {
    if (activeTab === 'approved') return t.approved;
    if (activeTab === 'pending') return !t.approved;
    return true;
  });

  const handleStartForGroup = (testId: string) => {
    setStartTestId(testId);
    setSelectedGroupId('');
  };

  const handleConfirmStart = () => {
    if (!selectedGroupId || !startTestId) return;
    setStartTestId(null);
    navigate(`/groups/${selectedGroupId}`, { state: { startQuizTestId: startTestId } });
  };

  return (
    <div>
      <PageHeader
        title="Test Banki"
        subtitle={`${tests.length} ta test mavjud`}
        action={
          <button
            onClick={() => navigate('/quiz/tests/create')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            <Plus size={16} />
            Yangi test
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" />
          Yuklanmoqda...
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredTests.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-sm">
            {activeTab === 'pending'
              ? 'Tasdiqlanmagan testlar yo\'q'
              : activeTab === 'approved'
              ? 'Tasdiqlangan testlar yo\'q'
              : 'Hali testlar yo\'q'}
          </p>
          <button
            onClick={() => navigate('/quiz/tests/create')}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={14} />
            Yangi test yaratish
          </button>
        </div>
      )}

      {/* Test cards */}
      {!isLoading && filteredTests.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => (
            <TestCard
              key={test.testId}
              test={test}
              isAdmin={isAdmin}
              onApprove={() => approveMutation.mutate(test.testId)}
              approving={approveMutation.isPending && approveMutation.variables === test.testId}
              onStartForGroup={() => handleStartForGroup(test.testId)}
            />
          ))}
        </div>
      )}

      {/* Start for Group Modal */}
      <Modal
        isOpen={!!startTestId}
        onClose={() => setStartTestId(null)}
        title="Guruh uchun boshlash"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Bu testni qaysi guruh uchun boshlashni tanlang. Guruh sahifasiga o'tasiz va u yerda
            sessiyani sozlashingiz mumkin.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guruhni tanlang</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Guruhni tanlang...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStartTestId(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Bekor
            </button>
            <button
              disabled={!selectedGroupId}
              onClick={handleConfirmStart}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              <ChevronRight size={15} />
              Guruhga o'tish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface TestCardProps {
  test: QuizTestResponse;
  isAdmin: boolean;
  onApprove: () => void;
  approving: boolean;
  onStartForGroup: () => void;
}

function TestCard({ test, isAdmin, onApprove, approving, onStartForGroup }: TestCardProps) {
  const levelColor = LEVEL_COLORS[test.level] ?? 'bg-gray-100 text-gray-700';
  const levelLabel = LEVEL_LABELS[test.level] ?? test.level;

  const createdBy =
    test.createdByRole === 'ADMIN'
      ? 'Admin'
      : test.teacherName
      ? test.teacherName
      : "O'qituvchi";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{test.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{createdBy}</p>
        </div>
        {test.approved ? (
          <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor}`}>
          {levelLabel}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <ClipboardList size={11} />
          {test.questionCount} savol
        </span>
        {!test.approved && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
            Kutilmoqda
          </span>
        )}
      </div>

      {/* Date */}
      <p className="text-xs text-gray-400">
        {new Date(test.createdAt).toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-gray-100">
        {isAdmin && !test.approved && (
          <button
            onClick={onApprove}
            disabled={approving}
            className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-1.5 px-3 rounded-lg transition"
          >
            {approving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            Tasdiqlash
          </button>
        )}
        {test.approved && (
          <button
            onClick={onStartForGroup}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-3 rounded-lg transition"
          >
            <ChevronRight size={12} />
            Guruh uchun boshlash
          </button>
        )}
      </div>
    </div>
  );
}
