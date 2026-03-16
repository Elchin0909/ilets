import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Download, UserPlus, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudents } from '../../api/students';
import { getGroups, getEnrollments, createEnrollment } from '../../api/groups';
import { createNotification } from '../../api/notifications';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BulkOperationsPage() {
  const qc = useQueryClient();
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [search, setSearch] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const enrollMut = useMutation({
    mutationFn: (data: { studentId: string; groupId: string }) => createEnrollment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });

  const filtered = students.filter((s: any) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedStudents.length === filtered.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map((s: any) => s.id));
    }
  }

  async function bulkEnroll() {
    if (!selectedGroup || selectedStudents.length === 0) {
      toast.error("Talabalar va guruh tanlang");
      return;
    }
    setLoading(true);
    let success = 0;
    let failed = 0;
    for (const studentId of selectedStudents) {
      try {
        await enrollMut.mutateAsync({ studentId, groupId: selectedGroup });
        success++;
      } catch {
        failed++;
      }
    }
    setLoading(false);
    toast.success(`${success} ta yozildi${failed > 0 ? `, ${failed} ta xatolik` : ''}`);
    setSelectedStudents([]);
  }

  async function bulkNotify() {
    if (!notifTitle.trim() || selectedStudents.length === 0) {
      toast.error("Sarlavha va talabalarni tanlang");
      return;
    }
    setLoading(true);
    let success = 0;
    for (const studentId of selectedStudents) {
      try {
        // Find user ID for this student (simple approach - use studentId as userId placeholder)
        await createNotification({
          userId: studentId,
          title: notifTitle,
          message: notifMessage,
          type: 'INFO',
        });
        success++;
      } catch { /* skip */ }
    }
    setLoading(false);
    toast.success(`${success} ta bildirishnoma yuborildi`);
    setNotifTitle('');
    setNotifMessage('');
  }

  function exportSelectedPdf() {
    if (selectedStudents.length === 0) { toast.error("Talabalar tanlang"); return; }
    const selected = students.filter((s: any) => selectedStudents.includes(s.id));
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Tanlangan Talabalar', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`${selected.length} ta talaba — ${new Date().toLocaleDateString('uz-UZ')}`, 14, 28);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 35,
      head: [['#', 'Ism', 'Telefon', 'Email']],
      body: selected.map((s: any, i: number) => [i + 1, s.fullName, s.phone || '—', s.email || '—']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save('tanlangan-talabalar.pdf');
  }

  function exportSelectedCsv() {
    if (selectedStudents.length === 0) { toast.error("Talabalar tanlang"); return; }
    const selected = students.filter((s: any) => selectedStudents.includes(s.id));
    const csv = ['Ism,Telefon,Email', ...selected.map((s: any) => `"${s.fullName}","${s.phone || ''}","${s.email || ''}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talabalar.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ommaviy Amallar</h1>
          <p className="text-sm text-gray-500">Bir nechta talabalar bilan ishlash</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Student selection */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Talabalar</h2>
              <p className="text-xs text-gray-500">{selectedStudents.length} ta tanlangan</p>
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                {selectedStudents.length === filtered.length ? 'Bekor qilish' : 'Barchasini tanlash'}
              </button>
            </div>
          </div>
          <div className="p-3 border-b border-gray-50">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filtered.map((s: any) => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.fullName}</p>
                  <p className="text-xs text-gray-500">{s.phone}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Bulk Enroll */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <UserPlus size={14} className="text-green-500" /> Guruhga Yozish
            </h3>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 mb-3">
              <option value="">Guruh tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={bulkEnroll} disabled={loading || !selectedGroup || selectedStudents.length === 0}
              className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'Yozilmoqda...' : `${selectedStudents.length} ta talabani yozish`}
            </button>
          </div>

          {/* Bulk Notify */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" /> Xabar Yuborish
            </h3>
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Sarlavha" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 mb-2" />
            <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Xabar matni" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 mb-3" />
            <button onClick={bulkNotify} disabled={loading || !notifTitle || selectedStudents.length === 0}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {selectedStudents.length} ta talabaga yuborish
            </button>
          </div>

          {/* Export */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Download size={14} className="text-indigo-500" /> Eksport
            </h3>
            <div className="flex gap-2">
              <button onClick={exportSelectedPdf} disabled={selectedStudents.length === 0}
                className="flex-1 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition disabled:opacity-50">
                PDF
              </button>
              <button onClick={exportSelectedCsv} disabled={selectedStudents.length === 0}
                className="flex-1 py-2.5 bg-green-50 text-green-600 text-sm font-medium rounded-xl hover:bg-green-100 transition disabled:opacity-50">
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
