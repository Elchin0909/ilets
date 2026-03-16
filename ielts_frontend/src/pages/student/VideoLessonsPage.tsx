import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResources, type Resource } from '../../api/resources';
import { PlayCircle, Search, Loader2, ExternalLink } from 'lucide-react';

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

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return m ? m[1] : null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export default function VideoLessonsPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: allResources = [], isLoading } = useQuery({
    queryKey: ['resources', category],
    queryFn: () => getResources(category || undefined),
  });

  // Filter only video/youtube links
  const videos = allResources.filter(
    (r) =>
      r.type === 'VIDEO' ||
      (r.type === 'LINK' && r.linkUrl && (r.linkUrl.includes('youtube.com') || r.linkUrl.includes('youtu.be')))
  );

  const filtered = videos.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle size={28} />
          <h1 className="text-2xl font-bold">Video Darslar</h1>
        </div>
        <p className="text-red-100 text-sm">YouTube dars videolari</p>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              category === c.value
                ? 'bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Video qidirish..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Videos grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {search ? 'Hech narsa topilmadi' : "Video darslar hali qo'shilmagan"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((video) => (
            <VideoCard
              key={video.resourceId}
              video={video}
              isPlaying={playingId === video.resourceId}
              onPlay={() => setPlayingId(playingId === video.resourceId ? null : video.resourceId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video,
  isPlaying,
  onPlay,
}: {
  video: Resource;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const url = video.linkUrl ?? '';
  const ytId = getYouTubeId(url);
  const thumb = getYouTubeThumbnail(url);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Thumbnail / Player */}
      {isPlaying && ytId ? (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button onClick={onPlay} className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 group">
          {thumb ? (
            <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <PlayCircle size={28} className="text-white" />
            </div>
          </div>
        </button>
      )}

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
            {video.category}
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} /> YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
