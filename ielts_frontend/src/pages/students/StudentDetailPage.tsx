import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, Users, ClipboardList, FileText, BrainCircuit, Loader2 } from 'lucide-react';
import { getStudent } from '../../api/students';
import { getEnrollments } from '../../api/groups';
import { getStudentExamResults } from '../../api/exams';
import { getAttendanceByStudent } from '../../api/attendance';
import { predictBand, type BandPredictionResponse } from '../../api/ai';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';
import type { Enrollment, ExamResult, AttendanceRecord } from '../../types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function BandPredictionCard({ studentId }: { studentId: string }) {
  const [prediction, setPrediction] = useState<BandPredictionResponse | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => predictBand(studentId),
    onSuccess: (data) => { setPrediction(data); toast.success("AI bashorati tayyor!"); },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'AI bashorat xatoligi';
      toast.error(msg);
    },
  });

  const confidenceColor =
    prediction?.confidence === 'yuqori' ? 'text-green-600 bg-green-50' :
    prediction?.confidence === "o'rta" ? 'text-yellow-600 bg-yellow-50' :
    'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-indigo-200 mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <BrainCircuit size={16} className="text-indigo-500" /> AI Band Bashorati
        </h2>
        {!prediction && (
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Tahlil qilinmoqda...</> : <><BrainCircuit size={14} /> Bashorat qilish</>}
          </button>
        )}
      </div>
      {prediction ? (
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-indigo-600">{prediction.predictedBand}</div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Ishonch darajasi</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${confidenceColor}`}>
                {prediction.confidence}
              </span>
              <p className="text-xs text-gray-400 mt-1.5">Eng zaif: <span className="font-medium text-orange-500">{prediction.weakestSkill}</span></p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{prediction.analysis}</p>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs font-medium text-indigo-700 mb-1">Tavsiyalar:</p>
            <p className="text-sm text-indigo-600 leading-relaxed whitespace-pre-line">{prediction.recommendations}</p>
          </div>
          <button
            onClick={() => setPrediction(null)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Qayta bashorat qilish
          </button>
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">
          {isPending
            ? <div className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin text-indigo-400" /> AI tahlil qilmoqda...</div>
            : "Talabaning imtihon natijalari asosida AI band bahosini olish uchun tugmani bosing"}
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = id ?? '';

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
  });

  const { data: allEnrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: getEnrollments,
  });

  const { data: examResults = [], isLoading: loadingExams } = useQuery({
    queryKey: ['studentExams', studentId],
    queryFn: () => getStudentExamResults(studentId),
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['studentAttendance', studentId],
    queryFn: () => getAttendanceByStudent(studentId),
  });

  const studentEnrollments = allEnrollments.filter(e => String(e.studentId) === String(studentId));

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const attendancePercent = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 0;

  const avgScore = examResults.length > 0 && examResults.some(r => r.score != null)
    ? (examResults.filter(r => r.score != null).reduce((sum, r) => sum + (r.score ?? 0), 0) / examResults.filter(r => r.score != null).length).toFixed(1)
    : '—';

  if (loadingStudent) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading...
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-5 text-sm transition">
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600">
          {student?.fullName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{student?.fullName}</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {student?.phone && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone size={14} /> {student.phone}
              </span>
            )}
            {student?.email && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={14} /> {student.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Guruhlar soni" value={studentEnrollments.length} icon={Users} color="bg-blue-500" />
        <StatCard label="Davomat %" value={`${attendancePercent}%`} icon={FileText} color="bg-green-500" />
        <StatCard label="Imtihonlar" value={examResults.length} icon={ClipboardList} color="bg-purple-500" />
        <StatCard label="O'rtacha ball" value={avgScore} icon={ClipboardList} color="bg-orange-500" />
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Guruhlar
          </h2>
        </div>
        <div className="p-5">
          <Table
            columns={[
              { key: 'groupName', header: 'Guruh', render: (e: Enrollment) => e.groupName || `ID: ${e.groupId}` },
              {
                key: 'status', header: 'Status',
                render: (e: Enrollment) => (
                  <Badge
                    label={e.status}
                    variant={e.status === 'ACTIVE' ? 'green' : e.status === 'DROPPED' ? 'red' : 'gray'}
                  />
                ),
              },
              { key: 'enrolledAt', header: 'Yozilgan', render: (e: Enrollment) => e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '—' },
            ]}
            data={studentEnrollments}
            keyField="id"
            emptyMessage="Hech qaysi guruhga yozilmagan"
          />
        </div>
      </div>

      {/* Attendance summary */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={16} className="text-green-500" /> Davomat
          </h2>
        </div>
        <div className="p-5">
          {loadingAttendance ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" /> Yuklanmoqda...
            </div>
          ) : attendance.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Davomat ma'lumoti yo'q</p>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Umumiy davomat</span>
                  <span className="font-medium">{attendancePercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${(presentCount / attendance.length) * 100}%` }} />
                  <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(lateCount / attendance.length) * 100}%` }} />
                  <div className="bg-red-400 h-full transition-all" style={{ width: `${(absentCount / attendance.length) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Keldi: {presentCount}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Kech: {lateCount}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Kelmadi: {absentCount}</span>
                </div>
              </div>
              <Table
                columns={[
                  {
                    key: 'status', header: 'Holat',
                    render: (a: AttendanceRecord) => a.status ? (
                      <Badge label={a.status} variant={a.status === 'PRESENT' ? 'green' : a.status === 'LATE' ? 'yellow' : 'red'} />
                    ) : <span className="text-gray-400">—</span>,
                  },
                ]}
                data={attendance}
                keyField="studentId"
                emptyMessage="Davomat yo'q"
              />
            </>
          )}
        </div>
      </div>

      {/* AI Band Prediction */}
      <BandPredictionCard studentId={studentId} />

      {/* Exam results */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-purple-500" /> Imtihon natijalari
          </h2>
        </div>
        <div className="p-5">
          <Table
            columns={[
              { key: 'examId', header: 'Imtihon', render: (r: ExamResult) => `Imtihon #${r.examId}` },
              { key: 'score', header: 'Umumiy', render: (r: ExamResult) => r.score != null ? <span className="font-semibold text-indigo-600">{r.score}</span> : '—' },
              { key: 'listeningScore', header: 'Listening', render: (r: ExamResult) => r.listeningScore ?? '—' },
              { key: 'readingScore', header: 'Reading', render: (r: ExamResult) => r.readingScore ?? '—' },
              { key: 'writingScore', header: 'Writing', render: (r: ExamResult) => r.writingScore ?? '—' },
              { key: 'speakingScore', header: 'Speaking', render: (r: ExamResult) => r.speakingScore ?? '—' },
              { key: 'notes', header: 'Izoh', render: (r: ExamResult) => r.notes || <span className="text-gray-400">—</span> },
            ]}
            data={examResults}
            keyField="id"
            loading={loadingExams}
            emptyMessage="Imtihon natijalari yo'q"
          />
        </div>
      </div>
    </div>
  );
}
