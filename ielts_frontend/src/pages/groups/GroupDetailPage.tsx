import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { getGroup, getGroupEnrollments, createEnrollment, deleteEnrollment } from '../../api/groups';
import { getLessonsByGroup, createLesson } from '../../api/lessons';
import { getStudents } from '../../api/students';
import { getExamsByGroup, createExam } from '../../api/exams';
import type { LessonCreateRequest, ExamCreateRequest, EnrollmentCreateRequest } from '../../types';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';

type Tab = 'students' | 'lessons' | 'exams';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const groupId = id ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [lessonForm, setLessonForm] = useState<LessonCreateRequest>({ groupId: 0, lessonDate: '', topic: '' });
  const [examForm, setExamForm] = useState<ExamCreateRequest>({ groupId: 0, examDate: '', title: '', maxScore: 9 });

  const { data: group } = useQuery({ queryKey: ['group', groupId], queryFn: () => getGroup(groupId) });
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', groupId],
    queryFn: () => getGroupEnrollments(groupId),
  });
  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', groupId],
    queryFn: () => getLessonsByGroup(groupId),
  });
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['exams', groupId],
    queryFn: () => getExamsByGroup(groupId),
  });
  const { data: allStudents = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  const addEnrollmentMutation = useMutation({
    mutationFn: (data: EnrollmentCreateRequest) => createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', groupId] });
      setShowAddStudent(false);
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments', groupId] }),
  });

  const addLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', groupId] });
      setShowAddLesson(false);
    },
  });

  const addExamMutation = useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', groupId] });
      setShowAddExam(false);
    },
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'students', label: `Students (${enrollments.length})` },
    { key: 'lessons', label: `Lessons (${lessons.length})` },
    { key: 'exams', label: `Exams (${exams.length})` },
  ];

  return (
    <div>
      <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm transition">
        <ArrowLeft size={16} />
        Back to Groups
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{group?.name ?? 'Group Details'}</h1>
        {group && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span>Teacher ID: {group.teacherId}</span>
            <span>Course ID: {group.courseId}</span>
            {group.startDate && <span>Start: {group.startDate}</span>}
            {group.endDate && <span>End: {group.endDate}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  <UserPlus size={15} />
                  Enroll Student
                </button>
              </div>
              <Table
                columns={[
                  { key: 'studentId', header: '#' },
                  { key: 'studentName', header: 'Name' },
                  { key: 'status', header: 'Status' },
                  {
                    key: 'actions', header: 'Actions',
                    render: (e) => (
                      <button
                        onClick={() => { if (confirm('Remove this student?')) removeEnrollmentMutation.mutate(e.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    ),
                  },
                ]}
                data={enrollments}
                keyField="id"
                loading={loadingEnrollments}
                emptyMessage="No students enrolled"
              />
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  <Plus size={15} />
                  Add Lesson
                </button>
              </div>
              <Table
                columns={[
                  { key: 'id', header: '#' },
                  { key: 'lessonDate', header: 'Date' },
                  { key: 'topic', header: 'Topic', render: (l) => l.topic || <span className="text-gray-400">—</span> },
                  {
                    key: 'actions', header: 'Actions',
                    render: (l) => (
                      <button
                        onClick={() => navigate(`/attendance?lessonId=${l.id}`)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Mark Attendance
                      </button>
                    ),
                  },
                ]}
                data={lessons}
                keyField="id"
                loading={loadingLessons}
                emptyMessage="No lessons yet"
              />
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAddExam(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  <Plus size={15} />
                  Add Exam
                </button>
              </div>
              <Table
                columns={[
                  { key: 'id', header: '#' },
                  { key: 'title', header: 'Title', render: (e) => e.title || <span className="text-gray-400">—</span> },
                  { key: 'examDate', header: 'Date' },
                  { key: 'maxScore', header: 'Max Score', render: (e) => e.maxScore ?? <span className="text-gray-400">—</span> },
                  {
                    key: 'actions', header: 'Actions',
                    render: (e) => (
                      <button
                        onClick={() => navigate(`/exams/${e.id}`)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Results
                      </button>
                    ),
                  },
                ]}
                data={exams}
                keyField="id"
                loading={loadingExams}
                emptyMessage="No exams yet"
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} title="Enroll Student">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose student...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} — {s.phone}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              disabled={!selectedStudentId || addEnrollmentMutation.isPending}
              onClick={() => addEnrollmentMutation.mutate({ studentId: selectedStudentId, groupId })}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition"
            >
              {addEnrollmentMutation.isPending ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} title="Add Lesson">
        <form onSubmit={(e) => { e.preventDefault(); addLessonMutation.mutate(lessonForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Date *</label>
            <input
              required
              type="date"
              value={lessonForm.lessonDate}
              onChange={(e) => setLessonForm({ ...lessonForm, lessonDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              value={lessonForm.topic}
              onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Reading strategies"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addLessonMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
              {addLessonMutation.isPending ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Exam Modal */}
      <Modal isOpen={showAddExam} onClose={() => setShowAddExam(false)} title="Add Exam">
        <form onSubmit={(e) => { e.preventDefault(); addExamMutation.mutate(examForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Mock Test 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
            <input
              required
              type="date"
              value={examForm.examDate}
              onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
            <input
              type="number"
              value={examForm.maxScore}
              onChange={(e) => setExamForm({ ...examForm, maxScore: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={0}
              max={9}
              step={0.5}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addExamMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
              {addExamMutation.isPending ? 'Adding...' : 'Add Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
