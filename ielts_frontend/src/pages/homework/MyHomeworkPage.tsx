import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Clock, CheckCircle2, Send, AlertCircle, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyHomework, submitHomework } from '../../api/homework';

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function isDue(d?: string) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function MyHomeworkPage() {
  const qc = useQueryClient();
  const { data: homeworks = [], isLoading } = useQuery({ queryKey: ['my-homework'], queryFn: getMyHomework });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const submitMut = useMutation({
    mutationFn: ({ hwId, content }: { hwId: string; content: string }) =>
      submitHomework(hwId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-homework'] });
      toast.success('Topshirildi!');
      setSubmittingId(null);
      setSubmitContent('');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const pending = homeworks.filter((hw: any) => !hw.mySubmission && hw.status === 'OPEN');
  const submitted = homeworks.filter((hw: any) => hw.mySubmission?.status === 'SUBMITTED');
  const graded = homeworks.filter((hw: any) => hw.mySubmission?.status === 'GRADED');
  const closed = homeworks.filter((hw: any) => hw.status === 'CLOSED' && !hw.mySubmission);

  function HwCard({ hw, showSubmit }: { hw: any; showSubmit?: boolean }) {
    const isExpanded = expandedId === hw.homeworkId;
    const sub = hw.mySubmission;
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition">
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : hw.homeworkId)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{hw.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {fmt(hw.dueDate)}
                </span>
                {hw.dueDate && isDue(hw.dueDate) && hw.status === 'OPEN' && !sub && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Muddati o'tgan
                  </span>
                )}
              </div>
            </div>
            {sub?.status === 'GRADED' ? (
              <div className="text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  Number(sub.grade) >= 8 ? 'bg-green-100 text-green-700' :
                  Number(sub.grade) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {sub.grade}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">ball</p>
              </div>
            ) : sub?.status === 'SUBMITTED' ? (
              <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={12} /> Topshirilgan
              </span>
            ) : hw.status === 'CLOSED' ? (
              <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-lg">Yopiq</span>
            ) : null}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-3">
            {hw.description && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">{hw.description}</p>
            )}

            {/* Graded feedback */}
            {sub?.status === 'GRADED' && sub.feedback && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-3">
                <p className="text-xs font-medium text-green-700 mb-1">O'qituvchi izohi:</p>
                <p className="text-sm text-green-800">{sub.feedback}</p>
              </div>
            )}

            {/* Submit form */}
            {showSubmit && !sub && hw.status === 'OPEN' && (
              <div className="space-y-3">
                {submittingId === hw.homeworkId ? (
                  <>
                    <textarea
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="Javobingizni yozing..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setSubmittingId(null); setSubmitContent(''); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Bekor
                      </button>
                      <button
                        onClick={() => {
                          if (!submitContent.trim()) { toast.error('Javob yozing'); return; }
                          submitMut.mutate({ hwId: hw.homeworkId, content: submitContent });
                        }}
                        disabled={submitMut.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        <Send size={14} /> {submitMut.isPending ? 'Yuborilmoqda...' : 'Topshirish'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setSubmittingId(hw.homeworkId)}
                    className="w-full py-2.5 border-2 border-dashed border-indigo-200 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    Javob yozish
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Uy Vazifalari</h1>
          <p className="text-sm text-gray-500">{homeworks.length} ta vazifa</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <p className="text-lg font-bold text-orange-600">{pending.length}</p>
          <p className="text-[11px] text-orange-500">Kutilmoqda</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <p className="text-lg font-bold text-blue-600">{submitted.length}</p>
          <p className="text-[11px] text-blue-500">Topshirilgan</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <p className="text-lg font-bold text-green-600">{graded.length}</p>
          <p className="text-[11px] text-green-500">Baholangan</p>
        </div>
      </div>

      {/* Pending homework */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-500" /> Topshirilmagan
          </h2>
          <div className="space-y-2">
            {pending.map((hw: any) => <HwCard key={hw.homeworkId} hw={hw} showSubmit />)}
          </div>
        </div>
      )}

      {/* Submitted */}
      {submitted.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-500" /> Topshirilgan — Baholanmagan
          </h2>
          <div className="space-y-2">
            {submitted.map((hw: any) => <HwCard key={hw.homeworkId} hw={hw} />)}
          </div>
        </div>
      )}

      {/* Graded */}
      {graded.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" /> Baholangan
          </h2>
          <div className="space-y-2">
            {graded.map((hw: any) => <HwCard key={hw.homeworkId} hw={hw} />)}
          </div>
        </div>
      )}

      {/* Closed */}
      {closed.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-gray-400" /> Yopilgan
          </h2>
          <div className="space-y-2">
            {closed.map((hw: any) => <HwCard key={hw.homeworkId} hw={hw} />)}
          </div>
        </div>
      )}

      {homeworks.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Hozircha vazifa yo'q</p>
        </div>
      )}
    </div>
  );
}
