import { useState, useRef, useEffect } from 'react';
import { Search, X, Users, Layers, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../../api/students';
import { getGroups } from '../../api/groups';
import { getTeachers } from '../../api/teachers';
import { useAuth } from '../../contexts/AuthContext';

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  type: 'student' | 'group' | 'teacher';
  path: string;
}

export default function GlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isStudent = user?.role === 'STUDENT';

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents, enabled: !isStudent });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups, enabled: !isStudent });
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers, enabled: !isStudent });

  const q = query.toLowerCase().trim();

  const results: SearchResult[] = q.length < 2 ? [] : [
    ...students
      .filter((s) => s.fullName.toLowerCase().includes(q) || s.phone?.includes(q))
      .slice(0, 4)
      .map((s) => ({ id: s.id, label: s.fullName, sub: s.phone, type: 'student' as const, path: `/students/${s.id}` })),
    ...groups
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((g) => ({ id: g.id, label: g.name, sub: g.schedule, type: 'group' as const, path: `/groups/${g.id}` })),
    ...teachers
      .filter((t: any) => t.fullName?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((t: any) => ({ id: t.id ?? t.teacherId, label: t.fullName ?? t.name, sub: t.phone, type: 'teacher' as const, path: `/teachers/${t.id ?? t.teacherId}` })),
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  const typeIcon = (type: string) => {
    if (type === 'student') return <Users size={13} className="text-blue-500" />;
    if (type === 'group') return <Layers size={13} className="text-green-500" />;
    return <GraduationCap size={13} className="text-purple-500" />;
  };

  const typeLabel = (type: string) => {
    if (type === 'student') return 'Talaba';
    if (type === 'group') return 'Guruh';
    return "O'qituvchi";
  };

  if (isStudent) return null;

  return (
    <div className="relative flex-1 max-w-sm mr-4" ref={containerRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Qidirish... (Ctrl+K)"
          className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300 transition"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-5 text-center text-sm text-gray-400">Hech narsa topilmadi</div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => go(r.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {typeIcon(r.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.label}</p>
                      {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">{typeLabel(r.type)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
