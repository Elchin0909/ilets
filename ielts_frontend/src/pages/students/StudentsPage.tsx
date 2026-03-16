import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Search, Download,
  User, Phone, Mail, Calendar, Shield, Key, BookOpen, FileText,
  DollarSign, X, ArrowUpDown, Filter, UserCheck, UserX,
  ClipboardList,
} from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/students';
import { getEnrollmentsByStudent, getEnrollments, getGroups, deleteEnrollment, updateEnrollmentStatus } from '../../api/groups';
import { getStudentPayments, createPayment, deletePayment } from '../../api/payments';
import { getStudentWritingLogs } from '../../api/ai';
import { getStudentQuizResults } from '../../api/quiz';
import { createStudentAccount, resetStudentPassword } from '../../api/admin';
import { getLessonsByGroup } from '../../api/lessons';
import type { Student, StudentCreateRequest, Enrollment, Lesson } from '../../types';
import type { PaymentCreateRequest } from '../../api/payments';
import type { WritingLogEntry } from '../../api/ai';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';

/* ── helpers ──────────────────────────────────────────────────────── */

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function exportCSV(students: Student[]) {
  const header = ["To'liq ism", 'Telefon', 'Email', "Tug'ilgan sana", 'Akkaunt', "Qo'shilgan"];
  const rows = students.map((s) => [
    s.fullName,
    s.phone ?? '',
    s.email ?? '',
    s.birthDate ?? '',
    s.hasAccount ? 'Ha' : "Yo'q",
    s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ') : '',
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talabalar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV yuklandi!');
}

/* ── StudentForm ──────────────────────────────────────────────────── */

function StudentForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Student>;
  onSubmit: (data: StudentCreateRequest) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<StudentCreateRequest>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    birthDate: initial?.birthDate ?? '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism *</label>
        <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ism Familiya" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
        <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+998901234567" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
        <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
          {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

/* ── AccountModal ────────────────────────────────────────────────── */

function AccountModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [username, setUsername] = useState(student.username ?? '');
  const [password, setPassword] = useState('');
  const isReset = !!student.hasAccount;

  const createMut = useMutation({
    mutationFn: () => createStudentAccount(student.id, username, password),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Akkaunt yaratildi!'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Xatolik'),
  });

  const resetMut = useMutation({
    mutationFn: () => resetStudentPassword(student.id, password),
    onSuccess: () => { toast.success('Parol yangilandi!'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Xatolik'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); isReset ? resetMut.mutate() : createMut.mutate(); }} className="space-y-4">
      {!isReset && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      )}
      {isReset && (
        <p className="text-sm text-gray-500">Foydalanuvchi: <strong>{student.username}</strong></p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{isReset ? 'Yangi parol' : 'Parol'}</label>
        <input required type="password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Kamida 4 ta belgi" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={createMut.isPending || resetMut.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
          {isReset ? 'Parolni yangilash' : 'Akkaunt yaratish'}
        </button>
      </div>
    </form>
  );
}

/* ── PaymentModal ────────────────────────────────────────────────── */

function PaymentModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<PaymentCreateRequest>({
    studentId,
    amount: 0,
    type: 'MONTHLY',
    month: new Date().toISOString().slice(0, 7),
    notes: '',
    paidAt: new Date().toISOString().slice(0, 10),
  });

  const mut = useMutation({
    mutationFn: () => createPayment(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments', studentId] }); toast.success("To'lov qo'shildi!"); onClose(); },
    onError: () => toast.error('Xatolik'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summa (UZS) *</label>
        <input required type="number" min={1} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="MONTHLY">Oylik</option>
            <option value="REGISTRATION">Ro'yxatga olish</option>
            <option value="OTHER">Boshqa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Oy</label>
          <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
        <input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={mut.isPending}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-5 rounded-lg transition">
          {mut.isPending ? 'Saqlanmoqda...' : "To'lovni saqlash"}
        </button>
      </div>
    </form>
  );
}

/* ── HomeworkList (fetches lessons from enrolled groups) ────────── */

function HomeworkList({ enrollments }: { enrollments: Enrollment[] }) {
  const activeGroupIds = enrollments
    .filter((e) => e.status === 'ACTIVE')
    .map((e) => e.groupId);

  const lessonQueries = useQuery({
    queryKey: ['student-homework', ...activeGroupIds],
    queryFn: async () => {
      const all: (Lesson & { groupName?: string })[] = [];
      for (const gId of activeGroupIds) {
        const lessons = await getLessonsByGroup(gId);
        const groupName = enrollments.find((e) => e.groupId === gId)?.groupName;
        lessons.forEach((l) => all.push({ ...l, groupName }));
      }
      return all.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
    },
    enabled: activeGroupIds.length > 0,
  });

  const lessons = lessonQueries.data ?? [];
  const withHomework = lessons.filter((l) => l.homework);

  if (activeGroupIds.length === 0) return <p className="text-sm text-gray-400">Faol guruh yo'q</p>;
  if (lessonQueries.isLoading) return <p className="text-sm text-gray-400">Yuklanmoqda...</p>;
  if (withHomework.length === 0) return <p className="text-sm text-gray-400">Uy vazifalar topilmadi</p>;

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {withHomework.slice(0, 10).map((l) => (
        <div key={l.id} className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{l.groupName}</span>
            <span>{new Date(l.lessonDate).toLocaleDateString('uz-UZ')}</span>
          </div>
          {l.topic && <p className="text-sm font-medium text-gray-700">{l.topic}</p>}
          <p className="text-sm text-gray-600">{l.homework}</p>
        </div>
      ))}
    </div>
  );
}

/* ── StudentDetailPanel ──────────────────────────────────────────── */

function StudentDetailPanel({
  student,
  onClose,
  onEdit,
  onAccount,
}: {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onAccount: () => void;
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'homework' | 'writing' | 'quiz'>('info');
  const [showPayModal, setShowPayModal] = useState(false);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments-student', student.id],
    queryFn: () => getEnrollmentsByStudent(student.id),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', student.id],
    queryFn: () => getStudentPayments(student.id),
    enabled: activeTab === 'payments' || activeTab === 'info',
  });

  const { data: writingLogs = [] } = useQuery<WritingLogEntry[]>({
    queryKey: ['writing-logs', student.id],
    queryFn: () => getStudentWritingLogs(student.id),
    enabled: activeTab === 'writing',
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ['quiz-results', student.id],
    queryFn: () => getStudentQuizResults(student.id),
    enabled: activeTab === 'quiz',
  });

  const deleteEnrollMut = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['enrollments-student', student.id] }); toast.success("O'chirildi"); },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateEnrollmentStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['enrollments-student', student.id] }); toast.success('Yangilandi'); },
  });

  const deletePayMut = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments', student.id] }); toast.success("O'chirildi"); },
  });

  const tabs = [
    { key: 'info' as const, label: "Ma'lumot", icon: User },
    { key: 'payments' as const, label: "To'lovlar", icon: DollarSign },
    { key: 'homework' as const, label: 'Uy vazifa', icon: BookOpen },
    { key: 'writing' as const, label: 'Writing', icon: FileText },
    { key: 'quiz' as const, label: 'Quiz', icon: ClipboardList },
  ];

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{student.fullName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {student.phone && <span className="flex items-center gap-1"><Phone size={12} /> {student.phone}</span>}
              {student.email && <span className="flex items-center gap-1"><Mail size={12} /> {student.email}</span>}
              {student.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {student.birthDate} ({calculateAge(student.birthDate)} yosh)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAccount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            title={student.hasAccount ? 'Parolni yangilash' : 'Akkaunt yaratish'}>
            {student.hasAccount ? <Key size={14} /> : <Shield size={14} />}
            {student.hasAccount ? 'Parol' : 'Akkaunt'}
          </button>
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition">
            <Pencil size={16} />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Account status badge */}
      <div className="px-5 pt-3 flex items-center gap-2">
        {student.hasAccount ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
            <UserCheck size={12} /> Akkaunt mavjud ({student.username})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            <UserX size={12} /> Akkaunt yo'q
          </span>
        )}
        <span className="text-xs text-gray-400">
          Jami to'lov: {totalPaid.toLocaleString()} UZS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-3 border-b border-gray-100">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === t.key
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 py-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {/* === INFO TAB === */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <BookOpen size={14} /> Guruhlar ({enrollments.length})
              </h4>
              {enrollments.length === 0 ? (
                <p className="text-sm text-gray-400">Guruhga yozilmagan</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{e.groupName ?? e.groupId}</p>
                        <p className="text-xs text-gray-400">{e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('uz-UZ') : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={e.status} onChange={(ev) => updateStatusMut.mutate({ id: e.id, status: ev.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DROPPED">DROPPED</option>
                        </select>
                        <button onClick={() => { if (confirm("Yozuvni o'chirasizmi?")) deleteEnrollMut.mutate(e.id); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === PAYMENTS TAB === */}
        {activeTab === 'payments' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">To'lovlar ({payments.length})</h4>
              <button onClick={() => setShowPayModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition">
                <Plus size={14} /> Qo'shish
              </button>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">To'lovlar yo'q</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.paymentId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{p.amount.toLocaleString()} {p.currency}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          p.type === 'MONTHLY' ? 'bg-blue-100 text-blue-700' :
                          p.type === 'REGISTRATION' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{p.type}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {p.month && `${p.month} · `}
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : ''}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    <button onClick={() => { if (confirm("To'lovni o'chirasizmi?")) deletePayMut.mutate(p.paymentId); }}
                      className="p-1 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="To'lov qo'shish">
              <PaymentModal studentId={student.id} onClose={() => setShowPayModal(false)} />
            </Modal>
          </div>
        )}

        {/* === HOMEWORK TAB === */}
        {activeTab === 'homework' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Uy vazifalari</h4>
            <HomeworkList enrollments={enrollments} />
          </div>
        )}

        {/* === WRITING TAB === */}
        {activeTab === 'writing' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Writing baholari ({writingLogs.length})</h4>
            {writingLogs.length === 0 ? (
              <p className="text-sm text-gray-400">Writing baholari yo'q</p>
            ) : (
              <div className="space-y-2">
                {writingLogs.map((w) => (
                  <div key={w.logId} className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          w.taskType === 'task1' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{w.taskType === 'task1' ? 'Task 1' : 'Task 2'}</span>
                        <span className="text-sm font-semibold text-gray-800">Band: {w.bandRange}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Daraja: {w.level}</p>
                    {w.textSnippet && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{w.textSnippet}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === QUIZ TAB === */}
        {activeTab === 'quiz' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Quiz natijalari ({quizResults.length})</h4>
            {quizResults.length === 0 ? (
              <p className="text-sm text-gray-400">Quiz natijalari yo'q</p>
            ) : (
              <div className="space-y-2">
                {quizResults.map((r) => (
                  <div key={r.resultId} className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.testTitle ?? 'Test'}</p>
                        {r.testLevel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                            {r.testLevel}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{r.score}%</p>
                        <p className="text-xs text-gray-400">{r.correctAnswers}/{r.totalQuestions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.submittedAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main: StudentsPage ──────────────────────────────────────────── */

type SortField = 'name' | 'date';
type SortDir = 'asc' | 'desc';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [accountStudent, setAccountStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  const { data: allEnrollments = [] } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: getEnrollments,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  // Build studentId → groupIds map for filtering
  const studentGroupMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of allEnrollments) {
      if (e.status === 'ACTIVE' || e.status === 'active') {
        if (!map.has(e.studentId)) map.set(e.studentId, new Set());
        map.get(e.studentId)!.add(e.groupId);
      }
    }
    return map;
  }, [allEnrollments]);

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setShowCreate(false); toast.success("Talaba qo'shildi!"); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentCreateRequest }) => updateStudent(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setEditStudent(null); toast.success('Yangilandi!'); },
    onError: () => toast.error('Yangilashda xatolik'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setSelectedStudent(null); toast.success("O'chirildi"); },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const filtered = useMemo(() => {
    let list = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
    );
    if (accountFilter === 'yes') list = list.filter((s) => s.hasAccount);
    if (accountFilter === 'no') list = list.filter((s) => !s.hasAccount);
    if (groupFilter !== 'all') {
      list = list.filter((s) => studentGroupMap.get(s.id)?.has(groupFilter));
    }

    list.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.fullName.localeCompare(b.fullName, 'uz');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const da = a.createdAt ?? '';
      const db = b.createdAt ?? '';
      const cmp = da.localeCompare(db);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [students, search, accountFilter, groupFilter, studentGroupMap, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const columns = [
    {
      key: 'fullName',
      header: "To'liq ism",
      render: (s: Student) => (
        <button onClick={() => setSelectedStudent(s)} className="font-medium text-gray-800 hover:text-indigo-600 transition text-left">
          {s.fullName}
        </button>
      ),
    },
    { key: 'phone', header: 'Telefon' },
    {
      key: 'email',
      header: 'Email',
      render: (s: Student) => s.email || <span className="text-gray-300">—</span>,
    },
    {
      key: 'account',
      header: 'Akkaunt',
      render: (s: Student) =>
        s.hasAccount ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            <UserCheck size={11} /> {s.username}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Sana',
      render: (s: Student) => s.createdAt ? (
        <span className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString('uz-UZ')}</span>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (s: Student) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setEditStudent(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Tahrirlash">
            <Pencil size={14} />
          </button>
          <button onClick={() => { if (confirm(`"${s.fullName}" o'chirasizmi?`)) deleteMutation.mutate(s.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="O'chirish">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Talabalar"
        subtitle={`Jami ${students.length} talaba`}
        action={
          <div className="flex gap-2">
            <button onClick={() => exportCSV(filtered)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition" title="CSV yuklab olish">
              <Download size={15} /> CSV
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition">
              <Plus size={16} /> Talaba qo'shish
            </button>
          </div>
        }
      />

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition ${
            showFilters || accountFilter !== 'all' || groupFilter !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          <Filter size={15} /> Filter
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-50 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-600">Guruh:</span>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500">
            <option value="all">Barchasi</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 ml-2">Akkaunt:</span>
          {(['all', 'yes', 'no'] as const).map((v) => (
            <button key={v} onClick={() => setAccountFilter(v)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                accountFilter === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}>
              {v === 'all' ? 'Barchasi' : v === 'yes' ? 'Bor' : "Yo'q"}
            </button>
          ))}
          <span className="text-sm text-gray-600 ml-2">Saralash:</span>
          <button onClick={() => toggleSort('name')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${
              sortField === 'name' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}>
            <ArrowUpDown size={13} /> Ism {sortField === 'name' && (sortDir === 'asc' ? '(A-Z)' : '(Z-A)')}
          </button>
          <button onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${
              sortField === 'date' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}>
            <ArrowUpDown size={13} /> Sana {sortField === 'date' && (sortDir === 'asc' ? '(eski)' : '(yangi)')}
          </button>
        </div>
      )}

      <Table columns={columns} data={filtered} keyField="id" loading={isLoading} emptyMessage="Talabalar topilmadi" />

      {/* Inline detail panel */}
      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={() => { setEditStudent(selectedStudent); }}
          onAccount={() => setAccountStudent(selectedStudent)}
        />
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi Talaba">
        <StudentForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Talabani tahrirlash">
        {editStudent && (
          <StudentForm initial={editStudent} onSubmit={(data) => updateMutation.mutate({ id: editStudent.id, data })} loading={updateMutation.isPending} />
        )}
      </Modal>

      {/* Account modal */}
      <Modal isOpen={!!accountStudent} onClose={() => setAccountStudent(null)} title={accountStudent?.hasAccount ? 'Parolni yangilash' : 'Akkaunt yaratish'}>
        {accountStudent && <AccountModal student={accountStudent} onClose={() => setAccountStudent(null)} />}
      </Modal>
    </div>
  );
}
