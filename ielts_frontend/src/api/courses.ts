import api from './axios';
import type { Course, CourseCreateRequest } from '../types';

// Backend sends { courseId: UUID, title, level, durationWeeks }
const mapCourse = (c: any): Course => ({
  id: String(c.courseId ?? c.id),
  name: c.title ?? c.name ?? '',
  description: c.level,
  level: c.level,
  durationWeeks: c.durationWeeks,
});

// Backend expects { title, level }
const toBackend = (data: CourseCreateRequest) => ({
  title: data.name,
  level: data.description,
});

export const getCourses = () =>
  api.get<any[]>('/courses').then((r) => r.data.map(mapCourse));

export const getCourse = (id: string) =>
  api.get<any>(`/courses/${id}`).then((r) => mapCourse(r.data));

export const createCourse = (data: CourseCreateRequest) =>
  api.post<any>('/courses', toBackend(data)).then((r) => mapCourse(r.data));

export const updateCourse = (id: string, data: CourseCreateRequest) =>
  api.put<any>(`/courses/${id}`, toBackend(data)).then((r) => mapCourse(r.data));

export const deleteCourse = (id: string) =>
  api.delete(`/courses/${id}`);
