import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { lookupWord, type DictionaryResponse } from '../../api/ai';
import { createVocabularyItem } from '../../api/vocabulary';
import { useAuth } from '../../contexts/AuthContext';
import { Search, BookOpen, Volume2, Plus, Check, Loader2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const LANG_PAIRS = [
  { value: 'en-uz', label: 'ENG → UZB' },
  { value: 'uz-en', label: 'UZB → ENG' },
  { value: 'en-ru', label: 'ENG → RUS' },
  { value: 'ru-en', label: 'RUS → ENG' },
];

export default function DictionaryPage() {
  const { user } = useAuth();
  const studentId = user?.studentId ?? '';
  const [word, setWord] = useState('');
  const [langPair, setLangPair] = useState('en-uz');
  const [result, setResult] = useState<DictionaryResponse | null>(null);
  const [saved, setSaved] = useState(false);

  const searchMutation = useMutation({
    mutationFn: () => lookupWord(word.trim(), langPair),
    onSuccess: (data) => {
      setResult(data);
      setSaved(false);
    },
    onError: () => toast.error("So'zni qidirishda xatolik yuz berdi"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createVocabularyItem({
        studentId,
        word: result!.word,
        translation: result!.translation,
        langPair,
        pronunciation: result!.pronunciation,
        partOfSpeech: result!.partOfSpeech,
        examples: JSON.stringify(result!.examples),
      }),
    onSuccess: () => {
      setSaved(true);
      toast.success("Lug'atga saqlandi!");
    },
    onError: () => toast.error('Saqlashda xatolik'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    searchMutation.mutate();
  };

  const swapLang = () => {
    const map: Record<string, string> = {
      'en-uz': 'uz-en', 'uz-en': 'en-uz',
      'en-ru': 'ru-en', 'ru-en': 'en-ru',
    };
    setLangPair(map[langPair] ?? 'en-uz');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={28} />
          <h1 className="text-2xl font-bold">AI Lug'at</h1>
        </div>
        <p className="text-emerald-100 text-sm">So'zlarni qidiring, tarjimasini oling va lug'atingizga saqlang</p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Language selector */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              {LANG_PAIRS.map((lp) => (
                <button
                  key={lp.value}
                  type="button"
                  onClick={() => setLangPair(lp.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    langPair === lp.value
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {lp.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={swapLang}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition"
              title="Tillarni almashtirish"
            >
              <ArrowRightLeft size={14} />
            </button>
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="So'z kiriting..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searchMutation.isPending || !word.trim()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition"
            >
              {searchMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Qidirish
            </button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Word header */}
          <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{result.word}</h2>
                {result.pronunciation && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Volume2 size={13} /> {result.pronunciation}
                  </p>
                )}
                {result.partOfSpeech && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                    {result.partOfSpeech}
                  </span>
                )}
              </div>
              {studentId && (
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saved || saveMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    saved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {saved ? (
                    <><Check size={14} /> Saqlandi</>
                  ) : saveMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <><Plus size={14} /> Saqlash</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Translation */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Tarjima</h3>
            <p className="text-lg font-semibold text-gray-800">{result.translation}</p>
          </div>

          {/* Examples */}
          {result.examples && result.examples.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Misollar</h3>
              <ul className="space-y-2">
                {result.examples.map((ex, i) => (
                  <li key={i} className="text-sm text-gray-700 pl-3 border-l-2 border-emerald-200">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Synonyms */}
          {result.synonyms && result.synonyms.length > 0 && (
            <div className="px-5 py-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Sinonimlar</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.synonyms.map((syn, i) => (
                  <button
                    key={i}
                    onClick={() => { setWord(syn); searchMutation.mutate(); }}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-md text-sm transition cursor-pointer"
                  >
                    {syn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !searchMutation.isPending && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Qidirish uchun so'z kiriting</p>
          <p className="text-xs mt-1">AI tarjima, misollar va sinonimlarni topadi</p>
        </div>
      )}
    </div>
  );
}
