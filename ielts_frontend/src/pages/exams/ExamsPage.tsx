import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { getGroups } from '../../api/groups';
import { getExamsByGroup } from '../../api/exams';
import type { Exam } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

export default function ExamsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const navigate = useNavigate();

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', selectedGroupId],
    queryFn: () => getExamsByGroup(selectedGroupId),
    enabled: selectedGroupId > 0,
  });

  const columns = [
    { key: 'id', header: '#', render: (e: Exam) => <span className="text-gray-400">{e.id}</span> },
    { key: 'title', header: 'Title', render: (e: Exam) => e.title || <span className="text-gray-400">—</span> },
    { key: 'examDate', header: 'Date' },
    { key: 'maxScore', header: 'Max Score', render: (e: Exam) => e.maxScore ?? '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: Exam) => (
        <button
          onClick={() => navigate(`/exams/${e.id}`)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Exams" subtitle="View exams by group" />
      <div className="mb-4">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a group...</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {selectedGroupId > 0 ? (
        <Table columns={columns} data={exams} keyField="id" loading={isLoading} emptyMessage="No exams for this group" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          Select a group to view exams
        </div>
      )}
    </div>
  );
}
