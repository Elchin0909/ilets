import api from './axios';

export interface RevenuePoint {
  month: string;
  label: string;
  amount: number;
}

export interface StudentTrendPoint {
  month: string;
  label: string;
  count: number;
}

export interface EnrollmentStats {
  ACTIVE: number;
  COMPLETED: number;
  DROPPED: number;
  total: number;
}

export const getMonthlyRevenue = (months = 6) =>
  api.get<RevenuePoint[]>('/analytics/revenue', { params: { months } }).then((r) => r.data);

export const getStudentsTrend = (months = 6) =>
  api.get<StudentTrendPoint[]>('/analytics/students-trend', { params: { months } }).then((r) => r.data);

export const getEnrollmentStats = () =>
  api.get<EnrollmentStats>('/analytics/enrollment-stats').then((r) => r.data);
