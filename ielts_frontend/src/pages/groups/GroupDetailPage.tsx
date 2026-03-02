import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, UserPlus, Pencil, BarChart2 } from 'lucide-react';
import {
  getGroup, getGroupEnrollments, createEnrollment, deleteEnrollment,
  getGroupAttendanceSummary, getGroupAvgExamScore,
} from '../../api/groups';
import { getLessonsByGroup, createLesson, updateLesson, deleteLesson } from '../../api/lessons';
import { getStudents } from '../../api/students';
import { getExamsByGroup, createExam, updateExam, deleteExam } from '../../api/exams';
import type { LessonCreateRequest, ExamCreateRequest, EnrollmentCreateRequest } from '../../types';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import { showSuccess, showError } from '../../utils/toast';

type Tab = 'students' | 'lessons' | 'exams' | 'analytics';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const groupId = id ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('students');

  // Students
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Lessons
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editLesson, setEditLesson] = useState<{ id: string; date: string; topic: string } | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonCreateRequest>({ groupId: 0, lessonDate: '', topic: '' });

  // Exams
  const [showAddExam, setShowAddExam] = useState(false);
  const [editExam, setEditExam] = useState<{ id: string; title: string; examDate: string } | null>(null);
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

  const { data: attendanceSummary } = useQuery({
    queryKey: ['groupAttendance', groupId],
    queryFn: () => getGroupAttendanceSummary(groupId),
    enabled: activeTab === 'analytics',
  });
  const { data: avgExamScore } = useQuery({
    queryKey: ['groupAvgScore', groupId],
    queryFn: () => getGroupAvgExamScore(groupId),
    enabled: activeTab === 'analytics',
  });

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  // Mutations
  const addEnrollmentMutation = useMutation({
    mutationFn: (data: EnrollmentCreateRequest) => createEnrollment(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollments', groupId] }); setShowAddStudent(false); showSuccess("Talaba qo'shildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollments', groupId] }); showSuccess("Talaba o'chirildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const addLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', groupId] }); setShowAddLesson(false); showSuccess("Dars qo'shildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonCreateRequest> }) => updateLesson(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', groupId] }); setEditLesson(null); showSuccess("Dars yangilandi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', groupId] }); showSuccess("Dars o'chirildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const addExamMutation = useMutation({
    mutationFn: createExam,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams', groupId] }); setShowAddExam(false); showSuccess("Imtihon qo'shildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const updateExamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamCreateRequest> }) => updateExam(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams', groupId] }); setEditExam(null); showSuccess("Imtihon yangilandi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const deleteExamMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams', groupId] }); showSuccess("Imtihon o'chirildi!"); },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'students', label: `Talabalar (${enrollments.length})` },
    { key: 'lessons', label: `Darslar (${lessons.length})` },
    { key: 'exams', label: `Imtihonlar (${exams.length})` },
    { key: 'analytics', label: 'Analitika' },
  ];

  return (
    <div>
      <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm transition">
        <ArrowLeft size={16} />
        Guruhlarga qaytish
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{group?.name ?? 'Guruh Tafsilotlari'}</h1>
        {group && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            {group.startDate && <span>Boshlanish: {group.startDate}</span>}
            {group.endDate && <span>Tugash: {group.endDate}</span>}
            {group.schedule && <span>Jadval: {group.schedule}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.key === 'analytics' && <BarChart2 size={14} className="inline mr-1" />}
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
                  Talaba qo'shish
                </button>
              </div>
              <Table
                columns={[
                  { key: 'studentName', header: 'Ism' },
                  { key: 'status', header: 'Holat', render: (e) => (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {e.status === 'active' ? 'Faol' : e.status}
                    </span>
                  )},
                  {
                    key: 'actions', header: '',
                    render: (e) => (
                      <button
                        onClick={() => { if (window.confirm("Bu talabani guruhdan chiqarasizmi?")) removeEnrollmentMutation.mutate(e.id); }}
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
                emptyMessage="Hali talabalar yo'q"
              />
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setLessonForm({ groupId: groupId as any, lessonDate: '', topic: '' }); setShowAddLesson(true); }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  <Plus size={15} />
                  Dars qo'shish
                </button>
              </div>
              <Table
                columns={[
                  { key: 'lessonDate', header: 'Sana' },
                  { key: 'topic', header: 'Mavzu', render: (l) => l.topic || <span className="text-gray-400">—</span> },
                  {
                    key: 'actions', header: '',
                    render: (l) => (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/attendance?lessonId=${l.id}`)}
                          className="text-xs text-indigo-600 hover:underline px-2 py-1"
                        >
                          Davomat
                        </button>
                        <button
                          onClick={() => setEditLesson({ id: String(l.id), date: l.lessonDate, topic: l.topic ?? '' })}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm("Bu darsni o'chirasizmi? Davomatlar ham o'chadi.")) deleteLessonMutation.mutate(l.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={lessons}
                keyField="id"
                loading={loadingLessons}
                emptyMessage="Hali darslar yo'q"
              />
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setExamForm({ groupId: groupId as any, examDate: '', title: '', maxScore: 9 }); setShowAddExam(true); }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  <Plus size={15} />
                  Imtihon qo'shish
                </button>
              </div>
              <Table
                columns={[
                  { key: 'title', header: 'Sarlavha', render: (e) => e.title || <span className="text-gray-400">—</span> },
                  { key: 'examDate', header: 'Sana' },
                  {
                    key: 'actions', header: '',
                    render: (e) => (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/exams/${e.id}`)}
                          className="text-xs text-indigo-600 hover:underline px-2 py-1"
                        >
                          Natijalar
                        </button>
                        <button
                          onClick={() => setEditExam({ id: String(e.id), title: e.title ?? '', examDate: e.examDate ?? '' })}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm("Bu imtihonni o'chirasizmi? Barcha natijalar ham o'chadi.")) deleteExamMutation.mutate(e.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={exams}
                keyField="id"
                loading={loadingExams}
                emptyMessage="Hali imtihonlar yo'q"
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Attendance */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Davomat</p>
                  {attendanceSummary ? (
                    <>
                      <p className="text-3xl font-bold text-indigo-600">
                        {Math.round(attendanceSummary.attendancePercent ?? attendanceSummary.percent ?? 0)}%
                      </p>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.round(attendanceSummary.attendancePercent ?? attendanceSummary.percent ?? 0))}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="h-8 bg-gray-200 rounded animate-pulse mt-1" />
                  )}
                </div>

                {/* Avg Exam Score */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">O'rtacha Ball</p>
                  {avgExamScore ? (
                    <p className="text-3xl font-bold text-purple-600">
                      {Number(avgExamScore.avgScore ?? avgExamScore.averageScore ?? avgExamScore.score ?? 0).toFixed(1)}
                    </p>
                  ) : (
                    <div className="h-8 bg-gray-200 rounded animate-pulse mt-1" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg font-bold text-blue-600">
                    {lessons.length}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Jami Darslar</p>
                    <p className="text-xs text-gray-400">Shu guruhda</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg font-bold text-purple-600">
                    {exams.length}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Jami Imtihonlar</p>
                    <p className="text-xs text-gray-400">Shu guruhda</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} title="Talaba qo'shish">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talabani tanlang</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Talabani tanlang...</option>
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
              {addEnrollmentMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} title="Dars qo'shish">
        <form onSubmit={(e) => { e.preventDefault(); addLessonMutation.mutate({ ...lessonForm, groupId: groupId as any }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sana *</label>
            <input required type="date" value={lessonForm.lessonDate}
              onChange={(e) => setLessonForm({ ...lessonForm, lessonDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mavzu</label>
            <input value={lessonForm.topic} onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="masalan: Reading strategiyalari" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addLessonMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
              {addLessonMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal isOpen={!!editLesson} onClose={() => setEditLesson(null)} title="Darsni tahrirlash">
        {editLesson && (
          <form onSubmit={(e) => { e.preventDefault(); updateLessonMutation.mutate({ id: editLesson.id, data: { lessonDate: editLesson.date, topic: editLesson.topic } }); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
              <input type="date" value={editLesson.date}
                onChange={(e) => setEditLesson({ ...editLesson, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mavzu</label>
              <input value={editLesson.topic}
                onChange={(e) => setEditLesson({ ...editLesson, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditLesson(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Bekor</button>
              <button type="submit" disabled={updateLessonMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
                {updateLessonMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Exam Modal */}
      <Modal isOpen={showAddExam} onClose={() => setShowAddExam(false)} title="Imtihon qo'shish">
        <form onSubmit={(e) => { e.preventDefault(); addExamMutation.mutate({ ...examForm, groupId: groupId as any }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha</label>
            <input value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="masalan: Mock Test 1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sana *</label>
            <input required type="date" value={examForm.examDate}
              onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addExamMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
              {addExamMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Exam Modal */}
      <Modal isOpen={!!editExam} onClose={() => setEditExam(null)} title="Imtihonni tahrirlash">
        {editExam && (
          <form onSubmit={(e) => { e.preventDefault(); updateExamMutation.mutate({ id: editExam.id, data: { title: editExam.title, examDate: editExam.examDate } }); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha</label>
              <input value={editExam.title}
                onChange={(e) => setEditExam({ ...editExam, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
              <input type="date" value={editExam.examDate}
                onChange={(e) => setEditExam({ ...editExam, examDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditExam(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Bekor</button>
              <button type="submit" disabled={updateExamMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
                {updateExamMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
