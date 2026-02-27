import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../api/courses';
import type { Course, CourseCreateRequest } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';

function CourseForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Course>;
  onSubmit: (data: CourseCreateRequest) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CourseCreateRequest>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. IELTS General, IELTS Academic"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Optional description..."
        />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-5 rounded-lg transition">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseCreateRequest }) => updateCourse(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setEditCourse(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  const columns = [
    { key: 'id', header: '#', render: (c: Course) => <span className="text-gray-400">{c.id}</span> },
    { key: 'name', header: 'Course Name' },
    { key: 'description', header: 'Description', render: (c: Course) => c.description || <span className="text-gray-400">—</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Course) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditCourse(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { if (confirm(`Delete course "${c.name}"?`)) deleteMutation.mutate(c.id); }}
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
        title="Courses"
        subtitle={`${courses.length} courses total`}
        action={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition">
            <Plus size={16} />
            Add Course
          </button>
        }
      />
      <Table columns={columns} data={courses} keyField="id" loading={isLoading} emptyMessage="No courses found" />
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Course">
        <CourseForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editCourse} onClose={() => setEditCourse(null)} title="Edit Course">
        {editCourse && (
          <CourseForm
            initial={editCourse}
            onSubmit={(data) => updateMutation.mutate({ id: editCourse.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
