import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  Paperclip, Mic, MicOff, Download, FileText, Image,
} from 'lucide-react';
import { getChatMessages, sendChatMessage, sendChatFile, type ChatMessage } from '../../api/chat';
import { getGroup } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// ── constants ─────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  ADMIN:   'bg-red-100 text-red-700',
  TEACHER: 'bg-purple-100 text-purple-700',
  STUDENT: 'bg-blue-100 text-blue-700',
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN:   'Admin',
  TEACHER: "O'qituvchi",
  STUDENT: 'Talaba',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(sentAt: string) {
  const d = new Date(sentAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday)
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return (
    d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatDate(sentAt: string) {
  const d = new Date(sentAt);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Bugun';
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isImageFile(name: string | null) {
  if (!name) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(name);
}

// ── sub-components ────────────────────────────────────────────────────────────

function FileBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const name = msg.fileName ?? msg.content ?? 'fayl';
  if (isImageFile(name) && msg.fileUrl) {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={msg.fileUrl}
          alt={name}
          className="max-w-[220px] max-h-[200px] rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90 transition"
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <a
      href={msg.fileUrl ?? '#'}
      download={name}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 hover:opacity-80 transition rounded-lg px-1 py-0.5 ${
        isMe ? 'text-white' : 'text-indigo-700'
      }`}
    >
      <FileText size={18} className="flex-shrink-0 opacity-80" />
      <span className="text-sm underline underline-offset-2 break-all line-clamp-2">{name}</span>
      <Download size={13} className="flex-shrink-0 opacity-60 ml-auto" />
    </a>
  );
}

function VoiceBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isMe ? 'bg-white/20' : 'bg-indigo-100'
      }`}>
        🎙️
      </div>
      <audio
        controls
        src={msg.fileUrl ?? undefined}
        className="h-9 max-w-[180px] sm:max-w-[220px]"
        preload="metadata"
      />
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function GroupChatPage() {
  const { groupId }  = useParams<{ groupId: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const queryClient  = useQueryClient();

  const canUpload = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [text, setText]               = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recSec, setRecSec]           = useState(0);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mrRef        = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn:  () => getGroup(groupId!),
    enabled:  !!groupId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey:        ['chat', groupId],
    queryFn:         () => getChatMessages(groupId!),
    enabled:         !!groupId,
    refetchInterval: 3500,
  });

  // ── mutations ─────────────────────────────────────────────────────────────

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['chat', groupId] }),
    [queryClient, groupId],
  );

  const textMutation = useMutation({
    mutationFn: (content: string) => sendChatMessage(groupId!, content),
    onSuccess:  () => { invalidate(); setText(''); },
    onError:    () => toast.error('Xabarni yuborishda xatolik'),
  });

  const fileMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'FILE' | 'VOICE' }) =>
      sendChatFile(groupId!, file, type),
    onSuccess:  invalidate,
    onError:    (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Fayl yuborishda xatolik');
    },
  });

  // auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mrRef.current?.stream?.getTracks().forEach(t => t.stop());
    },
    [],
  );

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || textMutation.isPending) return;
    textMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileMutation.mutate({ file, type: 'FILE' });
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        fileMutation.mutate({ file, type: 'VOICE' });
        if (timerRef.current) clearInterval(timerRef.current);
        setRecSec(0);
      };
      mr.start(200);
      mrRef.current = mr;
      setIsRecording(true);
      setRecSec(0);
      timerRef.current = setInterval(() => setRecSec(s => s + 1), 1000);
    } catch {
      toast.error('Mikrofonga ruxsat berilmadi');
    }
  };

  const stopRecording = () => {
    mrRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── group by date ─────────────────────────────────────────────────────────

  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.sentAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  const isBusy = textMutation.isPending || fileMutation.isPending;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
          <MessageSquare size={17} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{group?.name ?? 'Guruh Chat'}</p>
          <p className="text-xs text-gray-400">
            {canUpload
              ? "Fayl (PDF/Slayd/Rasm) va ovozli xabar yuborishingiz mumkin"
              : "Faqat matn yozishingiz mumkin"}
          </p>
        </div>
        {isBusy && <Loader2 size={16} className="text-indigo-400 animate-spin flex-shrink-0" />}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto px-4 py-3 mb-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Yuklanmoqda…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <MessageSquare size={48} className="opacity-20" />
            <p className="text-sm font-medium">Hali xabarlar yo'q</p>
            <p className="text-xs opacity-60">Birinchi bo'lib yozing!</p>
          </div>
        ) : (
          <>
            {grouped.map(({ date, msgs: dayMsgs }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-0.5 rounded-full font-medium whitespace-nowrap">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {dayMsgs.map((msg) => {
                  const isMe = msg.senderUsername === user?.username;
                  const type = msg.messageType ?? 'TEXT';

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex mb-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Name + role badge (others only) */}
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {msg.senderName || msg.senderUsername}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                ROLE_COLOR[msg.senderRole] ?? 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {ROLE_LABEL[msg.senderRole] ?? msg.senderRole}
                            </span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          }`}
                        >
                          {type === 'TEXT' && (
                            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                          )}
                          {type === 'FILE' && <FileBubble msg={msg} isMe={isMe} />}
                          {type === 'VOICE' && <VoiceBubble msg={msg} isMe={isMe} />}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-gray-400 mt-1 px-1">
                          {formatTime(msg.sentAt)}
                        </span>
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

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex-shrink-0 shadow-sm">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-600 font-semibold">Yozilmoqda… {recSec}s</span>
            <span className="text-xs text-gray-400 ml-1">
              (To'xtatish uchun mikrofon tugmasini bosing)
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach file – teacher/admin only */}
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.pptx,.ppt,.docx,.doc"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy || isRecording}
                title="Fayl biriktirish (rasm, PDF, slayd)"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 transition disabled:opacity-40 flex-shrink-0"
              >
                <Paperclip size={17} />
              </button>
            </>
          )}

          {/* Text input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Ovoz yozilmoqda…'
                : 'Xabar yozing… (Enter = yuborish, Shift+Enter = yangi qator)'
            }
            disabled={isRecording}
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32 disabled:opacity-50 transition"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />

          {/* Mic button – teacher/admin only */}
          {canUpload && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isBusy && !isRecording}
              title={isRecording ? "To'xtatish va yuborish" : "Ovozli xabar yozish"}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition flex-shrink-0 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 disabled:opacity-40'
              }`}
            >
              {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || textMutation.isPending || isRecording}
            title="Yuborish"
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl flex items-center justify-center transition flex-shrink-0"
          >
            {textMutation.isPending
              ? <Loader2 size={16} className="text-white animate-spin" />
              : <Send size={16} className="text-white" />
            }
          </button>
        </div>

        {/* Student notice */}
        {!canUpload && (
          <p className="text-[11px] text-gray-400 mt-2 px-1 flex items-center gap-1">
            <Image size={11} className="opacity-60" />
            Siz faqat matn yuborish mumkin. Fayl va ovoz — faqat o'qituvchi/admin uchun.
          </p>
        )}
      </div>
    </div>
  );
}
