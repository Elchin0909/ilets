import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentPayments, getStudentTotal } from '../../api/payments';
import { CreditCard, Loader2, DollarSign, Calendar, FileText } from 'lucide-react';

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['myPayments', studentId],
    queryFn: () => getStudentPayments(studentId),
    enabled: !!studentId,
  });

  const { data: total } = useQuery({
    queryKey: ['myPaymentsTotal', studentId],
    queryFn: () => getStudentTotal(studentId),
    enabled: !!studentId,
  });

  const sorted = [...payments].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' ' + (currency || 'UZS');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={28} />
          <h1 className="text-2xl font-bold">To'lovlar Tarixi</h1>
        </div>
        <p className="text-indigo-100 text-sm">Barcha to'lovlaringiz haqida ma'lumot</p>
        {total != null && (
          <div className="mt-3 bg-white/20 px-4 py-2 rounded-lg inline-block">
            <span className="text-sm">Jami to'langan: </span>
            <span className="text-lg font-bold">{new Intl.NumberFormat('uz-UZ').format(total)} UZS</span>
          </div>
        )}
      </div>

      {/* Payments list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Hali to'lov ma'lumoti yo'q</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sorted.map((p) => {
              const date = p.paidAt
                ? new Date(p.paidAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
                : p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';
              const typeLabel = p.type === 'MONTHLY' ? 'Oylik' :
                               p.type === 'REGISTRATION' ? "Ro'yxatdan" :
                               p.type || 'Boshqa';
              return (
                <div key={p.paymentId} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign size={18} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700">
                        {formatAmount(p.amount, p.currency)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{typeLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {date}
                      </span>
                      {p.month && (
                        <span className="text-xs text-gray-400">Oy: {p.month}</span>
                      )}
                    </div>
                    {p.notes && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <FileText size={10} /> {p.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
