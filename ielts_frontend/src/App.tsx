import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
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
      <AuthProvider>
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
                <Route path="/lessons" element={<LessonsPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/exams/:id" element={<ExamDetailPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/student-profile" element={<StudentProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
