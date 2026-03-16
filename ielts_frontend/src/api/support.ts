import api from './axios';

export interface Faq {
  faqId: string;
  question: string;
  answer: string;
  sortOrder?: number;
  createdAt: string;
}

export interface SupportTicket {
  ticketId: string;
  studentId: string;
  studentName: string;
  subject: string;
  status: string; // OPEN | ANSWERED | CLOSED
  createdAt: string;
  updatedAt?: string;
}

export interface SupportMessage {
  messageId: string;
  ticketId: string;
  senderRole: string; // STUDENT | STAFF
  senderName: string;
  content: string;
  createdAt: string;
}

// FAQ
export const getFaqs = () =>
  api.get<Faq[]>('/faq').then((r) => r.data);

export const createFaq = (data: { question: string; answer: string; sortOrder?: number }) =>
  api.post<Faq>('/faq', data).then((r) => r.data);

export const updateFaq = (id: string, data: { question: string; answer: string; sortOrder?: number }) =>
  api.put<Faq>(`/faq/${id}`, data).then((r) => r.data);

export const deleteFaq = (id: string) =>
  api.delete(`/faq/${id}`);

// Support Tickets
export const getMyTickets = (studentId: string) =>
  api.get<SupportTicket[]>(`/support/my/${studentId}`).then((r) => r.data);

export const createTicket = (data: { studentId: string; studentName: string; subject: string; message: string }) =>
  api.post<SupportTicket>('/support/tickets', data).then((r) => r.data);

export const getAllTickets = (status?: string) =>
  api.get<SupportTicket[]>('/support/tickets', { params: status ? { status } : {} }).then((r) => r.data);

export const getTicketMessages = (ticketId: string) =>
  api.get<SupportMessage[]>(`/support/tickets/${ticketId}/messages`).then((r) => r.data);

export const sendTicketMessage = (ticketId: string, data: { senderRole: string; senderName: string; content: string }) =>
  api.post<SupportMessage>(`/support/tickets/${ticketId}/messages`, data).then((r) => r.data);

export const closeTicket = (ticketId: string) =>
  api.patch(`/support/tickets/${ticketId}/close`);
