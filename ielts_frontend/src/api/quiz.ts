import api from './axios';

export interface QuizTestResponse {
  testId: string;
  title: string;
  level: string; // BEGINNER | ELEMENTARY | PRE_IELTS | IELTS_READY | ADVANCED
  createdByRole: string;
  teacherId?: string;
  teacherName?: string;
  approved: boolean;
  createdAt: string;
  questionCount: number;
}

export interface QuizQuestionDto {
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
  correctOption?: string; // only in admin view
}

export interface QuizSessionResponse {
  sessionId: string;
  testId: string;
  testTitle: string;
  testLevel: string;
  groupId: string;
  status: string; // ACTIVE | COMPLETED
  startedAt: string;
  completedAt?: string;
  questions?: QuizQuestionDto[];
  alreadySubmitted: boolean;
}

export interface QuizResultResponse {
  resultId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  submittedAt: string;
}

export interface QuizTestRequest {
  title: string;
  level: string;
  questions: Array<{
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: string; // A|B|C|D
  }>;
}

export const listTests = () =>
  api.get<QuizTestResponse[]>('/quiz/tests').then((r) => r.data);

export const createTest = (req: QuizTestRequest) =>
  api.post<QuizTestResponse>('/quiz/tests', req).then((r) => r.data);

export const approveTest = (testId: string) =>
  api.put<QuizTestResponse>(`/quiz/tests/${testId}/approve`).then((r) => r.data);

export const getTestQuestions = (testId: string) =>
  api.get<QuizQuestionDto[]>(`/quiz/tests/${testId}/questions`).then((r) => r.data);

export const startSession = (req: {
  testId: string;
  groupId: string;
  allowedStudentIds: string[];
}) => api.post<QuizSessionResponse>('/quiz/sessions', req).then((r) => r.data);

export const getActiveSession = () =>
  api.get<QuizSessionResponse | null>('/quiz/sessions/active').then((r) => r.data);

export const getSessionForTaking = (sessionId: string) =>
  api.get<QuizSessionResponse>(`/quiz/sessions/${sessionId}/take`).then((r) => r.data);

export const submitAnswers = (
  sessionId: string,
  answers: Array<{ questionId: string; selectedOption: string }>
) =>
  api
    .post<QuizResultResponse>(`/quiz/sessions/${sessionId}/submit`, { answers })
    .then((r) => r.data);

export const getSessionResults = (sessionId: string) =>
  api.get<QuizResultResponse[]>(`/quiz/sessions/${sessionId}/results`).then((r) => r.data);

export const getGroupSessions = (groupId: string) =>
  api
    .get<QuizSessionResponse[]>(`/quiz/sessions/by-group/${groupId}`)
    .then((r) => r.data);

export const getStudentQuizResults = (studentId: string) =>
  api.get<(QuizResultResponse & { testTitle?: string; testLevel?: string })[]>(`/quiz/results/by-student/${studentId}`).then((r) => r.data);
