import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import TeachersPage from './pages/teachers/TeachersPage';
import TeacherDetailPage from './pages/teachers/TeacherDetailPage';
import CoursesPage from './pages/courses/CoursesPage';
import GroupsPage from './pages/groups/GroupsPage';
import GroupDetailPage from './pages/groups/GroupDetailPage';
import LessonsPage from './pages/lessons/LessonsPage';
import ExamsPage from './pages/exams/ExamsPage';
import ExamDetailPage from './pages/exams/ExamDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import UsersPage from './pages/users/UsersPage';
import WritingAssessmentPage from './pages/ai/WritingAssessmentPage';
import TestBankPage from './pages/quiz/TestBankPage';
import CreateTestPage from './pages/quiz/CreateTestPage';
import TakeQuizPage from './pages/quiz/TakeQuizPage';
import QuizResultsPage from './pages/quiz/QuizResultsPage';
import GroupChatPage from './pages/chat/GroupChatPage';
import ChatsPage from './pages/chat/ChatsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import DictionaryPage from './pages/student/DictionaryPage';
import WritingPage from './pages/student/WritingPage';
import VocabularyPage from './pages/student/VocabularyPage';
import MyGroupPage from './pages/student/MyGroupPage';
import SchedulePage from './pages/student/SchedulePage';
import AttendanceHistoryPage from './pages/student/AttendanceHistoryPage';
import PaymentHistoryPage from './pages/student/PaymentHistoryPage';
import LibraryPage from './pages/student/LibraryPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import SupportPage from './pages/student/SupportPage';
import SupportAdminPage from './pages/support/SupportAdminPage';
import VideoLessonsPage from './pages/student/VideoLessonsPage';
import ResourcesPage from './pages/resources/ResourcesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/teachers/:id" element={<TeacherDetailPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/lessons" element={<LessonsPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/exams/:id" element={<ExamDetailPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/ai/writing" element={<WritingAssessmentPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/student-profile" element={<StudentProfilePage />} />
                <Route path="/quiz/tests" element={<TestBankPage />} />
                <Route path="/quiz/tests/create" element={<CreateTestPage />} />
                <Route path="/quiz/take/:sessionId" element={<TakeQuizPage />} />
                <Route path="/quiz/results/:sessionId" element={<QuizResultsPage />} />
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="/my-group" element={<MyGroupPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/writing" element={<WritingPage />} />
                <Route path="/vocabulary" element={<VocabularyPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/my-attendance" element={<AttendanceHistoryPage />} />
                <Route path="/my-payments" element={<PaymentHistoryPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/videos" element={<VideoLessonsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/resources-manage" element={<ResourcesPage />} />
                <Route path="/support-admin" element={<SupportAdminPage />} />
                <Route path="/chat/group/:groupId" element={<GroupChatPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
