import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  Paperclip, Mic, MicOff, Download, FileText, Image,
  Play, Pause, Check, ExternalLink,
} from 'lucide-react';
import { getChatMessages, sendChatMessage, sendChatFile, type ChatMessage } from '../../api/chat';
import { getGroup } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  if (d.toDateString() === now.toDateString())
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

/** Pick the best supported MediaRecorder audio mimeType */
function bestAudioMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    '',           // browser default — always works
  ];
  for (const t of candidates) {
    if (t === '' || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t))) {
      return t;
    }
  }
  return '';
}

function mimeToExt(mime: string): string {
  if (mime.includes('ogg')) return '.ogg';
  if (mime.includes('mp4')) return '.m4a';
  return '.webm';
}

// ── IMAGE bubble (Telegram-style: image IS the bubble, no padding) ────────────

function ImageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const [lightbox, setLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const name = msg.fileName ?? 'rasm';
  const src  = msg.fileUrl ?? '';

  if (imgError || !src) {
    // Fallback — rasm yuklanmadi
    return (
      <a
        href={src || '#'}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-sm max-w-[260px] ${
          isMe
            ? 'bg-indigo-600 text-white rounded-tr-sm hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm hover:bg-gray-200'
        } transition`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isMe ? 'bg-white/20' : 'bg-indigo-100'
        }`}>
          <Image size={18} className={isMe ? 'text-white' : 'text-indigo-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>Rasmni ochish</p>
        </div>
      </a>
    );
  }

  return (
    <>
      {/* Thumbnail — click to open lightbox */}
      <div
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setLightbox(true)}
        className={`overflow-hidden rounded-2xl shadow-md cursor-pointer hover:brightness-95 active:brightness-90 transition ${
          isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={{ maxWidth: '260px' }}
      >
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="block w-full max-h-[260px] object-cover"
        />
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={src}
            alt={name}
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:opacity-70 transition"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

// ── DOCUMENT bubble (Telegram-style: tap to download, tap to open) ───────────

function DocBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const name = msg.fileName ?? msg.content ?? 'fayl';
  const src = msg.fileUrl ?? '';
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const blobUrlRef = useRef<string | null>(null);

  // cleanup blob URL on unmount
  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  const handleTap = async () => {
    if (!src) return;

    if (state === 'ready' && blobUrlRef.current) {
      // second tap → open file
      window.open(blobUrlRef.current, '_blank');
      return;
    }

    if (state === 'loading') return;

    // first tap → download
    setState('loading');
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      // trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();

      setState('ready');
    } catch {
      // fallback: open in new tab
      window.open(src, '_blank');
      setState('ready');
    }
  };

  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleTap()}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-sm max-w-[260px] cursor-pointer select-none ${
        isMe
          ? 'bg-indigo-600 text-white rounded-tr-sm hover:bg-indigo-700'
          : 'bg-gray-100 text-gray-800 rounded-tl-sm hover:bg-gray-200'
      } transition`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isMe ? 'bg-white/20' : 'bg-indigo-100'
      }`}>
        {state === 'loading' ? (
          <Loader2 size={18} className={`animate-spin ${isMe ? 'text-white' : 'text-indigo-600'}`} />
        ) : state === 'ready' ? (
          <Check size={18} className={isMe ? 'text-white' : 'text-green-600'} />
        ) : (
          <FileText size={18} className={isMe ? 'text-white' : 'text-indigo-600'} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
          {state === 'idle' ? `${ext} · Bosing ↓` : state === 'loading' ? 'Yuklanmoqda...' : 'Ochish ↗'}
        </p>
      </div>
      {state === 'ready' ? (
        <ExternalLink size={14} className={`flex-shrink-0 ${isMe ? 'text-white/70' : 'text-gray-400'}`} />
      ) : (
        <Download size={14} className={`flex-shrink-0 ${isMe ? 'text-white/70' : 'text-gray-400'}`} />
      )}
    </div>
  );
}

// ── VOICE bubble (Telegram-style: tap to load, tap to play/pause) ────────────

function VoiceBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const src = msg.fileUrl ?? '';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle');
  const [progress, setProgress] = useState(0);     // 0..1
  const [duration, setDuration] = useState(0);      // seconds
  const [currentTime, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  // cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
  }, []);

  const tick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    setProgress(a.duration ? a.currentTime / a.duration : 0);
    if (!a.paused) rafRef.current = requestAnimationFrame(tick);
  }, []);

  const loadAudio = useCallback(() => {
    if (!src) return;
    setState('loading');
    const a = new Audio();
    a.preload = 'auto';
    a.src = src;
    a.addEventListener('canplaythrough', () => {
      setDuration(a.duration || 0);
      setState('ready');
    }, { once: true });
    a.addEventListener('error', () => setState('error'));
    a.addEventListener('ended', () => {
      setState('ready');
      setProgress(0);
      setCurrent(0);
      cancelAnimationFrame(rafRef.current);
    });
    audioRef.current = a;
    a.load();
  }, [src]);

  const handleTap = () => {
    if (state === 'idle' || state === 'error') {
      loadAudio();
      return;
    }
    if (state === 'loading') return;
    const a = audioRef.current;
    if (!a) return;
    if (state === 'playing') {
      a.pause();
      cancelAnimationFrame(rafRef.current);
      setState('ready');
    } else {
      a.play().then(() => {
        setState('playing');
        rafRef.current = requestAnimationFrame(tick);
      }).catch(() => setState('error'));
    }
  };

  // Waveform bars (static pattern)
  const bars = useMemo(() => {
    const pattern = [3, 5, 8, 6, 10, 7, 4, 9, 6, 11, 5, 8, 3, 7, 10, 6, 4, 9, 5, 7, 11, 8, 3, 6];
    return pattern;
  }, []);

  const fmtTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const displayTime = state === 'playing' || (state === 'ready' && currentTime > 0)
    ? fmtTime(currentTime)
    : fmtTime(duration);

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl shadow-sm min-w-[220px] max-w-[280px] cursor-pointer select-none ${
        isMe
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
      }`}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleTap()}
    >
      {/* Play/Pause/Download button */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${
        isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-100 hover:bg-indigo-200'
      }`}>
        {state === 'loading' ? (
          <Loader2 size={18} className={`animate-spin ${isMe ? 'text-white' : 'text-indigo-600'}`} />
        ) : state === 'playing' ? (
          <Pause size={18} className={isMe ? 'text-white' : 'text-indigo-600'} />
        ) : state === 'error' ? (
          <Download size={18} className={isMe ? 'text-white' : 'text-indigo-600'} />
        ) : (
          <Play size={18} className={`${isMe ? 'text-white' : 'text-indigo-600'} ml-0.5`} />
        )}
      </div>

      {/* Waveform + time */}
      <div className="flex-1 min-w-0">
        {/* Waveform bars */}
        <div className="flex items-end gap-[2px] h-[16px]">
          {bars.map((h, i) => {
            const pct = bars.length > 0 ? i / bars.length : 0;
            const isPlayed = progress > pct;
            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-colors duration-100 ${
                  isPlayed
                    ? isMe ? 'bg-white' : 'bg-indigo-600'
                    : isMe ? 'bg-white/30' : 'bg-gray-300'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        {/* Time */}
        <p className={`text-[11px] mt-0.5 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
          {state === 'idle' ? 'Bosing ▶' : state === 'loading' ? 'Yuklanmoqda...' : state === 'error' ? 'Xatolik · qayta urinish' : displayTime}
        </p>
      </div>
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

  const bottomRef     = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const mrRef         = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recStartRef   = useRef<number>(0); // Date.now() when recording started

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

  // ── text send ─────────────────────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || textMutation.isPending) return;
    textMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── file attach ───────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileMutation.mutate({ file, type: 'FILE' });
    e.target.value = '';
  };

  // ── voice recording ───────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mime    = bestAudioMime();
      const options = mime ? { mimeType: mime } : {};
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, options);
      } catch {
        // fallback: no options
        mr = new MediaRecorder(stream);
      }

      chunksRef.current = [];

      mr.addEventListener('dataavailable', (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      });

      mr.addEventListener('stop', () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        if (chunksRef.current.length === 0) {
          toast.error('Ovoz yozib bo\'lmadi — qurilmani tekshiring');
          setRecSec(0);
          return;
        }

        // Strip codec params so backend matches exactly: "audio/webm;codecs=opus" → "audio/webm"
        const rawMime   = mr.mimeType || mime || 'audio/webm';
        const cleanMime = rawMime.includes(';') ? rawMime.split(';')[0].trim() : rawMime;
        const ext  = mimeToExt(cleanMime);
        const blob = new Blob(chunksRef.current, { type: cleanMime });
        const file = new File([blob], `voice-${Date.now()}${ext}`, { type: cleanMime });
        fileMutation.mutate({ file, type: 'VOICE' });
        setRecSec(0);
      });

      mr.addEventListener('error', (ev) => {
        console.error('MediaRecorder error:', ev);
        toast.error('Ovoz yozishda xatolik');
        setIsRecording(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      });

      mr.start(100); // 100 ms chunks — more frequent, more reliable
      mrRef.current = mr;
      recStartRef.current = Date.now();
      setIsRecording(true);
      setRecSec(0);

      // tick every 500ms → calc from wall-clock, never drifts
      timerRef.current = setInterval(() => {
        setRecSec(Math.floor((Date.now() - recStartRef.current) / 1000));
      }, 500);

    } catch (err) {
      console.error('getUserMedia error:', err);
      toast.error('Mikrofonga ruxsat berilmadi yoki topilmadi');
    }
  };

  const stopRecording = () => {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // ── group messages by date ────────────────────────────────────────────────

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
              ? "Fayl · Rasm · Ovoz yuborishingiz mumkin"
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
                  const isMe   = msg.senderUsername === user?.username;
                  const type   = msg.messageType ?? 'TEXT';
                  const isImg  = type === 'FILE' && isImageFile(msg.fileName);

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex mb-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                        {/* Name + role (others only, not for image to save space) */}
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {msg.senderName || msg.senderUsername}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              ROLE_COLOR[msg.senderRole] ?? 'bg-gray-100 text-gray-500'
                            }`}>
                              {ROLE_LABEL[msg.senderRole] ?? msg.senderRole}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        {type === 'TEXT' && (
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          }`}>
                            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                          </div>
                        )}

                        {/* Image: no bubble padding — image IS the bubble */}
                        {isImg && <ImageBubble msg={msg} isMe={isMe} />}

                        {/* Doc file */}
                        {type === 'FILE' && !isImg && <DocBubble msg={msg} isMe={isMe} />}

                        {/* Voice */}
                        {type === 'VOICE' && <VoiceBubble msg={msg} isMe={isMe} />}

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
            <span className="text-sm text-red-600 font-bold">● Yozilmoqda… {recSec}s</span>
            <span className="text-xs text-gray-400 ml-1">
              (Mikrofon tugmasi → to'xtat va yuboriladi)
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">

          {/* Attach file – teacher/admin */}
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
                title="Rasm / PDF / Slayd biriktirish"
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
                : 'Xabar yozing… (Enter = yuborish)'
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

          {/* Mic – teacher/admin */}
          {canUpload && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isBusy && !isRecording}
              title={isRecording ? "To'xtatish va yuborish" : "Ovozli xabar"}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition flex-shrink-0 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600 disabled:opacity-40'
              }`}
            >
              {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          {/* Send text */}
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

        {/* Student hint */}
        {!canUpload && (
          <p className="text-[11px] text-gray-400 mt-2 px-1 flex items-center gap-1">
            <Image size={11} className="opacity-60" />
            Faqat matn — fayl va ovoz faqat o'qituvchi/admin uchun.
          </p>
        )}
      </div>
    </div>
  );
}
