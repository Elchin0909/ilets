import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../../api/groups';
import { getTeachers } from '../../api/teachers';
import { getCourses } from '../../api/courses';
import type { Group, GroupCreateRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';

function GroupForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Group>;
  onSubmit: (data: GroupCreateRequest) => void;
  loading: boolean;
}) {
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers });
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: getCourses });

  const [form, setForm] = useState<GroupCreateRequest>({
    name: initial?.name ?? '',
    courseId: initial?.courseId ?? '',
    teacherId: initial?.teacherId ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Group A, Morning-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
        <select
          required
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
        <select
          required
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupCreateRequest }) => updateGroup(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); setEditGroup(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  const columns = [
    { key: 'id', header: '#', render: (g: Group) => <span className="text-gray-400">{g.id}</span> },
    { key: 'name', header: 'Name' },
    { key: 'courseName', header: 'Course', render: (g: Group) => g.courseName || <span className="text-gray-400">ID: {g.courseId}</span> },
    { key: 'teacherName', header: 'Teacher', render: (g: Group) => g.teacherName || <span className="text-gray-400">ID: {g.teacherId}</span> },
    { key: 'startDate', header: 'Start', render: (g: Group) => g.startDate || <span className="text-gray-400">—</span> },
    { key: 'endDate', header: 'End', render: (g: Group) => g.endDate || <span className="text-gray-400">—</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (g: Group) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/groups/${g.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
            <Eye size={15} />
          </button>
          <button onClick={() => setEditGroup(g)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { if (confirm(`Delete group "${g.name}"?`)) deleteMutation.mutate(g.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} groups total`}
        action={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition">
            <Plus size={16} />
            Add Group
          </button>
        }
      />
      <Table columns={columns} data={groups} keyField="id" loading={isLoading} emptyMessage="No groups found" />
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Group">
        <GroupForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editGroup} onClose={() => setEditGroup(null)} title="Edit Group">
        {editGroup && (
          <GroupForm
            initial={editGroup}
            onSubmit={(data) => updateMutation.mutate({ id: editGroup.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
