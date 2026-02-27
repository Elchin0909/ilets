import { useState, useRef, useEffect } from 'react';
import { Bell, Phone, CheckCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingStudents, approveStudent } from '../../api/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const canSee = user?.role === 'ADMIN' || user?.role === 'RECEPTION';

  const { data: pending = [] } = useQuery({
    queryKey: ['pending-students'],
    queryFn: getPendingStudents,
    enabled: canSee,
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: approveStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-students'] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!canSee) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        title="Yangi talabalar"
      >
        <Bell size={20} />
        {pending.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {pending.length > 9 ? '9+' : pending.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-800 text-sm">
              Yangi ro'yxatdan o'tganlar
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {pending.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Yangi talabalar yo'q
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {pending.map((s) => (
                <li key={s.studentId} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {s.fullName || s.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        @{s.username}
                      </p>
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={11} />
                          {s.phone}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => approveMutation.mutate(s.studentId)}
                      disabled={approveMutation.isPending}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors"
                      title="Qabul qilish"
                    >
                      <CheckCircle size={13} />
                      Qabul
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
