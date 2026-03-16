import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Users, GraduationCap, Layers, CreditCard,
  BarChart2,
} from 'lucide-react';
import { getStudents } from '../../api/students';
import { getTeachers } from '../../api/teachers';
import { getGroups, getEnrollments } from '../../api/groups';
import { getPayments } from '../../api/payments';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ReportsPage() {
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers });
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: enrollments = [] } = useQuery({ queryKey: ['enrollments'], queryFn: getEnrollments });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => getPayments() });

  const [generating, setGenerating] = useState<string | null>(null);

  function createPdf(title: string) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`IELTS Centre — ${new Date().toLocaleDateString('uz-UZ')}`, 14, 30);
    doc.setTextColor(0);
    return doc;
  }

  async function generateStudentReport() {
    setGenerating('students');
    try {
      const doc = createPdf('Talabalar Hisoboti');
      autoTable(doc, {
        startY: 38,
        head: [['#', 'Ism', 'Telefon', 'Email', 'Yaratilgan']],
        body: students.map((s: any, i: number) => [
          i + 1, s.fullName, s.phone || '—', s.email || '—', fmt(s.createdAt),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
      });
      doc.save('talabalar-hisoboti.pdf');
    } finally { setGenerating(null); }
  }

  async function generateTeacherReport() {
    setGenerating('teachers');
    try {
      const doc = createPdf("O'qituvchilar Hisoboti");
      const rows = (teachers as any[]).map((t, i) => {
        const tGroups = groups.filter((g) => String(g.teacherId) === String(t.id ?? t.teacherId));
        const tStudents = tGroups.reduce((acc, g) =>
          acc + enrollments.filter((e) => String(e.groupId) === String(g.id)).length, 0);
        return [i + 1, t.fullName, t.phone || '—', tGroups.length, tStudents];
      });
      autoTable(doc, {
        startY: 38,
        head: [['#', 'Ism', 'Telefon', 'Guruhlar', 'Talabalar']],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
      });
      doc.save('oqituvchilar-hisoboti.pdf');
    } finally { setGenerating(null); }
  }

  async function generateGroupReport() {
    setGenerating('groups');
    try {
      const doc = createPdf('Guruhlar Hisoboti');
      const rows = groups.map((g, i) => {
        const count = enrollments.filter((e) => String(e.groupId) === String(g.id)).length;
        return [i + 1, g.name, g.teacherName || '—', g.courseName || '—', count, g.schedule || '—'];
      });
      autoTable(doc, {
        startY: 38,
        head: [['#', 'Guruh', "O'qituvchi", 'Kurs', 'Talabalar', 'Jadval']],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 197, 94] },
      });
      doc.save('guruhlar-hisoboti.pdf');
    } finally { setGenerating(null); }
  }

  async function generatePaymentReport() {
    setGenerating('payments');
    try {
      const doc = createPdf("To'lovlar Hisoboti");
      const rows = (payments as any[]).slice(0, 200).map((p, i) => [
        i + 1,
        p.studentName || '—',
        `${Number(p.amount).toLocaleString()} ${p.currency || 'UZS'}`,
        p.type || '—',
        p.month || '—',
        fmt(p.paidAt || p.createdAt),
      ]);
      autoTable(doc, {
        startY: 38,
        head: [['#', 'Talaba', 'Summa', 'Turi', 'Oy', 'Sana']],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 158, 11] },
      });
      const total = (payments as any[]).reduce((a, p) => a + (Number(p.amount) || 0), 0);
      doc.setFontSize(11);
      doc.text(`Jami: ${total.toLocaleString()} UZS`, 14, (doc as any).lastAutoTable.finalY + 10);
      doc.save('tolovlar-hisoboti.pdf');
    } finally { setGenerating(null); }
  }

  async function generateFullReport() {
    setGenerating('full');
    try {
      const doc = createPdf('IELTS Centre — To\'liq Hisobot');

      doc.setFontSize(12);
      doc.text('Umumiy Ko\'rsatkichlar', 14, 40);
      autoTable(doc, {
        startY: 46,
        head: [['Ko\'rsatkich', 'Soni']],
        body: [
          ['Talabalar', students.length],
          ["O'qituvchilar", (teachers as any[]).length],
          ['Guruhlar', groups.length],
          ['Yozilishlar', enrollments.length],
          ["To'lovlar", (payments as any[]).length],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [99, 102, 241] },
        theme: 'grid',
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text('Talabalar Ro\'yxati', 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Ism', 'Telefon', 'Email']],
        body: students.map((s: any, i: number) => [i + 1, s.fullName, s.phone || '—', s.email || '—']),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text('Guruhlar', 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Guruh', "O'qituvchi", 'Talabalar']],
        body: groups.map((g, i) => [
          i + 1, g.name, g.teacherName || '—',
          enrollments.filter((e) => String(e.groupId) === String(g.id)).length,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      doc.save('ielts-toliq-hisobot.pdf');
    } finally { setGenerating(null); }
  }

  const reports = [
    { key: 'students', label: 'Talabalar Hisoboti', desc: "Barcha talabalar ro'yxati", icon: Users, color: 'bg-blue-50 text-blue-600', fn: generateStudentReport },
    { key: 'teachers', label: "O'qituvchilar Hisoboti", desc: "O'qituvchilar va ularning guruhlari", icon: GraduationCap, color: 'bg-purple-50 text-purple-600', fn: generateTeacherReport },
    { key: 'groups', label: 'Guruhlar Hisoboti', desc: "Guruhlar, jadval va talabalar soni", icon: Layers, color: 'bg-green-50 text-green-600', fn: generateGroupReport },
    { key: 'payments', label: "To'lovlar Hisoboti", desc: "Barcha to'lovlar va jami summa", icon: CreditCard, color: 'bg-yellow-50 text-yellow-600', fn: generatePaymentReport },
    { key: 'full', label: "To'liq Hisobot", desc: "Barcha ma'lumotlar bitta faylda", icon: BarChart2, color: 'bg-indigo-50 text-indigo-600', fn: generateFullReport },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">PDF Hisobotlar</h1>
          <p className="text-sm text-gray-500">Hisobotlarni PDF formatda yuklab oling</p>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.key} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-sm transition">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.color.split(' ')[0]}`}>
              <r.icon size={22} className={r.color.split(' ')[1]} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{r.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </div>
            <button
              onClick={r.fn}
              disabled={!!generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {generating === r.key ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download size={16} />
              )}
              {generating === r.key ? 'Yaratilmoqda...' : 'Yuklab olish'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
