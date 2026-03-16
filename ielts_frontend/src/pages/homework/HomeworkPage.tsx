import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Plus, Search, Trash2, Edit3, CheckCircle2, Clock,
  Users, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllHomework, createHomework, updateHomework, deleteHomework,
  getHomeworkDetail, gradeSubmission,
  type Homework,
} from '../../api/homework';
import { getGroups } from '../../api/groups';

/* ── Helpers ──────────────────── */
function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function isDue(d?: string) {
  if (!d) return false;
  return new Date(d) < new Date();
}

/* ── Main ──────────────────── */
export default function HomeworkPage() {
  const qc = useQueryClient();
  const { data: homeworks = [], isLoading } = useQuery({ queryKey: ['homeworks'], queryFn: getAllHomework });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* Modal states */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', groupId: '', dueDate: '', status: 'OPEN' });

  /* Detail panel */
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['homework-detail', detailId],
    queryFn: () => getHomeworkDetail(detailId!),
    enabled: !!detailId,
  });

  /* Grading */
  const [gradingSub, setGradingSub] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });

  /* Mutations */
  const createMut = useMutation({
    mutationFn: (data: Partial<Homework>) => createHomework(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homeworks'] }); toast.success('Vazifa yaratildi'); closeForm(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Homework> }) => updateHomework(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homeworks'] }); toast.success('Vazifa yangilandi'); closeForm(); },
  });
  const deleteMut = useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homeworks'] }); toast.success("O'chirildi"); setDetailId(null); },
  });
  const gradeMut = useMutation({
    mutationFn: ({ subId, grade, feedback }: { subId: string; grade: number; feedback: string }) =>
      gradeSubmission(subId, grade, feedback),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework-detail', detailId] });
      qc.invalidateQueries({ queryKey: ['homeworks'] });
      toast.success('Baholandi');
      setGradingSub(null);
      setGradeForm({ grade: '', feedback: '' });
    },
  });

  function openCreate() {
    setEditId(null);
    setForm({ title: '', description: '', groupId: groups[0]?.id ?? '', dueDate: '', status: 'OPEN' });
    setShowForm(true);
  }
  function openEdit(hw: Homework) {
    setEditId(hw.homeworkId);
    setForm({
      title: hw.title,
      description: hw.description ?? '',
      groupId: hw.groupId,
      dueDate: hw.dueDate ? hw.dueDate.substring(0, 10) : '',
      status: hw.status,
    });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditId(null); }

  function handleSave() {
    if (!form.title.trim()) { toast.error('Sarlavhani kiriting'); return; }
    if (!form.groupId) { toast.error('Guruhni tanlang'); return; }
    const payload: any = {
      title: form.title,
      description: form.description,
      groupId: form.groupId,
      dueDate: form.dueDate || null,
      status: form.status,
    };
    if (editId) updateMut.mutate({ id: editId, data: payload });
    else createMut.mutate(payload);
  }

  /* Filter */
  const filtered = homeworks.filter((hw) => {
    if (search && !hw.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGroup && hw.groupId !== filterGroup) return false;
    if (filterStatus && hw.status !== filterStatus) return false;
    return true;
  });

  const groupName = (gId: string) => groups.find((g) => g.id === gId)?.name ?? gId.substring(0, 8);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Uy Vazifalari</h1>
            <p className="text-sm text-gray-500">{filtered.length} ta vazifa</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
          <Plus size={16} /> Yangi vazifa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
          <option value="">Barcha holatlar</option>
          <option value="OPEN">Ochiq</option>
          <option value="CLOSED">Yopiq</option>
        </select>
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className={`flex-1 ${detailId ? 'hidden lg:block lg:w-1/2' : ''}`}>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border p-5 h-20 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Vazifa topilmadi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((hw) => (
                <div
                  key={hw.homeworkId}
                  onClick={() => setDetailId(hw.homeworkId)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition ${
                    detailId === hw.homeworkId ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{hw.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={12} /> {groupName(hw.groupId)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {fmt(hw.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        hw.status === 'OPEN'
                          ? isDue(hw.dueDate) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {hw.status === 'OPEN' ? (isDue(hw.dueDate) ? 'Muddati o\'tgan' : 'Ochiq') : 'Yopiq'}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {hw.gradedCount ?? 0}/{hw.submissionCount ?? 0}
                      </span>
                    </div>
                  </div>
                  {hw.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-1">{hw.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {detailId && (
          <div className="w-full lg:w-1/2 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {loadingDetail ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full mx-auto" />
                </div>
              ) : detail ? (
                <>
                  {/* Detail Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-bold text-gray-900">{detail.title}</h2>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users size={12} /> {groupName(detail.groupId)}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> Muddat: {fmt(detail.dueDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(detail)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) deleteMut.mutate(detail.homeworkId); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition">
                          <Trash2 size={16} />
                        </button>
                        <button onClick={() => setDetailId(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition lg:hidden">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {detail.description && (
                      <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{detail.description}</p>
                    )}
                    <div className="flex gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-indigo-600">{detail.submissions.length}</p>
                        <p className="text-xs text-gray-400">Topshirilgan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{detail.submissions.filter(s => s.status === 'GRADED').length}</p>
                        <p className="text-xs text-gray-400">Baholangan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{detail.submissions.filter(s => s.status !== 'GRADED').length}</p>
                        <p className="text-xs text-gray-400">Kutilmoqda</p>
                      </div>
                    </div>
                  </div>

                  {/* Submissions */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Topshiriqlar</h3>
                    {detail.submissions.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">Hali hech kim topshirmagan</p>
                    ) : (
                      <div className="space-y-3">
                        {detail.submissions.map((sub) => (
                          <div key={sub.submissionId} className="border border-gray-100 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-sm text-gray-800">{sub.studentName ?? 'Talaba'}</span>
                                <span className="text-xs text-gray-400 ml-2">{fmtDt(sub.submittedAt)}</span>
                              </div>
                              {sub.status === 'GRADED' ? (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                  <CheckCircle2 size={12} /> {sub.grade}/10
                                </span>
                              ) : (
                                <button onClick={() => { setGradingSub(sub.submissionId); setGradeForm({ grade: '', feedback: '' }); }}
                                  className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition">
                                  Baholash
                                </button>
                              )}
                            </div>
                            {sub.content && (
                              <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg mb-2">{sub.content}</p>
                            )}
                            {sub.fileUrl && (
                              <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                                className="text-xs text-indigo-500 hover:underline">📎 Fayl</a>
                            )}
                            {sub.feedback && (
                              <div className="mt-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                <span className="font-medium text-yellow-700">Izoh:</span> {sub.feedback}
                              </div>
                            )}

                            {/* Grading form */}
                            {gradingSub === sub.submissionId && (
                              <div className="mt-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-gray-600 w-12">Baho:</label>
                                  <div className="flex gap-1">
                                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                      <button key={n}
                                        onClick={() => setGradeForm(p => ({ ...p, grade: String(n) }))}
                                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                                          gradeForm.grade === String(n) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-indigo-100'
                                        }`}>
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <label className="text-xs font-medium text-gray-600 w-12 mt-2">Izoh:</label>
                                  <textarea value={gradeForm.feedback} onChange={(e) => setGradeForm(p => ({ ...p, feedback: e.target.value }))}
                                    rows={2} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Izoh yozing..." />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setGradingSub(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Bekor</button>
                                  <button onClick={() => {
                                    if (!gradeForm.grade) { toast.error('Baho tanlang'); return; }
                                    gradeMut.mutate({ subId: sub.submissionId, grade: Number(gradeForm.grade), feedback: gradeForm.feedback });
                                  }} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition">
                                    Saqlash
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? 'Vazifani tahrirlash' : 'Yangi vazifa'}</h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Guruh *</label>
                <select value={form.groupId} onChange={(e) => setForm(p => ({ ...p, groupId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">Tanlang</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Sarlavha *</label>
                <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Vazifa sarlavhasi" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Batafsil tavsif..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Muddat</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Holat</label>
                  <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="OPEN">Ochiq</option>
                    <option value="CLOSED">Yopiq</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={closeForm} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">Bekor qilish</button>
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                {createMut.isPending || updateMut.isPending ? 'Saqlanmoqda...' : (editId ? 'Yangilash' : 'Yaratish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
