import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentVocabulary, deleteVocabularyItem, createVocabularyItem, type VocabularyItem } from '../../api/vocabulary';
import { useAuth } from '../../contexts/AuthContext';
import { BookMarked, Trash2, Plus, X, Loader2, Shuffle, ArrowLeft, Eye, EyeOff, Search } from 'lucide-react';
import toast from 'react-hot-toast';

function parseSafeJson(str: string | undefined): string[] {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

export default function VocabularyPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'flashcard' | 'add'>('list');
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['vocabulary', studentId],
    queryFn: () => getStudentVocabulary(studentId),
    enabled: !!studentId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVocabularyItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', studentId] });
      toast.success("O'chirildi");
    },
  });

  const filtered = items.filter((item) =>
    item.word.toLowerCase().includes(search.toLowerCase()) ||
    item.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookMarked size={28} />
          <h1 className="text-2xl font-bold">Mening Lug'atim</h1>
        </div>
        <p className="text-amber-100 text-sm">Saqlangan so'zlar va flashcard mashqlari</p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-lg">{items.length} ta so'z</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'list' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <BookMarked size={14} className="inline mr-1.5" />So'zlar
        </button>
        <button
          onClick={() => setView('flashcard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'flashcard' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Shuffle size={14} className="inline mr-1.5" />Flashcard
        </button>
        <button
          onClick={() => setView('add')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === 'add' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Plus size={14} className="inline mr-1.5" />Qo'shish
        </button>
      </div>

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            {isLoading ? (
              <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                {search ? 'Hech narsa topilmadi' : "Hali so'z saqlanmagan. Lug'atdan so'z qidiring!"}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <WordRow key={item.itemId} item={item} onDelete={() => deleteMutation.mutate(item.itemId)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Flashcard view */}
      {view === 'flashcard' && (
        <FlashcardView items={items} onBack={() => setView('list')} />
      )}

      {/* Add view */}
      {view === 'add' && (
        <AddWordForm studentId={studentId} onDone={() => {
          setView('list');
          queryClient.invalidateQueries({ queryKey: ['vocabulary', studentId] });
        }} />
      )}
    </div>
  );
}

function WordRow({ item, onDelete }: { item: VocabularyItem; onDelete: () => void }) {
  const examples = parseSafeJson(item.examples);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start justify-between">
        <button onClick={() => setExpanded(!expanded)} className="text-left flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">{item.word}</span>
            {item.partOfSpeech && (
              <span className="text-xs text-gray-400 italic">{item.partOfSpeech}</span>
            )}
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{item.langPair}</span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{item.translation}</p>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 transition flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && examples.length > 0 && (
        <ul className="mt-2 space-y-1 pl-3 border-l-2 border-amber-200">
          {examples.map((ex, i) => (
            <li key={i} className="text-xs text-gray-500">{ex}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FlashcardView({ items, onBack }: { items: VocabularyItem[]; onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [shuffled, setShuffled] = useState<VocabularyItem[]>([]);

  const cards = shuffled.length > 0 ? shuffled : items;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
        Flashcard uchun kamida 1 ta so'z kerak
      </div>
    );
  }

  const current = cards[idx % cards.length];

  const handleShuffle = () => {
    const copy = [...items].sort(() => Math.random() - 0.5);
    setShuffled(copy);
    setIdx(0);
    setShowTranslation(false);
  };

  const handleNext = () => {
    setIdx((prev) => (prev + 1) % cards.length);
    setShowTranslation(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium">
          <ArrowLeft size={14} /> Orqaga
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{idx + 1} / {cards.length}</span>
          <button onClick={handleShuffle} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition">
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => setShowTranslation(!showTranslation)}
        className="bg-white rounded-2xl border-2 border-gray-200 hover:border-amber-300 p-10 text-center cursor-pointer transition min-h-[200px] flex flex-col items-center justify-center"
      >
        <p className="text-2xl font-bold text-gray-900 mb-2">{current.word}</p>
        {current.pronunciation && <p className="text-sm text-gray-400 mb-3">{current.pronunciation}</p>}
        {showTranslation ? (
          <div className="mt-2">
            <p className="text-xl text-amber-700 font-semibold">{current.translation}</p>
            <Eye size={16} className="mx-auto mt-3 text-gray-300" />
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1.5 text-gray-300">
            <EyeOff size={16} /> <span className="text-sm">bosing</span>
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm transition"
      >
        Keyingi so'z
      </button>
    </div>
  );
}

function AddWordForm({ studentId, onDone }: { studentId: string; onDone: () => void }) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [langPair, setLangPair] = useState('en-uz');

  const createMutation = useMutation({
    mutationFn: () => createVocabularyItem({ studentId, word, translation, langPair }),
    onSuccess: () => {
      toast.success("So'z qo'shildi!");
      onDone();
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Yangi so'z</h3>
        <button onClick={onDone} className="p-1.5 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">So'z</label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            placeholder="apple"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tarjima</label>
          <input
            type="text"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            placeholder="olma"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Til juftligi</label>
          <select
            value={langPair}
            onChange={(e) => setLangPair(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          >
            <option value="en-uz">ENG → UZB</option>
            <option value="uz-en">UZB → ENG</option>
            <option value="en-ru">ENG → RUS</option>
            <option value="ru-en">RUS → ENG</option>
          </select>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !word.trim() || !translation.trim()}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-2.5 rounded-xl text-sm transition"
        >
          {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Qo'shish
        </button>
      </div>
    </div>
  );
}
