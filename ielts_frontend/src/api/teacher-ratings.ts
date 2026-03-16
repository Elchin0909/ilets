import api from './axios';

export interface TeacherRating {
  ratingId: string;
  teacherId: string;
  studentId: string;
  studentName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface TeacherRatingResponse {
  teacherId: string;
  averageRating: number;
  totalRatings: number;
  ratings: TeacherRating[];
}

export const getTeacherRatings = (teacherId: string) =>
  api.get<TeacherRatingResponse>(`/teacher-ratings/teacher/${teacherId}`).then((r) => r.data);

export const rateTeacher = (teacherId: string, rating: number, comment?: string) =>
  api.post<TeacherRating>('/teacher-ratings', { teacherId, rating, comment }).then((r) => r.data);
