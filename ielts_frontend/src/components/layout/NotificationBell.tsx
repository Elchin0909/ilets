import { useState, useRef, useEffect } from 'react';
import { Bell, Phone, CheckCircle, Info, AlertTriangle, CheckCircle2, BookOpen, ClipboardList, CreditCard } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingStudents, approveStudent, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, type AppNotification } from '../../api/notifications';
import { useAuth } from '../../contexts/AuthContext';

const TYPE_ICONS: Record<string, any> = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle2,
  HOMEWORK: BookOpen,
  EXAM: ClipboardList,
  PAYMENT: CreditCard,
};
const TYPE_COLORS: Record<string, string> = {
  INFO: 'text-blue-500 bg-blue-50',
  WARNING: 'text-orange-500 bg-orange-50',
  SUCCESS: 'text-green-500 bg-green-50',
  HOMEWORK: 'text-purple-500 bg-purple-50',
  EXAM: 'text-indigo-500 bg-indigo-50',
  PAYMENT: 'text-yellow-600 bg-yellow-50',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  return `${days} kun oldin`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'notifications' | 'pending'>('notifications');
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTION';

  const { data: pending = [] } = useQuery({
    queryKey: ['pending-students'],
    queryFn: getPendingStudents,
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 15_000,
  });

  const approveMutation = useMutation({
    mutationFn: approveStudent,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-students'] }); },
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalBadge = (unreadCount || 0) + (isAdmin ? pending.length : 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        title="Bildirishnomalar"
      >
        <Bell size={20} />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => setTab('notifications')}
              className={`flex-1 text-sm font-medium py-3 transition ${tab === 'notifications' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Bildirishnomalar {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
            {isAdmin && (
              <button onClick={() => setTab('pending')}
                className={`flex-1 text-sm font-medium py-3 transition ${tab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                Yangi talabalar {pending.length > 0 && <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>}
              </button>
            )}
          </div>

          {tab === 'notifications' ? (
            <>
              {unreadCount > 0 && (
                <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                  <button onClick={() => markAllMut.mutate()} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    Barchasini o'qilgan deb belgilash
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">Bildirishnomalar yo'q</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                  {notifications.slice(0, 20).map((n: AppNotification) => {
                    const Icon = TYPE_ICONS[n.type] || Info;
                    const colors = TYPE_COLORS[n.type] || 'text-gray-500 bg-gray-50';
                    return (
                      <li key={n.notificationId}
                        onClick={() => !n.read && markReadMut.mutate(n.notificationId)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              {pending.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">Yangi talabalar yo'q</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {pending.map((s) => (
                    <li key={s.studentId} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{s.fullName || s.username}</p>
                          <p className="text-xs text-gray-500 mt-0.5">@{s.username}</p>
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                              onClick={(e) => e.stopPropagation()}>
                              <Phone size={11} /> {s.phone}
                            </a>
                          )}
                        </div>
                        <button onClick={() => approveMutation.mutate(s.studentId)}
                          disabled={approveMutation.isPending}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors">
                          <CheckCircle size={13} /> Qabul
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
