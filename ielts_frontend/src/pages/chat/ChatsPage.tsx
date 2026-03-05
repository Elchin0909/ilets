import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Users, ChevronRight } from 'lucide-react';
import { getChatSummary, type ChatSummary } from '../../api/chat';

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Kecha';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('uz-UZ', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
    }
  } catch {
    return '';
  }
}

function lastMsgPreview(item: ChatSummary): string {
  if (!item.lastMessageId) return 'Hali xabar yo\'q';
  const type = item.lastMessageType;
  const sender = item.lastSenderName ? `${item.lastSenderName}: ` : '';
  if (type === 'VOICE') return `${sender}🎤 Ovozli xabar`;
  if (type === 'FILE') {
    const content = item.lastContent ?? '';
    const ext = content.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return `${sender}🖼 Rasm`;
    if (ext === 'pdf') return `${sender}📄 PDF fayl`;
    if (['ppt', 'pptx'].includes(ext)) return `${sender}📊 Taqdimot`;
    if (['doc', 'docx'].includes(ext)) return `${sender}📝 Word fayl`;
    return `${sender}📎 Fayl`;
  }
  return `${sender}${item.lastContent ?? ''}`;
}

export default function ChatsPage() {
  const navigate = useNavigate();

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['chatSummary'],
    queryFn: getChatSummary,
    refetchInterval: 30_000, // har 30 sekundda yangilanadi
  });

  // Guruhlarni oxirgi xabar vaqti bo'yicha saralash (xabarsizlar oxirida)
  const sorted = [...summaries].sort((a, b) => {
    if (!a.lastSentAt && !b.lastSentAt) return (a.groupName ?? '').localeCompare(b.groupName ?? '');
    if (!a.lastSentAt) return 1;
    if (!b.lastSentAt) return -1;
    return new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <MessageSquare size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guruh Chatlari</h1>
          <p className="text-sm text-gray-500">{summaries.length} ta guruh</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
            Yuklanmoqda...
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">Hech qanday guruh yo'q</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((item) => {
              const hasMessages = !!item.lastMessageId;
              return (
                <li key={item.groupId}>
                  <button
                    onClick={() => navigate(`/chat/group/${item.groupId}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-bold text-lg">
                        {item.groupName?.charAt(0).toUpperCase() ?? 'G'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {item.groupName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTime(item.lastSentAt)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${hasMessages ? 'text-gray-500' : 'text-gray-400 italic'}`}>
                        {lastMsgPreview(item)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
