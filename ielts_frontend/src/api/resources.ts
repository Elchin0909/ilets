import api from './axios';

export interface Resource {
  resourceId: string;
  title: string;
  description?: string;
  category: string;
  type: string; // PDF | LINK | VIDEO
  fileUrl?: string;
  linkUrl?: string;
  createdAt: string;
}

export const getResources = (category?: string) =>
  api.get<Resource[]>('/resources', { params: category ? { category } : {} }).then((r) => r.data);

export const createResource = (data: Partial<Resource>) =>
  api.post<Resource>('/resources', data).then((r) => r.data);

export const updateResource = (id: string, data: Partial<Resource>) =>
  api.put<Resource>(`/resources/${id}`, data).then((r) => r.data);

export const deleteResource = (id: string) =>
  api.delete(`/resources/${id}`);

export const uploadResourceFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ url: string }>('/upload/resource', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
