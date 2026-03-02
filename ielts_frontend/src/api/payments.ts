import api from './axios';

export interface Payment {
  paymentId: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  type: string;       // MONTHLY | REGISTRATION | OTHER
  month?: string;     // "2026-03"
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentCreateRequest {
  studentId: string;
  amount: number;
  currency?: string;
  type?: string;
  month?: string;
  notes?: string;
  paidAt?: string;
}

export const getPayments = () =>
  api.get<Payment[]>('/payments').then((r) => r.data);

export const getStudentPayments = (studentId: string) =>
  api.get<Payment[]>(`/payments/student/${studentId}`).then((r) => r.data);

export const getStudentTotal = (studentId: string) =>
  api.get<number>(`/payments/student/${studentId}/total`).then((r) => r.data);

export const getMonthTotal = (month: string) =>
  api.get<number>(`/payments/month/${month}/total`).then((r) => r.data);

export const createPayment = (data: PaymentCreateRequest) =>
  api.post<Payment>('/payments', data).then((r) => r.data);

export const deletePayment = (paymentId: string) =>
  api.delete(`/payments/${paymentId}`);
