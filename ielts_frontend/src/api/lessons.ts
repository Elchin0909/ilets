import api from './axios';
import type { Lesson, LessonCreateRequest } from '../types';

export const getLessonsByGroup = (groupId: string | number) =>
  api.get<Lesson[]>(`/lessons/by-group/${groupId}`).then((r) => r.data);

export const createLesson = (data: LessonCreateRequest) =>
  api.post<Lesson>('/lessons', data).then((r) => r.data);
