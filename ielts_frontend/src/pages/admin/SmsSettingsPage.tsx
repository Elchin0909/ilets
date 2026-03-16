import { useState } from 'react';
import { MessageSquare, Send, Users, Settings, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../../api/students';
import { getGroups, getEnrollments } from '../../api/groups';
import toast from 'react-hot-toast';

export default function SmsSettingsPage() {
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });

  const [tab, setTab] = useState<'send' | 'settings'>('send');
  const [smsText, setSmsText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sendMode, setSendMode] = useState<'group' | 'individual'>('group');
  const [search, setSearch] = useState('');

  // Settings
  const [apiKey, setApiKey] = useState(localStorage.getItem('eskiz_api_key') || '');
  const [senderName, setSenderName] = useState(localStorage.getItem('eskiz_sender') || 'IELTS Centre');

  function saveSettings() {
    localStorage.setItem('eskiz_api_key', apiKey);
    localStorage.setItem('eskiz_sender', senderName);
    toast.success("Sozlamalar saqlandi");
  }

  function getRecipients(): { name: string; phone: string }[] {
    if (sendMode === 'group' && selectedGroup) {
      const groupEnr = enrollments.filter((e) => String(e.groupId) === selectedGroup);
      return groupEnr.map((e) => {
        const student = students.find((s: any) => String(s.id) === String(e.studentId));
        return { name: student?.fullName ?? '', phone: student?.phone ?? '' };
      }).filter((r) => r.phone);
    }
    return selectedStudents.map((sid) => {
      const student = students.find((s: any) => String(s.id) === sid);
      return { name: student?.fullName ?? '', phone: student?.phone ?? '' };
    }).filter((r) => r.phone);
  }

  async function sendSms() {
    if (!smsText.trim()) { toast.error("Xabar matnini kiriting"); return; }
    const recipients = getRecipients();
    if (recipients.length === 0) { toast.error("Qabul qiluvchilar yo'q"); return; }
    if (!apiKey) { toast.error("Eskiz API kalitini sozlamalar bo'limida kiriting"); return; }

    toast.success(`${recipients.length} ta SMS yuborilmoqda (demo rejim)...`);
    // In production, this would call a backend SMS service
    // For now, log the intent
    console.log('SMS recipients:', recipients);
    console.log('SMS text:', smsText);
    setSmsText('');
  }

  const filtered = students.filter((s: any) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <MessageSquare size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS Xabarnoma</h1>
          <p className="text-sm text-gray-500">Eskiz.uz orqali SMS yuborish</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        <button onClick={() => setTab('send')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${tab === 'send' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Send size={14} className="inline mr-1.5 -mt-0.5" /> SMS Yuborish
        </button>
        <button onClick={() => setTab('settings')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${tab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <Settings size={14} className="inline mr-1.5 -mt-0.5" /> Sozlamalar
        </button>
      </div>

      {tab === 'send' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Send mode */}
          <div className="flex gap-3 mb-5">
            <button onClick={() => setSendMode('group')}
              className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition ${
                sendMode === 'group' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
              }`}>
              <Users size={18} className="mx-auto mb-1" /> Guruhga
            </button>
            <button onClick={() => setSendMode('individual')}
              className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition ${
                sendMode === 'individual' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
              }`}>
              <Phone size={18} className="mx-auto mb-1" /> Individual
            </button>
          </div>

          {/* Recipients */}
          {sendMode === 'group' ? (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Guruh</label>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Tanlang...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({enrollments.filter(e => String(e.groupId) === String(g.id)).length} talaba)</option>)}
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 mb-2" />
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl">
                {filtered.slice(0, 20).map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)}
                      onChange={() => setSelectedStudents(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                      className="rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm text-gray-700">{s.fullName}</span>
                    <span className="text-xs text-gray-400 ml-auto">{s.phone}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Xabar matni</label>
            <textarea value={smsText} onChange={(e) => setSmsText(e.target.value)} rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="SMS xabar matnini yozing..." />
            <p className="text-xs text-gray-400 mt-1">{smsText.length}/160 belgi</p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500">
            <p><strong>Qabul qiluvchilar:</strong> {getRecipients().length} ta</p>
            <p><strong>Taxminiy narx:</strong> {getRecipients().length * 50} so'm</p>
          </div>

          <button onClick={sendSms} disabled={!smsText.trim() || getRecipients().length === 0}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={16} /> SMS Yuborish ({getRecipients().length} ta)
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Eskiz.uz sozlamalari</p>
              <p className="text-xs mt-0.5">SMS yuborish uchun eskiz.uz platformasidan API kalit olishingiz kerak.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">API Kalit</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Eskiz.uz API kalitingiz..." />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Yuboruvchi Nomi</label>
            <input value={senderName} onChange={(e) => setSenderName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="IELTS Centre" />
          </div>

          <button onClick={saveSettings}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Saqlash
          </button>
        </div>
      )}
    </div>
  );
}
