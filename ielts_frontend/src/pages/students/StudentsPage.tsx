import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/students';
import type { Student, StudentCreateRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';

/* ── CSV export ──────────────────────────── */
function exportCSV(students: Student[]) {
  const header = ["To'liq ism", 'Telefon', 'Email'];
  const rows = students.map((s) => [
    s.fullName,
    s.phone ?? '',
    s.email ?? '',
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
  toast.success("CSV yuklandi!");
}

/* ── Form ────────────────────────────────── */
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
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ism *</label>
        <input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ism Familiya"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
        <input
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="+998901234567"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="email@example.com"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition"
        >
          {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

/* ── Main ────────────────────────────────── */
export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setShowCreate(false); toast.success("Talaba qo'shildi!"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentCreateRequest }) => updateStudent(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setEditStudent(null); toast.success("Yangilandi!"); },
    onError: () => toast.error("Yangilashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); toast.success("O'chirildi"); },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const navigate = useNavigate();

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const columns = [
    {
      key: 'fullName', header: "To'liq ism",
      render: (s: Student) => (
        <button onClick={() => navigate(`/students/${s.id}`)} className="font-medium text-gray-800 hover:text-indigo-600 transition text-left">
          {s.fullName}
        </button>
      ),
    },
    { key: 'phone', header: 'Telefon' },
    { key: 'email', header: 'Email', render: (s: Student) => s.email || <span className="text-gray-300">—</span> },
    {
      key: 'actions',
      header: '',
      render: (s: Student) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => navigate(`/students/${s.id}`)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Ko'rish"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setEditStudent(s)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Tahrirlash"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => {
              if (confirm(`"${s.fullName}" talabani o'chirasizmi?`)) {
                deleteMutation.mutate(s.id);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="O'chirish"
          >
            <Trash2 size={15} />
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
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
              title="CSV yuklab olish"
            >
              <Download size={15} />
              CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              <Plus size={16} />
              Talaba qo'shish
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Table columns={columns} data={filtered} keyField="id" loading={isLoading} emptyMessage="Talabalar topilmadi" />

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi Talaba">
        <StudentForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Talabani tahrirlash">
        {editStudent && (
          <StudentForm
            initial={editStudent}
            onSubmit={(data) => updateMutation.mutate({ id: editStudent.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
