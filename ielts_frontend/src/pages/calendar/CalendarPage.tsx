import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCalendarEvents, type CalendarEvent } from '../../api/calendar';

const WEEK_DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun → convert to Mon-based (0=Mon)
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

interface DayEventsProps {
  events: CalendarEvent[];
}

function DayEvents({ events }: DayEventsProps) {
  if (events.length === 0) return null;
  const visible = events.slice(0, 3);
  const hidden = events.length - 3;
  return (
    <div className="mt-1 space-y-0.5">
      {visible.map((ev) => (
        <div
          key={ev.id}
          title={`${ev.title} — ${ev.groupName}`}
          className={`text-[10px] leading-4 px-1 rounded truncate font-medium ${
            ev.type === 'LESSON'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {ev.type === 'LESSON' ? '📚' : '📝'} {ev.title}
        </div>
      ))}
      {hidden > 0 && (
        <div className="text-[10px] text-gray-400 px-1">+{hidden} ta</div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const from = isoDate(year, month, 1);
  const to = isoDate(year, month, getDaysInMonth(year, month));

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => getCalendarEvents(from, to),
  });

  // Group events by date
  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!byDate[ev.date]) byDate[ev.date] = [];
    byDate[ev.date].push(ev);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Selected day events
  const selectedEvents = selected ? (byDate[selected] ?? []) : [];

  const prev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const next = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📅 Kalendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold text-gray-800 w-44 text-center">
            {MONTHS_UZ[month]} {year}
          </span>
          <button onClick={next} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Week header */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
              Yuklanmoqda...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-50 bg-gray-50/40" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = isoDate(year, month, day);
                const dayEvents = byDate[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selected;

                return (
                  <div
                    key={day}
                    onClick={() => setSelected(dateStr === selected ? null : dateStr)}
                    className={`min-h-[80px] border-r border-b border-gray-100 p-1.5 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'text-indigo-600'
                          : 'text-gray-700'
                      }`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-medium">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <DayEvents events={dayEvents} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Belgilar</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block" />
                <BookOpen size={14} className="text-indigo-500" />
                Dars
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-orange-200 inline-block" />
                <ClipboardList size={14} className="text-orange-500" />
                Imtihon
              </div>
            </div>
          </div>

          {/* Month summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">
              {MONTHS_UZ[month]} xulosa
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">📚 Darslar</span>
                <span className="font-semibold text-indigo-600">
                  {events.filter(e => e.type === 'LESSON').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">📝 Imtihonlar</span>
                <span className="font-semibold text-orange-600">
                  {events.filter(e => e.type === 'EXAM').length}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-medium">
                <span className="text-gray-600">Jami</span>
                <span className="text-gray-800">{events.length} ta</span>
              </div>
            </div>
          </div>

          {/* Selected day details */}
          {selected && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                {new Date(selected + 'T00:00:00').toLocaleDateString('uz-UZ', {
                  day: 'numeric', month: 'long', weekday: 'long'
                })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Bu kunda tadbirlar yo'q</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      to={ev.type === 'LESSON' ? `/groups/${ev.groupId}` : `/groups/${ev.groupId}`}
                      className={`block p-3 rounded-lg border transition hover:shadow-sm ${
                        ev.type === 'LESSON'
                          ? 'border-indigo-100 bg-indigo-50 hover:bg-indigo-100'
                          : 'border-orange-100 bg-orange-50 hover:bg-orange-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">
                          {ev.type === 'LESSON' ? '📚' : '📝'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            ev.type === 'LESSON' ? 'text-indigo-700' : 'text-orange-700'
                          }`}>
                            {ev.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.groupName}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          {!selected && events.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Yaqinlashayotgan</h3>
              <div className="space-y-2">
                {events
                  .filter(e => e.date >= todayStr)
                  .slice(0, 5)
                  .map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        ev.type === 'LESSON' ? 'bg-indigo-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ev.date + 'T00:00:00').toLocaleDateString('uz-UZ', {
                            day: 'numeric', month: 'short'
                          })} · {ev.groupName}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
