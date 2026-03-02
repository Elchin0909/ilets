import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import { getGroups } from '../../api/groups';
import { getExamsByGroup, deleteExam } from '../../api/exams';
import type { Exam } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { showSuccess, showError } from '../../utils/toast';

export default function ExamsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', selectedGroupId],
    queryFn: () => getExamsByGroup(selectedGroupId),
    enabled: selectedGroupId > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', selectedGroupId] });
      showSuccess("Imtihon o'chirildi!");
    },
    onError: () => showError("Xatolik yuz berdi"),
  });

  const columns = [
    { key: 'title', header: 'Sarlavha', render: (e: Exam) => e.title || <span className="text-gray-400">—</span> },
    { key: 'examDate', header: 'Sana' },
    {
      key: 'actions',
      header: '',
      render: (e: Exam) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/exams/${e.id}`)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Natijalar"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => { if (window.confirm("Bu imtihonni o'chirasizmi? Barcha natijalar ham o'chadi.")) deleteMutation.mutate(e.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="O'chirish"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Imtihonlar" subtitle="Guruh bo'yicha imtihonlarni ko'rish" />
      <div className="mb-4">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Guruhni tanlang...</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {selectedGroupId > 0 ? (
        <Table columns={columns} data={exams} keyField="id" loading={isLoading} emptyMessage="Bu guruhda imtihonlar yo'q" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          Imtihonlarni ko'rish uchun guruhni tanlang
        </div>
      )}
    </div>
  );
}
