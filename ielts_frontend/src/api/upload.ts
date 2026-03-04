import api from './axios';

export const uploadAvatar = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('file', file);
  const resp = await api.post<{ url: string }>('/upload/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data.url;
};
