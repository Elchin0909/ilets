import api from './axios';

export interface ChatMessage {
  messageId: string;
  groupId: string;
  senderUsername: string;
  senderName: string;
  senderRole: string;
  messageType: 'TEXT' | 'FILE' | 'VOICE';
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  sentAt: string;
}

export const getChatMessages = (groupId: string, limit = 100) =>
  api.get<ChatMessage[]>(`/chat/group/${groupId}`, { params: { limit } }).then(r => r.data);

export const sendChatMessage = (groupId: string, content: string) =>
  api.post<ChatMessage>(`/chat/group/${groupId}`, { content }).then(r => r.data);

export const sendChatFile = (
  groupId: string,
  file: File,
  messageType: 'FILE' | 'VOICE' = 'FILE',
) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('messageType', messageType);
  return api.post<ChatMessage>(`/chat/group/${groupId}/file`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
