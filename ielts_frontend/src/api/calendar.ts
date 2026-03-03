import api from './axios';

export interface CalendarEvent {
  id: string;
  type: 'LESSON' | 'EXAM';
  date: string; // ISO date: "2026-03-15"
  title: string;
  groupName: string;
  groupId: string;
}

export const getCalendarEvents = (from: string, to: string) =>
  api
    .get<CalendarEvent[]>('/calendar', { params: { from, to } })
    .then((r) => r.data);
