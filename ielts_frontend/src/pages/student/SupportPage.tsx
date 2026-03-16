import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getFaqs, getMyTickets, createTicket, getTicketMessages, sendTicketMessage } from '../../api/support';
import { getStudent } from '../../api/students';
import { HelpCircle, MessageCircle, Send, ChevronDown, ChevronRight, Plus, ArrowLeft, Loader2, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const queryClient = useQueryClient();
  const [view, setView] = useState<'faq' | 'tickets' | 'new' | 'chat'>('faq');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['myTickets', studentId],
    queryFn: () => getMyTickets(studentId),
    enabled: !!studentId,
  });

  const openTickets = tickets.filter((t) => t.status !== 'CLOSED');

  const isPending = user?.active === false;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Pending student welcome banner */}
      {isPending && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-amber-800 mb-1">Xush kelibsiz, {user?.username}!</h2>
          <p className="text-amber-700 text-sm">
            Hisobingiz admin tomonidan ko'rib chiqilmoqda. Qabul qilinguncha qiziqtirgan savollaringizni
            quyida yozishingiz mumkin. Javob tez orada beriladi.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle size={28} />
          <h1 className="text-2xl font-bold">Yordam Markazi</h1>
        </div>
        <p className="text-cyan-100 text-sm">Savollaringiz bormi? FAQ ni ko'ring yoki savolingizni yozing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setView('faq'); setSelectedTicketId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'faq' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <HelpCircle size={14} className="inline mr-1.5" />FAQ
        </button>
        <button
          onClick={() => { setView('tickets'); setSelectedTicketId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'tickets' || view === 'chat' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <MessageCircle size={14} className="inline mr-1.5" />
          Murojaatlarim {openTickets.length > 0 && `(${openTickets.length})`}
        </button>
        <button
          onClick={() => setView('new')}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={14} /> Savol yozish
        </button>
      </div>

      {/* FAQ */}
      {view === 'faq' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {faqs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Hali FAQ qo'shilmagan</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {faqs.map((faq) => (
                <FaqItem key={faq.faqId} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tickets list */}
      {view === 'tickets' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {tickets.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Hali murojaat yo'q</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((t) => (
                <button
                  key={t.ticketId}
                  onClick={() => { setSelectedTicketId(t.ticketId); setView('chat'); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
                >
                  <TicketStatusIcon status={t.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <TicketStatusBadge status={t.status} />
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat with ticket */}
      {view === 'chat' && selectedTicketId && (
        <TicketChat
          ticketId={selectedTicketId}
          studentName={student?.fullName ?? user?.username ?? ''}
          onBack={() => { setView('tickets'); setSelectedTicketId(null); refetchTickets(); }}
        />
      )}

      {/* New ticket */}
      {view === 'new' && (
        <NewTicketForm
          studentId={studentId}
          studentName={student?.fullName ?? user?.username ?? ''}
          onDone={() => {
            setView('tickets');
            queryClient.invalidateQueries({ queryKey: ['myTickets', studentId] });
          }}
          onCancel={() => setView('faq')}
        />
      )}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        {open ? <ChevronDown size={16} className="text-cyan-500 mt-0.5 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
        <span className="text-sm font-medium text-gray-800">{question}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 pl-12">
          <p className="text-sm text-gray-600 leading-relaxed bg-cyan-50 rounded-lg p-3">{answer}</p>
        </div>
      )}
    </div>
  );
}

function TicketChat({ ticketId, studentName, onBack }: { ticketId: string; studentName: string; onBack: () => void }) {
  const [text, setText] = useState('');

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: () => getTicketMessages(ticketId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendTicketMessage(ticketId, { senderRole: 'STUDENT', senderName: studentName, content: text.trim() }),
    onSuccess: () => { setText(''); refetch(); },
    onError: () => toast.error('Xabar yuborishda xatolik'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-gray-400 hover:text-gray-600"><ArrowLeft size={16} /></button>
        <span className="text-sm font-medium text-gray-700">Murojaat</span>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.messageId} className={`flex ${m.senderRole === 'STUDENT' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              m.senderRole === 'STUDENT'
                ? 'bg-cyan-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              {m.senderRole === 'STAFF' && (
                <p className="text-xs font-semibold mb-0.5 text-cyan-600">{m.senderName}</p>
              )}
              <p className="text-sm leading-relaxed">{m.content}</p>
              <p className={`text-xs mt-1 ${m.senderRole === 'STUDENT' ? 'text-cyan-200' : 'text-gray-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) sendMutation.mutate(); }}
        />
        <button
          onClick={() => sendMutation.mutate()}
          disabled={!text.trim() || sendMutation.isPending}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-xl transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function NewTicketForm({ studentId, studentName, onDone, onCancel }: { studentId: string; studentName: string; onDone: () => void; onCancel: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => createTicket({ studentId, studentName, subject, message }),
    onSuccess: () => { toast.success('Murojaat yuborildi!'); onDone(); },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Yangi murojaat</h3>
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mavzu</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Masalan: Kurs haqida savol"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Xabar</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Savolingizni batafsil yozing..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
          />
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!subject.trim() || !message.trim() || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-medium py-2.5 rounded-xl text-sm transition"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Yuborish
        </button>
      </div>
    </div>
  );
}

function TicketStatusIcon({ status }: { status: string }) {
  if (status === 'ANSWERED') return <CheckCircle size={18} className="text-green-500" />;
  if (status === 'CLOSED') return <X size={18} className="text-gray-400" />;
  return <Clock size={18} className="text-orange-500" />;
}

function TicketStatusBadge({ status }: { status: string }) {
  if (status === 'ANSWERED') return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Javob berildi</span>;
  if (status === 'CLOSED') return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Yopilgan</span>;
  return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">Kutilmoqda</span>;
}
