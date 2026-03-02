import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Eye, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../api/teachers';
import { resetTeacherPassword } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import type { Teacher, TeacherCreateRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import { showSuccess, showError } from '../../utils/toast';

function TeacherForm({
  initial,
  onSubmit,
  loading,
  isEdit,
}: {
  initial?: Partial<Teacher>;
  onSubmit: (data: TeacherCreateRequest) => void;
  loading: boolean;
  isEdit?: boolean;
}) {
  const [form, setForm] = useState<TeacherCreateRequest>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    username: initial?.username ?? '',
    password: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
        <input
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
        <input
          required={!isEdit}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (password: string) => resetTeacherPassword(teacher.teacherId, password),
    onSuccess: () => {
      onClose();
      showSuccess("Parol muvaffaqiyatli o'zgartirildi!");
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) { showError('Parol kamida 4 ta belgidan iborat bo\'lishi kerak'); return; }
    if (newPassword !== confirmPassword) { showError('Parollar mos kelmadi'); return; }
    mutation.mutate(newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{teacher.fullName}</span> uchun yangi parol
        {teacher.username && <span className="text-gray-400"> (@{teacher.username})</span>}
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol *</label>
        <input
          required
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Kamida 6 ta belgi"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tasdiqlang *</label>
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Parolni qayta kiriting"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-5 rounded-lg transition text-sm"
        >
          {mutation.isPending ? 'Saqlanmoqda...' : 'Parolni o\'zgartir'}
        </button>
      </div>
    </form>
  );
}

export default function TeachersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState<Teacher | null>(null);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  });

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherCreateRequest> }) =>
      updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setEditTeacher(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  });

  const navigate = useNavigate();

  const filtered = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
  );

  const columns = [
    { key: 'id', header: '#', render: (t: Teacher) => <span className="text-gray-400 text-xs">{t.id.slice(0, 8)}…</span> },
    { key: 'fullName', header: 'Full Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email', render: (t: Teacher) => t.email || <span className="text-gray-400">—</span> },
    { key: 'username', header: 'Username', render: (t: Teacher) => t.username || <span className="text-gray-400">—</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Teacher) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/teachers/${t.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ko'rish">
            <Eye size={15} />
          </button>
          {isAdmin && (
            <button onClick={() => setResetPasswordTeacher(t)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Parolni o'zgartir">
              <KeyRound size={15} />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setEditTeacher(t)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <Pencil size={15} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { if (window.confirm(`"${t.fullName}" o'qituvchisini o'chirish?`)) deleteMutation.mutate(t.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teachers total`}
        action={isAdmin ? (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition">
            <Plus size={16} />
            Add Teacher
          </button>
        ) : undefined}
      />
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <Table columns={columns} data={filtered} keyField="id" loading={isLoading} emptyMessage="No teachers found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Teacher">
        <TeacherForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editTeacher} onClose={() => setEditTeacher(null)} title="Edit Teacher">
        {editTeacher && (
          <TeacherForm
            initial={editTeacher}
            isEdit
            onSubmit={(data) => updateMutation.mutate({ id: editTeacher.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!resetPasswordTeacher}
        onClose={() => setResetPasswordTeacher(null)}
        title="Parolni o'zgartirish"
      >
        {resetPasswordTeacher && (
          <ResetPasswordModal
            teacher={resetPasswordTeacher}
            onClose={() => setResetPasswordTeacher(null)}
          />
        )}
      </Modal>
    </div>
  );
}
