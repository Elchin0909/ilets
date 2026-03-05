import api from './axios';

export interface ChatMessage {
  messageId: string;
  groupId: string;
  senderUsername: string;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

export const getChatMessages = (groupId: string, limit = 100) =>
  api.get<ChatMessage[]>(`/chat/group/${groupId}`, { params: { limit } }).then(r => r.data);

export const sendChatMessage = (groupId: string, content: string) =>
  api.post<ChatMessage>(`/chat/group/${groupId}`, { content }).then(r => r.data);
