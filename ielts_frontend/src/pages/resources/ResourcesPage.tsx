import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  uploadResourceFile,
  type Resource,
} from '../../api/resources';
import {
  Plus,
  Trash2,
  Edit3,
  FileText,
  ExternalLink,
  PlayCircle,
  Loader2,
  Search,
  X,
  Upload,
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Hammasi' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'READING', label: 'Reading' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'OTHER', label: 'Boshqa' },
];

const TYPES = [
  { value: 'PDF', label: 'PDF fayl', icon: FileText },
  { value: 'LINK', label: 'Havola', icon: ExternalLink },
  { value: 'VIDEO', label: 'Video (YouTube)', icon: PlayCircle },
];

const typeIcon = (type: string) => {
  if (type === 'PDF') return <FileText size={16} className="text-red-500" />;
  if (type === 'VIDEO') return <PlayCircle size={16} className="text-red-500" />;
  return <ExternalLink size={16} className="text-blue-500" />;
};

const typeBadge = (type: string) => {
  if (type === 'PDF') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (type === 'VIDEO') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
};

interface FormData {
  title: string;
  description: string;
  category: string;
  type: string;
  linkUrl: string;
  fileUrl: string;
}

const emptyForm: FormData = {
  title: '',
  description: '',
  category: 'GRAMMAR',
  type: 'LINK',
  linkUrl: '',
  fileUrl: '',
};

export default function ResourcesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', filter],
    queryFn: () => getResources(filter || undefined),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<Resource>) => createResource(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) => updateResource(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: Resource) => {
    setEditId(r.resourceId);
    setForm({
      title: r.title,
      description: r.description ?? '',
      category: r.category,
      type: r.type,
      linkUrl: r.linkUrl ?? '',
      fileUrl: r.fileUrl ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    const payload: Partial<Resource> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      type: form.type,
      linkUrl: form.type !== 'PDF' ? form.linkUrl.trim() : undefined,
      fileUrl: form.type === 'PDF' ? form.fileUrl.trim() : undefined,
    };

    if (!payload.title) return;
    if (form.type === 'PDF' && !form.fileUrl) return;
    if (form.type !== 'PDF' && !form.linkUrl) return;

    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadResourceFile(file);
      setForm((f) => ({ ...f, fileUrl: result.url }));
    } catch {
      alert("Fayl yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resurslar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jami {resources.length} ta resurs ({resources.filter((r) => r.type === 'VIDEO').length} video, {resources.filter((r) => r.type === 'PDF').length} PDF, {resources.filter((r) => r.type === 'LINK').length} link)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Resurs qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                filter === c.value
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {search ? "Hech narsa topilmadi" : "Resurslar hali qo'shilmagan"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Nomi</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Turi</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Kategoriya</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden md:table-cell">Sana</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.resourceId} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{typeIcon(r.type)}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{r.title}</p>
                          {r.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{r.description}</p>
                          )}
                          {/* Mobile badges */}
                          <div className="flex gap-1.5 mt-1 sm:hidden">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeBadge(r.type)}`}>
                              {r.type}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {r.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${typeBadge(r.type)}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                      {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {(r.linkUrl || r.fileUrl) && (
                          <a
                            href={r.type === 'PDF' ? r.fileUrl : r.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Ochish"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(r)}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Tahrirlash"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${r.title}" resursini o'chirmoqchimisiz?`)) {
                              deleteMut.mutate(r.resourceId);
                            }
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editId ? 'Resursni tahrirlash' : "Yangi resurs qo'shish"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Turi</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                          form.type === t.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-600'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon size={16} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomi *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Resurs nomi"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Qisqacha tavsif..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategoriya</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL / File upload */}
              {form.type === 'PDF' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">PDF fayl *</label>
                  {form.fileUrl ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                      <FileText size={16} className="text-red-500 flex-shrink-0" />
                      <span className="flex-1 truncate text-gray-600 dark:text-gray-400">{form.fileUrl}</span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, fileUrl: '' }))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition">
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                      ) : (
                        <Upload size={20} className="text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">
                        {uploading ? 'Yuklanmoqda...' : 'PDF faylni tanlang'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              ) : form.type === 'VIDEO' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">YouTube havola *</label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {form.linkUrl && getYouTubeThumb(form.linkUrl) && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                      <img src={getYouTubeThumb(form.linkUrl)!} alt="preview" className="w-full" />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Havola *</label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://example.com/..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !form.title.trim() || (form.type === 'PDF' ? !form.fileUrl : !form.linkUrl)}
                className="px-6 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {editId ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getYouTubeThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}
