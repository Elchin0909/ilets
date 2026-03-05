import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  LogOut,
  ShieldCheck,
  UserCircle,
  PenLine,
  BarChart2,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getChatSummary } from '../../api/chat';

const navItems = [
  { to: '/', label: 'Bosh Sahifa', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/students', label: 'Talabalar', icon: Users, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/teachers', label: "O'qituvchilar", icon: GraduationCap, roles: ['ADMIN', 'RECEPTION'] },
  { to: '/courses', label: 'Kurslar', icon: BookOpen, roles: ['ADMIN', 'RECEPTION'] },
  { to: '/groups', label: 'Guruhlar', icon: Layers, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/chats', label: 'Chatlar', icon: MessageSquare, roles: ['ADMIN', 'TEACHER', 'RECEPTION', 'STUDENT'], chat: true },
  { to: '/calendar', label: 'Kalendar', icon: CalendarDays, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/lessons', label: 'Darslar', icon: CalendarCheck, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/exams', label: 'Imtihonlar', icon: ClipboardList, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/quiz/tests', label: 'Test Banki', icon: ClipboardList, roles: ['ADMIN', 'TEACHER'] },
  { to: '/attendance', label: 'Davomat', icon: FileText, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/ai/writing', label: 'AI Writing', icon: PenLine, roles: ['ADMIN', 'TEACHER', 'RECEPTION'] },
  { to: '/payments', label: "To'lovlar", icon: CreditCard, roles: ['ADMIN', 'RECEPTION'] },
  { to: '/analytics', label: 'Statistika', icon: BarChart2, roles: ['ADMIN', 'RECEPTION'] },
  { to: '/users', label: 'Foydalanuvchilar', icon: ShieldCheck, roles: ['ADMIN'] },
  { to: '/student-profile', label: 'Mening Profilim', icon: UserCircle, roles: ['STUDENT'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  // Chat summary — xabar bor guruhlar sonini bilish uchun
  const { data: summaries = [] } = useQuery({
    queryKey: ['chatSummary'],
    queryFn: getChatSummary,
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const groupsWithMessages = summaries.filter(s => !!s.lastMessageId).length;

  const visibleItems = navItems.filter(({ roles }) =>
    roles.includes(user?.role ?? '')
  );

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">I</span>
        </div>
        <div>
          <p className="text-white font-semibold leading-tight">IELTS Centre</p>
          <p className="text-gray-400 text-xs">
            {user?.role === 'STUDENT' ? 'Talaba Kabineti' : 'Boshqaruv Tizimi'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon, chat }: any) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {/* Chat badge */}
            {chat && groupsWithMessages > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {groupsWithMessages > 9 ? '9+' : groupsWithMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className="text-gray-400 text-xs">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
