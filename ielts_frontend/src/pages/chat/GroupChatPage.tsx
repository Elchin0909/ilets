import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { getChatMessages, sendChatMessage, type ChatMessage } from '../../api/chat';
import { getGroup } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  TEACHER: 'bg-purple-100 text-purple-700',
  STUDENT: 'bg-blue-100 text-blue-700',
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: "O'qituvchi",
  STUDENT: 'Talaba',
};

function formatTime(sentAt: string) {
  const d = new Date(sentAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroup(groupId!),
    enabled: !!groupId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', groupId],
    queryFn: () => getChatMessages(groupId!),
    enabled: !!groupId,
    refetchInterval: 4000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendChatMessage(groupId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', groupId] });
      setText('');
    },
    onError: () => toast.error("Xabarni yuborishda xatolik"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const date = new Date(msg.sentAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <MessageSquare size={16} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{group?.name ?? 'Guruh Chat'}</p>
          <p className="text-xs text-gray-400">Guruh ichki chat · har 4 soniyada yangilanadi</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto p-4 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Yuklanmoqda...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <MessageSquare size={40} className="opacity-30" />
            <p className="text-sm">Hali xabarlar yo'q. Birinchi bo'lib yozing!</p>
          </div>
        ) : (
          <>
            {grouped.map(({ date, msgs }) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 px-2">{date}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {msgs.map((msg) => {
                  const isMe = msg.senderUsername === user?.username;
                  return (
                    <div key={msg.messageId} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-700">{msg.senderName || msg.senderUsername}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLOR[msg.senderRole] ?? 'bg-gray-100 text-gray-600'}`}>
                              {ROLE_LABEL[msg.senderRole] ?? msg.senderRole}
                            </span>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.sentAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-end gap-3 flex-shrink-0">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing... (Enter = yuborish, Shift+Enter = yangi qator)"
          rows={1}
          className="flex-1 resize-none px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
          style={{ minHeight: '42px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl flex items-center justify-center transition flex-shrink-0"
        >
          {sendMutation.isPending
            ? <Loader2 size={16} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />
          }
        </button>
      </div>
    </div>
  );
}
