import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, CreditCard, TrendingUp, Download } from 'lucide-react';
import { getPayments, createPayment, deletePayment, getMonthTotal, type Payment, type PaymentCreateRequest } from '../../api/payments';
import { getStudents } from '../../api/students';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

/* ── Helpers ──────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Oylik',
  REGISTRATION: "Ro'yxatdan o'tish",
  OTHER: 'Boshqa',
};

const TYPE_COLORS: Record<string, string> = {
  MONTHLY: 'text-blue-700 bg-blue-50',
  REGISTRATION: 'text-purple-700 bg-purple-50',
  OTHER: 'text-gray-700 bg-gray-100',
};

function fmt(amount: number, currency = 'UZS') {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' ' + currency;
}

function exportCSV(payments: Payment[]) {
  const header = ["Talaba", "Miqdor", "Valyuta", "Tur", "Oy", "Sana", "Izoh"];
  const rows = payments.map((p) => [
    p.studentName,
    p.amount,
    p.currency,
    TYPE_LABELS[p.type] ?? p.type,
    p.month ?? '',
    p.paidAt ?? '',
    p.notes ?? '',
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tolovlar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV yuklandi!");
}

/* ── Payment Form ────────────────────── */
function PaymentForm({ onSubmit, loading }: { onSubmit: (d: PaymentCreateRequest) => void; loading: boolean }) {
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState<PaymentCreateRequest>({
    studentId: '',
    amount: 0,
    currency: 'UZS',
    type: 'MONTHLY',
    month: thisMonth,
    notes: '',
    paidAt: today,
  });

  const set = (k: keyof PaymentCreateRequest, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Talaba *</label>
        <select
          required
          value={form.studentId}
          onChange={(e) => set('studentId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">— Tanlang —</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor *</label>
          <input
            required
            type="number"
            min={0}
            value={form.amount || ''}
            onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="500000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
          <select
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option>UZS</option>
            <option>USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="MONTHLY">Oylik</option>
            <option value="REGISTRATION">Ro'yxatdan o'tish</option>
            <option value="OTHER">Boshqa</option>
          </select>
        </div>
        {form.type === 'MONTHLY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oy</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => set('month', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To'lov sanasi</label>
        <input
          type="date"
          value={form.paidAt}
          onChange={(e) => set('paidAt', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
        <input
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="Ixtiyoriy"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading || !form.studentId || !form.amount}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-6 rounded-lg transition text-sm"
        >
          {loading ? 'Saqlanmoqda...' : "Saqlash"}
        </button>
      </div>
    </form>
  );
}

/* ── Main ────────────────────────────── */
export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const thisMonth = new Date().toISOString().slice(0, 7);

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: getPayments });
  const { data: monthTotal } = useQuery({
    queryKey: ['monthTotal', filterMonth || thisMonth],
    queryFn: () => getMonthTotal(filterMonth || thisMonth),
  });

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['monthTotal'] });
      setShowCreate(false);
      toast.success("To'lov qo'shildi!");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("O'chirildi");
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const filtered = payments.filter((p) => {
    const matchSearch = !search ||
      p.studentName.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type === filterType;
    const matchMonth = !filterMonth || p.month === filterMonth;
    return matchSearch && matchType && matchMonth;
  });

  const totalFiltered = filtered.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="To'lovlar"
        subtitle={`Jami ${payments.length} ta to'lov`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              <Download size={15} /> CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              <Plus size={16} /> To'lov qo'shish
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Bu oy tushumi</p>
            <p className="text-base font-bold text-gray-900">{fmt(Number(monthTotal ?? 0))}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Filtrlangan jami</p>
            <p className="text-base font-bold text-gray-900">{fmt(totalFiltered)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">To'lovlar soni</p>
            <p className="text-base font-bold text-gray-900">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Talaba bo'yicha qidirish..."
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Barcha turlar</option>
          <option value="MONTHLY">Oylik</option>
          <option value="REGISTRATION">Ro'yxatdan o'tish</option>
          <option value="OTHER">Boshqa</option>
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(search || filterType || filterMonth) && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterMonth(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 transition"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-gray-400 text-sm">To'lovlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Talaba</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Miqdor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Tur</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Oy</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Izoh</th>
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.studentName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {fmt(Number(p.amount), p.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[p.type] ?? 'text-gray-600 bg-gray-100'}`}>
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.month ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.notes || '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm("Bu to'lovni o'chirasizmi?")) {
                              deleteMutation.mutate(p.paymentId);
                            }
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500">{filtered.length} ta yozuv</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(totalFiltered)}</td>
                  <td colSpan={isAdmin ? 5 : 4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi To'lov">
        <PaymentForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>
    </div>
  );
}
