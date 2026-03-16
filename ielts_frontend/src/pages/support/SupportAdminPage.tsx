import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getAllTickets, getTicketMessages, sendTicketMessage, closeTicket, getFaqs, createFaq, deleteFaq, type SupportTicket } from '../../api/support';
import { HelpCircle, MessageCircle, Send, ArrowLeft, Loader2, CheckCircle, Clock, X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportAdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'tickets' | 'faq'>('tickets');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['allTickets', statusFilter],
    queryFn: () => getAllTickets(statusFilter || undefined),
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Yordam Markazi</h1>
          <p className="text-sm text-gray-500">Talabalar murojaatlari va FAQ boshqaruvi</p>
        </div>
        {openCount > 0 && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
            {openCount} ta yangi
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setTab('tickets'); setSelectedTicketId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'tickets' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <MessageCircle size={14} className="inline mr-1.5" />Murojaatlar
        </button>
        <button
          onClick={() => { setTab('faq'); setSelectedTicketId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'faq' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <HelpCircle size={14} className="inline mr-1.5" />FAQ
        </button>
      </div>

      {/* Tickets */}
      {tab === 'tickets' && !selectedTicketId && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 mb-4">
            {[
              { v: '', l: 'Hammasi' },
              { v: 'OPEN', l: 'Yangi' },
              { v: 'ANSWERED', l: 'Javob berilgan' },
              { v: 'CLOSED', l: 'Yopilgan' },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setStatusFilter(f.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === f.v ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            {isLoading ? (
              <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Murojaatlar yo'q</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <button
                    key={t.ticketId}
                    onClick={() => setSelectedTicketId(t.ticketId)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <StatusIcon status={t.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.subject}</p>
                      <p className="text-xs text-gray-400">{t.studentName} — {new Date(t.createdAt).toLocaleDateString('uz-UZ')}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Ticket chat */}
      {tab === 'tickets' && selectedTicketId && (
        <AdminTicketChat
          ticketId={selectedTicketId}
          ticket={tickets.find((t) => t.ticketId === selectedTicketId)}
          senderName={user?.username ?? 'Admin'}
          onBack={() => {
            setSelectedTicketId(null);
            queryClient.invalidateQueries({ queryKey: ['allTickets'] });
          }}
        />
      )}

      {/* FAQ management */}
      {tab === 'faq' && <FaqManager />}
    </div>
  );
}

function AdminTicketChat({ ticketId, ticket, senderName, onBack }: { ticketId: string; ticket?: SupportTicket; senderName: string; onBack: () => void }) {
  const [text, setText] = useState('');

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: () => getTicketMessages(ticketId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendTicketMessage(ticketId, { senderRole: 'STAFF', senderName, content: text.trim() }),
    onSuccess: () => { setText(''); refetch(); },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(ticketId),
    onSuccess: () => { toast.success('Murojaat yopildi'); onBack(); },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-gray-400 hover:text-gray-600"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700">{ticket?.subject}</span>
          <span className="text-xs text-gray-400 ml-2">{ticket?.studentName}</span>
        </div>
        {ticket?.status !== 'CLOSED' && (
          <button
            onClick={() => closeMutation.mutate()}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
          >
            Yopish
          </button>
        )}
      </div>

      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {messages.map((m) => (
          <div key={m.messageId} className={`flex ${m.senderRole === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              m.senderRole === 'STAFF'
                ? 'bg-indigo-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              <p className={`text-xs font-semibold mb-0.5 ${m.senderRole === 'STAFF' ? 'text-indigo-200' : 'text-gray-500'}`}>
                {m.senderName}
              </p>
              <p className="text-sm leading-relaxed">{m.content}</p>
              <p className={`text-xs mt-1 ${m.senderRole === 'STAFF' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {ticket?.status !== 'CLOSED' && (
        <div className="px-4 py-3 border-t flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Javob yozing..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) sendMutation.mutate(); }}
          />
          <button
            onClick={() => sendMutation.mutate()}
            disabled={!text.trim() || sendMutation.isPending}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function FaqManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  const createMutation = useMutation({
    mutationFn: () => createFaq({ question, answer, sortOrder: faqs.length + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setQuestion(''); setAnswer(''); setShowForm(false);
      toast.success('FAQ qo\'shildi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faqs'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase">Eng ko'p beriladigan savollar</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
        >
          <Plus size={12} /> Qo'shish
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Savol"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Javob"
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Bekor</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!question.trim() || !answer.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition"
            >
              Saqlash
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {faqs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Hali FAQ yo'q</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <FaqAdminItem key={faq.faqId} faq={faq} onDelete={() => deleteMutation.mutate(faq.faqId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FaqAdminItem({ faq, onDelete }: { faq: any; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button onClick={() => setOpen(!open)} className="flex-1 text-left flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-indigo-500" /> : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-sm font-medium text-gray-800">{faq.question}</span>
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 transition">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="px-5 pb-3 pl-12">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'ANSWERED') return <CheckCircle size={18} className="text-green-500" />;
  if (status === 'CLOSED') return <X size={18} className="text-gray-400" />;
  return <Clock size={18} className="text-orange-500" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ANSWERED') return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Javob berildi</span>;
  if (status === 'CLOSED') return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Yopilgan</span>;
  return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium animate-pulse">Yangi</span>;
}
