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
  BookOpen as BookOpenIcon,
  BookMarked,
  Library,
  Trophy,
  HelpCircle,
  Moon,
  Sun,
  X,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  { to: '/resources-manage', label: 'Resurslar', icon: Library, roles: ['ADMIN', 'TEACHER'] },
  { to: '/support-admin', label: 'Murojaatlar', icon: HelpCircle, roles: ['ADMIN', 'RECEPTION'] },
  { to: '/users', label: 'Foydalanuvchilar', icon: ShieldCheck, roles: ['ADMIN'] },
  { to: '/student-profile', label: 'Mening Profilim', icon: UserCircle, roles: ['STUDENT'] },
  { to: '/my-group', label: 'Guruhim', icon: Users, roles: ['STUDENT'] },
  { to: '/dictionary', label: "Lug'at", icon: BookOpenIcon, roles: ['STUDENT'] },
  { to: '/writing', label: 'Writing', icon: PenLine, roles: ['STUDENT'] },
  { to: '/vocabulary', label: "So'z Daftari", icon: BookMarked, roles: ['STUDENT'] },
  { to: '/schedule', label: 'Dars Jadvali', icon: CalendarDays, roles: ['STUDENT'] },
  { to: '/my-attendance', label: 'Davomatim', icon: FileText, roles: ['STUDENT'] },
  { to: '/my-payments', label: "To'lovlarim", icon: CreditCard, roles: ['STUDENT'] },
  { to: '/library', label: 'Kutubxona', icon: Library, roles: ['STUDENT'] },
  { to: '/videos', label: 'Video Darslar', icon: PlayCircle, roles: ['STUDENT'] },
  { to: '/leaderboard', label: 'Reyting', icon: Trophy, roles: ['STUDENT'] },
  { to: '/support', label: 'Yordam', icon: HelpCircle, roles: ['STUDENT'] },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: summaries = [] } = useQuery({
    queryKey: ['chatSummary'],
    queryFn: getChatSummary,
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const groupsWithMessages = summaries.filter((s) => !!s.lastMessageId).length;

  const isPendingStudent = user?.role === 'STUDENT' && user?.active === false;

  const visibleItems = isPendingStudent
    ? navItems.filter(({ to }) => to === '/support')
    : navItems.filter(({ roles }) => roles.includes(user?.role ?? ''));

  return (
    <aside
      className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 flex flex-col z-40 transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">I</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold leading-tight">IELTS Centre</p>
          <p className="text-gray-400 text-xs">
            {user?.role === 'STUDENT' ? 'Talaba Kabineti' : 'Boshqaruv Tizimi'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Pending student welcome */}
      {isPendingStudent && (
        <div className="mx-3 mt-4 bg-indigo-800/50 border border-indigo-600/30 rounded-xl px-4 py-3">
          <p className="text-indigo-200 text-sm font-medium">Xush kelibsiz!</p>
          <p className="text-indigo-300/80 text-xs mt-1">
            Hisobingiz ko'rib chiqilmoqda. Qiziqtirgan savollaringizni quyida yozishingiz mumkin.
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon, chat }: any) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
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
            {chat && groupsWithMessages > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {groupsWithMessages > 9 ? '9+' : groupsWithMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + dark mode + logout */}
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
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
