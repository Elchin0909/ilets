import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { getGroups } from '../../api/groups';
import { getLessonsByGroup, createLesson } from '../../api/lessons';
import type { Lesson, LessonCreateRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<LessonCreateRequest>({ groupId: 0, lessonDate: '', topic: '' });

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', selectedGroupId],
    queryFn: () => getLessonsByGroup(selectedGroupId),
    enabled: selectedGroupId > 0,
  });

  const createMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', form.groupId] });
      setShowCreate(false);
    },
  });

  const columns = [
    { key: 'id', header: '#', render: (l: Lesson) => <span className="text-gray-400">{l.id}</span> },
    { key: 'lessonDate', header: 'Date' },
    { key: 'topic', header: 'Topic', render: (l: Lesson) => l.topic || <span className="text-gray-400">—</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Lessons"
        subtitle="View and manage lessons by group"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <Plus size={16} />
            Add Lesson
          </button>
        }
      />

      <div className="mb-4">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a group to view lessons...</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroupId > 0 ? (
        <Table columns={columns} data={lessons} keyField="id" loading={isLoading} emptyMessage="No lessons for this group" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          Select a group to view its lessons
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Lesson">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
            <select
              required
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Date *</label>
            <input
              required
              type="date"
              value={form.lessonDate}
              onChange={(e) => setForm({ ...form, lessonDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional topic"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
              {createMutation.isPending ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
