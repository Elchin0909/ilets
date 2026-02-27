import api from './axios';
import type { GroupAttendanceSummary, AttendanceTrendPoint, AvgExamScore } from '../types';

export const getGroupAttendanceSummary = (groupId: number, from?: string, to?: string) =>
  api.get<GroupAttendanceSummary>(`/v1/teacher/dashboard/groups/${groupId}/attendance`, {
    params: { from, to },
  }).then((r) => r.data);

export const getAttendanceTrend = (groupId: number, from?: string, to?: string) =>
  api.get<AttendanceTrendPoint[]>(`/v1/teacher/dashboard/groups/${groupId}/attendance-trend`, {
    params: { from, to },
  }).then((r) => r.data);

export const getAvgExamScore = (groupId: number, from?: string, to?: string) =>
  api.get<AvgExamScore>(`/v1/teacher/dashboard/groups/${groupId}/avg-exam-score`, {
    params: { from, to },
  }).then((r) => r.data);
