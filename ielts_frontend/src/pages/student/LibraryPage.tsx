import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResources, type Resource } from '../../api/resources';
import { Library, FileText, ExternalLink, Loader2, Search } from 'lucide-react';

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

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8080';

export default function LibraryPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', category],
    queryFn: () => getResources(category || undefined),
  });

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Library size={28} />
          <h1 className="text-2xl font-bold">Kutubxona</h1>
        </div>
        <p className="text-rose-100 text-sm">Grammar, IELTS va boshqa materiallar</p>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              category === c.value
                ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
        />
      </div>

      {/* Resources list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {search ? 'Hech narsa topilmadi' : 'Hali materiallar qo\'shilmagan'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <ResourceRow key={r.resourceId} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const isPdf = resource.type === 'PDF';
  const url = isPdf
    ? (resource.fileUrl?.startsWith('http') ? resource.fileUrl : `${BASE_URL}${resource.fileUrl}`)
    : resource.linkUrl;

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isPdf ? 'bg-red-50' : 'bg-blue-50'
      }`}>
        {isPdf ? (
          <FileText size={18} className="text-red-500" />
        ) : (
          <ExternalLink size={18} className="text-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{resource.title}</p>
        {resource.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{resource.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {isPdf ? 'PDF' : 'Link'}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
            {resource.category}
          </span>
        </div>
      </div>
    </a>
  );
}
