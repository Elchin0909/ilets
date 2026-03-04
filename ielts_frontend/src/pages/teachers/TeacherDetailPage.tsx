import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, Layers, Users, KeyRound, Camera, Loader2 } from 'lucide-react';
import { getTeacher } from '../../api/teachers';
import { updateTeacherAvatar } from '../../api/teachers';
import { getGroups, getGroupEnrollments } from '../../api/groups';
import { resetTeacherPassword, changeMyPassword } from '../../api/auth';
import { uploadAvatar } from '../../api/upload';
import { useAuth } from '../../contexts/AuthContext';
import type { Group } from '../../types';
import Modal from '../../components/ui/Modal';
import { useState, useRef } from 'react';
import { showSuccess, showError } from '../../utils/toast';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8080';

function GroupStudentsPanel({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments', groupId],
    queryFn: () => getGroupEnrollments(groupId),
  });

  return (
    <div className="mt-3 bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-600 mb-3">
        {groupName} — {enrollments.length} talaba
      </p>
      {isLoading ? (
        <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-gray-400 text-sm">Talabalar yo'q</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {enrollments.map(e => (
            <span key={e.id} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
              {e.studentName || `#${e.studentId}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const teacherId = id ?? '';

  const isSelf = user?.teacherId === teacherId;
  const isAdmin = user?.role === 'ADMIN';
  const canResetPassword = isAdmin || isSelf;

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => getTeacher(teacherId),
  });

  const { data: allGroups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const teacherGroups = allGroups.filter(g => g.teacherId === teacherId);

  const avatarMutation = useMutation({
    mutationFn: ({ url }: { url: string }) => updateTeacherAvatar(teacherId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] });
      toast.success("Rasm yangilandi!");
    },
    onError: () => toast.error("Rasmni saqlashda xatolik"),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await avatarMutation.mutateAsync({ url });
    } catch {
      toast.error("Rasmni yuklashda xatolik");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      isAdmin ? resetTeacherPassword(teacherId, password) : changeMyPassword(password),
    onSuccess: () => {
      setShowResetPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      showSuccess("Parol muvaffaqiyatli o'zgartirildi!");
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) { showError("Parol kamida 4 ta belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { showError('Parollar mos kelmadi'); return; }
    resetPasswordMutation.mutate(newPassword);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
        Loading...
      </div>
    );
  }

  const avatarSrc = teacher?.avatarUrl
    ? (teacher.avatarUrl.startsWith('http') ? teacher.avatarUrl : `${BASE_URL}${teacher.avatarUrl}`)
    : null;

  const canEditAvatar = isAdmin || isSelf;

  return (
    <div>
      <button onClick={() => navigate('/teachers')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-5 text-sm transition">
        <ArrowLeft size={16} /> Back to Teachers
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={teacher?.fullName}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-purple-600">
              {teacher?.fullName?.charAt(0)}
            </div>
          )}
          {canEditAvatar && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-sm transition disabled:opacity-50"
                title="Rasmni o'zgartirish"
              >
                {uploading ? <Loader2 size={11} className="text-white animate-spin" /> : <Camera size={11} className="text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{teacher?.fullName}</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {teacher?.phone && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone size={14} /> {teacher.phone}
              </span>
            )}
            {teacher?.email && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={14} /> {teacher.email}
              </span>
            )}
            {teacher?.username && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                👤 {teacher.username}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{teacherGroups.length}</div>
            <div className="text-xs text-gray-500">guruh</div>
          </div>
          {canResetPassword && (
            <button
              onClick={() => setShowResetPassword(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
            >
              <KeyRound size={13} /> Parolni o'zgartir
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers size={16} className="text-purple-500" /> Guruhlar
          </h2>
        </div>
        <div className="p-5">
          {loadingGroups ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
              Yuklanmoqda...
            </div>
          ) : teacherGroups.length === 0 ? (
            <div className="py-10 text-center text-gray-400">Bu o'qituvchiga biriktirilgan guruh yo'q</div>
          ) : (
            <div className="space-y-3">
              {teacherGroups.map((g: Group) => (
                <div key={g.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedGroupId(expandedGroupId === g.id ? null : g.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Layers size={15} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{g.name}</p>
                        <p className="text-xs text-gray-400">
                          {g.startDate && `${g.startDate}`}{g.endDate && ` → ${g.endDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/groups/${g.id}`); }}
                        className="text-xs text-indigo-600 hover:underline px-2 py-1"
                      >
                        Batafsil
                      </button>
                      <Users size={14} className="text-gray-400" />
                      <span className={`text-gray-400 transition-transform ${expandedGroupId === g.id ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {expandedGroupId === g.id && (
                    <div className="px-4 pb-4">
                      <GroupStudentsPanel groupId={g.id} groupName={g.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetPassword} onClose={() => { setShowResetPassword(false); setNewPassword(''); setConfirmPassword(''); }} title="Parolni o'zgartirish">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-gray-500">
            {isSelf && !isAdmin
              ? "O'z parolingizni yangilang"
              : <><span className="font-medium text-gray-700">{teacher?.fullName}</span> uchun yangi parol o'rnatilmoqda</>
            }
            {teacher?.username && <span className="text-gray-400"> (@{teacher.username})</span>}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol *</label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Kamida 4 ta belgi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlang *</label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Parolni qayta kiriting"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowResetPassword(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-5 rounded-lg transition text-sm"
            >
              {resetPasswordMutation.isPending ? 'Saqlanmoqda...' : "Parolni o'zgartir"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
