// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  teacherId?: string;
}

export interface MeResponse {
  username: string;
  role: string;
  teacherId?: string;
  studentId?: string;
}

// User (admin management)
export interface UserInfo {
  userId: string;
  username: string;
  role: string;
  enabled: boolean;
  teacherId?: string;
  createdAt?: string;
}

// Student
export interface Student {
  id: string;        // maps from studentId (UUID)
  fullName: string;
  phone: string;
  email?: string;
  createdAt?: string;
}

export interface StudentCreateRequest {
  fullName: string;
  phone: string;
  email?: string;
}

// Teacher
export interface Teacher {
  id: string;          // maps from teacherId (UUID)
  teacherId: string;   // UUID — same as id, used for reset password
  fullName: string;
  phone: string;
  email?: string;
  username?: string;
}

export interface TeacherCreateRequest {
  fullName: string;
  phone: string;
  email?: string;
  username: string;
  password: string;
}

// Course
export interface Course {
  id: string;   // maps from courseId (UUID)
  name: string; // maps from title
  description?: string;
  level?: string;
  durationWeeks?: number;
}

export interface CourseCreateRequest {
  name: string; // mapped to title on send
  description?: string;
}

// Group
export interface Group {
  id: string;         // maps from groupId (UUID)
  name: string;       // maps from groupName
  courseId: string;   // UUID
  teacherId: string;  // UUID
  courseName?: string;
  teacherName?: string;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  status?: string;
}

export interface GroupCreateRequest {
  name: string;       // mapped to groupName on send
  courseId: string;   // UUID
  teacherId: string;  // UUID
  startDate?: string;
  endDate?: string;
  schedule?: string;
}

// Lesson
export interface Lesson {
  id: number;
  groupId: number;
  lessonDate: string;
  topic?: string;
}

export interface LessonCreateRequest {
  groupId: string | number;
  lessonDate: string;
  topic?: string;
}

// Exam
export interface Exam {
  id: number;
  groupId: number;
  examDate: string;
  title?: string;
  maxScore?: number;
}

export interface ExamCreateRequest {
  groupId: string | number;
  examDate: string;
  title?: string;
  maxScore?: number;
}

// Exam Result
export interface ExamResult {
  id: number;
  examId: number;
  studentId: number;
  studentName?: string;
  score?: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  notes?: string;
}

export interface ExamResultUpsertRequest {
  studentId: number;
  score?: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  notes?: string;
}

// Enrollment
export interface Enrollment {
  id: string;          // maps from enrollmentId (UUID)
  studentId: string;   // UUID
  studentName?: string;
  groupId: string;     // UUID
  groupName?: string;
  status: string;
  enrolledAt?: string;
}

export interface EnrollmentCreateRequest {
  studentId: string;
  groupId: string;
}

// Attendance
export interface AttendanceRecord {
  studentId: number;
  studentName?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | null;
}

export interface AttendanceMarkRequest {
  studentId: number;
  lessonId: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface AttendanceBulkMarkRequest {
  records: AttendanceMarkRequest[];
}

// Dashboard
export interface GroupAttendanceSummary {
  groupId: number;
  groupName: string;
  presentPercent: number;
  absentPercent: number;
  latePercent: number;
  totalLessons: number;
}

export interface AttendanceTrendPoint {
  lessonDate: string;
  presentPercent: number;
}

export interface AvgExamScore {
  avgScore?: number;
  avgListening?: number;
  avgReading?: number;
  avgWriting?: number;
  avgSpeaking?: number;
}

// Pagination / generic
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
