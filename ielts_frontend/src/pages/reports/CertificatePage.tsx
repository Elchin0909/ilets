import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, Search, Users } from 'lucide-react';
import { getStudents } from '../../api/students';
import { getGroups, getEnrollments } from '../../api/groups';
import jsPDF from 'jspdf';

export default function CertificatePage() {
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [certType, setCertType] = useState<'completion' | 'achievement'>('completion');
  const [customText, setCustomText] = useState('');
  const [generating, setGenerating] = useState(false);

  const filtered = students.filter((s: any) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  function generateCertificate() {
    if (!selectedStudent) return;
    setGenerating(true);

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const w = 297;
      const h = 210;

      // Background border
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(2);
      doc.rect(10, 10, w - 20, h - 20);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, w - 28, h - 28);

      // Corner decorations
      const corners = [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]];
      doc.setFillColor(99, 102, 241);
      corners.forEach(([x, y]) => doc.circle(x, y, 3, 'F'));

      // Header
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('IELTS CENTRE', w / 2, 35, { align: 'center' });

      // Title
      doc.setFontSize(32);
      doc.setTextColor(30, 30, 30);
      doc.text(
        certType === 'completion' ? 'SERTIFIKAT' : 'MUVAFFAQIYAT SERTIFIKATI',
        w / 2, 55, { align: 'center' }
      );

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(120, 120, 120);
      doc.text(
        certType === 'completion'
          ? "Ushbu sertifikat quyidagi shaxsga beriladi"
          : "Ushbu sertifikat yuqori natijalar uchun beriladi",
        w / 2, 68, { align: 'center' }
      );

      // Student name
      doc.setFontSize(28);
      doc.setTextColor(99, 102, 241);
      doc.text(selectedStudent.fullName, w / 2, 88, { align: 'center' });

      // Line under name
      const nameWidth = doc.getTextWidth(selectedStudent.fullName);
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(w / 2 - nameWidth / 2 - 10, 92, w / 2 + nameWidth / 2 + 10, 92);

      // Group info
      const studentEnr = enrollments.filter((e) => String(e.studentId) === String(selectedStudent.id));
      const studentGroups = studentEnr
        .map((e) => groups.find((g) => String(g.id) === String(e.groupId)))
        .filter(Boolean);

      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      if (studentGroups.length > 0) {
        doc.text(`Guruh: ${studentGroups.map((g: any) => g.name).join(', ')}`, w / 2, 104, { align: 'center' });
      }

      // Custom text
      if (customText) {
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(customText, 200);
        doc.text(lines, w / 2, 116, { align: 'center' });
      }

      // Band score if available
      if (selectedStudent.ieltsBandScore) {
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text(`IELTS Band Score: ${selectedStudent.ieltsBandScore}`, w / 2, 135, { align: 'center' });
      }

      // Date and signature
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      const date = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Sana: ${date}`, 50, h - 35, { align: 'center' });
      doc.text('Direktor', w - 50, h - 35, { align: 'center' });

      doc.setDrawColor(150, 150, 150);
      doc.line(30, h - 40, 70, h - 40);
      doc.line(w - 70, h - 40, w - 30, h - 40);

      doc.save(`sertifikat-${selectedStudent.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Award size={20} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sertifikat Yaratish</h1>
          <p className="text-sm text-gray-500">Talabalar uchun sertifikat yarating</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Student selection */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Talabani tanlang</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedStudent(null); }}
              placeholder="Ism bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {search && !selectedStudent && (
            <div className="mt-2 border border-gray-100 rounded-xl max-h-48 overflow-y-auto">
              {filtered.slice(0, 10).map((s: any) => (
                <button key={s.id} onClick={() => { setSelectedStudent(s); setSearch(s.fullName); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm flex items-center gap-2 border-b border-gray-50 last:border-0">
                  <Users size={14} className="text-gray-400" /> {s.fullName}
                </button>
              ))}
            </div>
          )}
          {selectedStudent && (
            <div className="mt-2 bg-indigo-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {selectedStudent.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedStudent.fullName}</p>
                <p className="text-xs text-gray-500">{selectedStudent.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Certificate type */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Sertifikat turi</label>
          <div className="flex gap-3">
            {[
              { value: 'completion' as const, label: 'Kursni Tugatish', desc: "Kursni muvaffaqiyatli tugatganligi haqida" },
              { value: 'achievement' as const, label: 'Muvaffaqiyat', desc: "Yuqori natijalar uchun" },
            ].map((t) => (
              <button key={t.value} onClick={() => setCertType(t.value)}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition ${
                  certType === t.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <p className="text-sm font-medium text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom text */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Qo'shimcha matn (ixtiyoriy)</label>
          <textarea
            value={customText} onChange={(e) => setCustomText(e.target.value)}
            rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="Masalan: IELTS 7.0 natijasiga erishganligi uchun..."
          />
        </div>

        <button
          onClick={generateCertificate}
          disabled={!selectedStudent || generating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {generating ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Download size={18} />
          )}
          {generating ? 'Yaratilmoqda...' : 'PDF Sertifikat Yuklash'}
        </button>
      </div>
    </div>
  );
}
