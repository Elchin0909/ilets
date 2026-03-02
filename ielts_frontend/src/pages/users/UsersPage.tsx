import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { KeyRound, Shield, User, BookOpen, Eye, EyeOff } from 'lucide-react';
import { getUsers, resetUserPassword } from '../../api/admin';
import type { UserInfo } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { showSuccess, showError } from '../../utils/toast';

const roleVariant: Record<string, 'green' | 'blue' | 'yellow' | 'gray'> = {
  ADMIN: 'green',
  TEACHER: 'blue',
  RECEPTION: 'yellow',
};

const roleIcon: Record<string, React.ElementType> = {
  ADMIN: Shield,
  TEACHER: BookOpen,
  RECEPTION: User,
};

function PasswordInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        required
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={4}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }: { user: UserInfo; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (password: string) => resetUserPassword(user.userId, password),
    onSuccess: () => {
      onClose();
      showSuccess("Parol muvaffaqiyatli o'zgartirildi!");
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message ?? 'Xatolik yuz berdi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) { showError("Parol kamida 4 ta belgidan iborat bo'lishi kerak"); return; }
    if (newPassword !== confirmPassword) { showError('Parollar mos kelmadi'); return; }
    mutation.mutate(newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">@{user.username}</span> uchun yangi parol o'rnatilmoqda
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol *</label>
        <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Kamida 6 ta belgi" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tasdiqlang *</label>
        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Parolni qayta kiriting" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-5 rounded-lg transition text-sm"
        >
          {mutation.isPending ? 'Saqlanmoqda...' : "Parolni o'zgartir"}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getUsers,
  });

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle={`${users.length} ta foydalanuvchi`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
          Yuklanmoqda...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {users.map((u) => {
              const RoleIcon = roleIcon[u.role] ?? User;
              return (
                <div key={u.userId} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      u.role === 'ADMIN' ? 'bg-green-100' : u.role === 'TEACHER' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                      <RoleIcon size={18} className={
                        u.role === 'ADMIN' ? 'text-green-600' : u.role === 'TEACHER' ? 'text-blue-600' : 'text-yellow-600'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">@{u.username}</span>
                        <Badge label={u.role} variant={roleVariant[u.role] ?? 'gray'} />
                        {!u.enabled && <Badge label="NOFAOL" variant="red" />}
                      </div>
                      {u.createdAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ro'yxatdan o'tgan: {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                  >
                    <KeyRound size={13} />
                    Parolni o'zgartir
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Parolni o'zgartirish"
      >
        {selectedUser && (
          <ResetPasswordModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </Modal>
    </div>
  );
}
