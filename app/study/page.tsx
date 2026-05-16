"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import {
  Volume2, Search, Filter, ChevronRight, ChevronLeft,
  Check, X, Zap, BookOpen, MessageSquare, Layers,
  Play, RotateCcw, Star, Trophy, Eye, EyeOff, SlidersHorizontal
} from "lucide-react";

type Tab = "words" | "sentences" | "flashcards" | "quiz" | "grammar";
type Level = "all" | "A1" | "A2" | "B1" | "B2" | "C1";

/* ─── Pronunciation ─────────────────────────────────────────────────── */
function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

/* ─── SpeakButton ────────────────────────────────────────────────────── */
function SpeakButton({ text, size = 16 }: { text: string; size?: number }) {
  const [active, setActive] = useState(false);
  const handle = () => {
    setActive(true);
    speak(text);
    setTimeout(() => setActive(false), 1500);
  };
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { e.stopPropagation(); handle(); }}
      className="flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
      style={{
        width: size + 16, height: size + 16,
        background: active ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.1)",
        border: `1px solid ${active ? "rgba(168,85,247,0.7)" : "rgba(168,85,247,0.25)"}`,
      }}
    >
      <AnimatePresence mode="wait">
        {active ? (
          <motion.div key="wave" className="flex items-end gap-0.5 h-4">
            {[0, 0.1, 0.2, 0.1, 0].map((d, i) => (
              <motion.div key={i} className="w-0.5 rounded-full bg-purple-400"
                animate={{ height: ["4px", "14px", "4px"] }}
                transition={{ duration: 0.5, delay: d, repeat: Infinity }} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Volume2 size={size} className="text-purple-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Phonetic badge ─────────────────────────────────────────────────── */
function Phonetic({ text }: { text: string }) {
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded-md"
      style={{ background: "rgba(6,182,212,0.1)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" }}>
      {text}
    </span>
  );
}

/* ─── Level badge ────────────────────────────────────────────────────── */
const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#06b6d4", B1: "#3b82f6", B2: "#8b5cf6", C1: "#ec4899",
};
function LevelBadge({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] || "#6b7280";
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}>
      {level}
    </span>
  );
}

/* ─── Grammar data (inline, always available) ─────────────────────────── */
const grammarTopics = [
  {
    id: 1, title: "Present Simple", level: "A1", desc: "Настоящее простое время",
    explanation: "Используется для регулярных действий, фактов и расписаний.",
    structure: "Subject + V1 (he/she/it + V1+s)",
    examples: [
      { en: "I work every day.", ru: "Я работаю каждый день." },
      { en: "She lives in New York.", ru: "Она живёт в Нью-Йорке." },
      { en: "They don't speak French.", ru: "Они не говорят по-французски." },
      { en: "Does he have insurance?", ru: "У него есть страховка?" },
    ],
    tip: "❗ После he/she/it добавь -s: works, lives, speaks. В вопросах: Do/Does + subject + V1",
  },
  {
    id: 2, title: "Present Continuous", level: "A2", desc: "Настоящее длительное",
    explanation: "Для действий, происходящих прямо сейчас, или запланированных событий.",
    structure: "Subject + am/is/are + V+ing",
    examples: [
      { en: "I am waiting for the doctor.", ru: "Я жду врача." },
      { en: "She is filling out the form.", ru: "Она заполняет форму." },
      { en: "We are moving next month.", ru: "Мы переезжаем в следующем месяце." },
      { en: "Are they checking in?", ru: "Они регистрируются?" },
    ],
    tip: "💡 Слова-маркеры: now, right now, at the moment, currently, look/listen!",
  },
  {
    id: 3, title: "Past Simple", level: "A2", desc: "Прошедшее простое",
    explanation: "Для завершённых действий в прошлом с конкретным временем.",
    structure: "Subject + V2 (regular: +ed / irregular: memorize)",
    examples: [
      { en: "I missed my flight.", ru: "Я пропустил рейс." },
      { en: "She called the ambulance.", ru: "Она вызвала скорую помощь." },
      { en: "We signed the contract.", ru: "Мы подписали договор." },
      { en: "Did you find the apartment?", ru: "Ты нашёл квартиру?" },
    ],
    tip: "⚡ Правильные: +ed (worked, lived). Неправильные: go→went, get→got, have→had, say→said",
  },
  {
    id: 4, title: "Present Perfect", level: "B1", desc: "Настоящее совершённое",
    explanation: "Прошлое действие с результатом в настоящем. Неважно когда — важно что сейчас.",
    structure: "Subject + have/has + V3 (past participle)",
    examples: [
      { en: "I have lost my passport.", ru: "Я потерял паспорт (и сейчас его нет)." },
      { en: "Have you ever lived abroad?", ru: "Ты когда-нибудь жил за рубежом?" },
      { en: "She has already signed the lease.", ru: "Она уже подписала договор аренды." },
      { en: "We haven't received the documents yet.", ru: "Мы ещё не получили документы." },
    ],
    tip: "🎯 Маркеры: already, just, yet, never, ever, recently, since, for. Никогда не использовать с конкретным временем!",
  },
  {
    id: 5, title: "Future: Will / Going to", level: "B1", desc: "Будущее время",
    explanation: "Will — спонтанные решения и предсказания. Going to — планы и намерения.",
    structure: "will + V1 | am/is/are + going to + V1",
    examples: [
      { en: "I'll call you back in five minutes.", ru: "Я перезвоню через пять минут." },
      { en: "We're going to sign the lease tomorrow.", ru: "Мы собираемся подписать договор завтра." },
      { en: "It will be ready by Thursday.", ru: "Это будет готово к четвергу." },
      { en: "Are you going to apply for a visa?", ru: "Ты собираешься подавать на визу?" },
    ],
    tip: "🔮 Will = решение прямо сейчас (I'll take it!). Going to = уже запланировано (We're going to move).",
  },
  {
    id: 6, title: "Modal Verbs", level: "B1", desc: "Модальные глаголы",
    explanation: "Выражают возможность, обязанность, разрешение, совет.",
    structure: "Subject + modal + V1 (без to)",
    examples: [
      { en: "You must show your ID.", ru: "Ты обязан показать удостоверение личности." },
      { en: "Can I speak to the manager?", ru: "Могу я поговорить с менеджером?" },
      { en: "You should see a doctor.", ru: "Тебе следует обратиться к врачу." },
      { en: "May I take a seat?", ru: "Можно мне присесть?" },
    ],
    tip: "📋 can/could (возможность) · must/have to (обязанность) · should/ought to (совет) · may/might (разрешение/вероятность)",
  },
  {
    id: 7, title: "Conditionals Type 1 & 2", level: "B2", desc: "Условные предложения",
    explanation: "Type 1 — реальные условия. Type 2 — нереальные/гипотетические.",
    structure: "Type 1: If + Present → will + V1 | Type 2: If + Past → would + V1",
    examples: [
      { en: "If you have insurance, it's free.", ru: "Если у вас есть страховка, это бесплатно." },
      { en: "If I were you, I would call a lawyer.", ru: "На твоём месте я бы позвонил адвокату." },
      { en: "If she passes the test, she'll get the job.", ru: "Если она сдаст тест, она получит работу." },
      { en: "If we had more time, we would visit the embassy.", ru: "Если бы у нас было больше времени, мы бы посетили посольство." },
    ],
    tip: "⚡ Type 1: реально возможно. Type 2: маловероятно или нереально. Type 2 использует were для всех лиц (If I were, If he were).",
  },
  {
    id: 8, title: "Passive Voice", level: "B2", desc: "Пассивный залог",
    explanation: "Когда важно что произошло, а не кто это сделал.",
    structure: "Subject + am/is/are/was/were + V3 (by + agent — необязательно)",
    examples: [
      { en: "The form must be submitted online.", ru: "Форму нужно подать онлайн." },
      { en: "My application was rejected.", ru: "Моя заявка была отклонена." },
      { en: "The documents are being processed.", ru: "Документы обрабатываются." },
      { en: "You will be contacted by email.", ru: "С вами свяжутся по электронной почте." },
    ],
    tip: "💼 Часто используется в официальных документах, объявлениях, новостях. Показывает процесс без указания исполнителя.",
  },
];

/* ─── Word card component ─────────────────────────────────────────────── */
function WordCard({ word, index }: { word: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      onClick={() => setExpanded(!expanded)}
      className="glass-card rounded-xl p-4 cursor-pointer transition-all"
      style={{
        border: expanded ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.07)",
        background: expanded ? "rgba(168,85,247,0.07)" : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-white">{word.en}</span>
            {word.phonetic && <Phonetic text={word.phonetic} />}
            <LevelBadge level={word.level} />
          </div>
          <div className="text-gray-400 text-sm mt-0.5">{word.ru}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SpeakButton text={word.en} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0 pt-0.5">Пример:</span>
                <span className="text-sm text-gray-300 italic flex-1">"{word.example}"</span>
                <SpeakButton text={word.example} size={14} />
              </div>
              {word.topic && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                    {word.topic}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function StudyPage() {
  const [tab, setTab] = useState<Tab>("words");
  const [levelFilter, setLevelFilter] = useState<Level>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [wordsData, setWordsData] = useState<any[]>([]);
  const [sentencesData, setSentencesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [showPhonetic, setShowPhonetic] = useState(true);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizOptions, setQuizOptions] = useState<any[]>([]);

  // Grammar state
  const [expandedGrammar, setExpandedGrammar] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      import("@/data/words").then((m) => m.words).catch(() => []),
      import("@/data/sentences").then((m) => m.sentences).catch(() => []),
    ]).then(([w, s]) => {
      setWordsData(w);
      setSentencesData(s);
      setLoading(false);
    });
  }, []);

  const topics = ["all", ...Array.from(new Set(wordsData.map((w) => w.topic))).sort()];
  const sentenceTopics = ["all", ...Array.from(new Set(sentencesData.map((s) => s.topic))).sort()];

  const filteredWords = wordsData.filter((w) => {
    const ml = levelFilter === "all" || w.level === levelFilter;
    const mt = topicFilter === "all" || w.topic === topicFilter;
    const ms = !search || w.en.toLowerCase().includes(search.toLowerCase()) || w.ru.toLowerCase().includes(search.toLowerCase());
    return ml && mt && ms;
  });

  const filteredSentences = sentencesData.filter((s) => {
    const ml = levelFilter === "all" || s.level === levelFilter;
    const mt = topicFilter === "all" || s.topic === topicFilter;
    const ms = !search || s.en.toLowerCase().includes(search.toLowerCase()) || s.ru.toLowerCase().includes(search.toLowerCase());
    return ml && mt && ms;
  });

  const flashcardPool = wordsData.filter((w) => !learned.has(w.id));
  const currentCard = flashcardPool[cardIndex % Math.max(flashcardPool.length, 1)];

  // Build quiz options whenever quizIndex changes
  const buildOptions = useCallback((idx: number) => {
    if (!wordsData.length) return;
    const correct = wordsData[idx % wordsData.length];
    const others = wordsData.filter((w) => w.id !== correct.id)
      .sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [...others, correct].sort(() => Math.random() - 0.5);
    setQuizOptions(opts);
  }, [wordsData]);

  useEffect(() => {
    if (tab === "quiz" && wordsData.length) {
      buildOptions(quizIndex);
    }
  }, [tab, quizIndex, wordsData, buildOptions]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { key: "words", label: "Словарь", icon: BookOpen, color: "#a855f7" },
    { key: "sentences", label: "Предложения", icon: MessageSquare, color: "#3b82f6" },
    { key: "flashcards", label: "Карточки", icon: Layers, color: "#10b981" },
    { key: "quiz", label: "Квиз", icon: Zap, color: "#f59e0b" },
    { key: "grammar", label: "Грамматика", icon: Star, color: "#ec4899" },
  ];

  const levels: Level[] = ["all", "A1", "A2", "B1", "B2", "C1"];

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-purple-400 border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-5xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Учёба 📚</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="text-purple-400 font-bold">{wordsData.length} слов</span>
            <span>·</span>
            <span className="text-blue-400 font-bold">{sentencesData.length} предложений</span>
            <span>·</span>
            <span className="text-green-400 font-bold">{learned.size} выучено</span>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <motion.button
                key={t.key}
                onClick={() => setTab(t.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0 transition-all"
                style={active
                  ? { background: `${t.color}25`, border: `1px solid ${t.color}55`, color: t.color, boxShadow: `0 0 15px ${t.color}33` }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }
                }
              >
                <Icon size={15} />
                {t.label}
              </motion.button>
            );
          })}
        </div>

        {/* Filters (shared for words + sentences) */}
        {(tab === "words" || tab === "sentences") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-5">
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2 flex-1 min-w-48">
                <Search size={15} className="text-gray-500 flex-shrink-0" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={tab === "words" ? "Поиск слов..." : "Поиск фраз..."}
                  className="bg-transparent text-white placeholder-gray-600 text-sm outline-none flex-1" />
                {search && (
                  <button onClick={() => setSearch("")}><X size={14} className="text-gray-500 hover:text-white" /></button>
                )}
              </div>
              <div className="flex gap-1 glass-card rounded-xl p-1">
                {levels.map((l) => (
                  <button key={l} onClick={() => setLevelFilter(l)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={levelFilter === l
                      ? { background: LEVEL_COLORS[l] ? `${LEVEL_COLORS[l]}33` : "rgba(168,85,247,0.3)", color: LEVEL_COLORS[l] || "#c084fc" }
                      : { color: "#6b7280" }
                    }>
                    {l === "all" ? "Все" : l}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic pills */}
            <div className="flex gap-2 flex-wrap">
              {(tab === "words" ? topics : sentenceTopics).slice(0, 16).map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={topicFilter === t
                    ? { background: "rgba(168,85,247,0.25)", border: "1px solid rgba(168,85,247,0.5)", color: "#c084fc" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }
                  }>
                  {t === "all" ? "Все темы" : t}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Words tab ───────────────────────────────────────────────────── */}
        {tab === "words" && (
          <AnimatePresence mode="wait">
            <motion.div key="words" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-xs text-gray-500 mb-3">{filteredWords.length} слов найдено</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {filteredWords.slice(0, 200).map((word, i) => (
                  <WordCard key={word.id} word={word} index={i} />
                ))}
              </div>
              {filteredWords.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-gray-500">Ничего не найдено. Измени фильтры.</div>
                </div>
              )}
              {filteredWords.length > 200 && (
                <div className="text-center mt-6 text-sm text-gray-500">
                  Показано 200 из {filteredWords.length}. Уточни поиск для просмотра остальных.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Sentences tab ───────────────────────────────────────────────── */}
        {tab === "sentences" && (
          <AnimatePresence mode="wait">
            <motion.div key="sentences" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-xs text-gray-500 mb-3">{filteredSentences.length} предложений найдено</div>
              <div className="space-y-2">
                {filteredSentences.slice(0, 200).map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <LevelBadge level={s.level} />
                          {s.situation && (
                            <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.05)" }}>
                              {s.situation}
                            </span>
                          )}
                        </div>
                        <div className="text-white font-medium text-sm mb-1">{s.en}</div>
                        <div className="text-gray-400 text-sm">{s.ru}</div>
                      </div>
                      <SpeakButton text={s.en} />
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredSentences.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-gray-500">Ничего не найдено.</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Flashcards tab ──────────────────────────────────────────────── */}
        {tab === "flashcards" && (
          <AnimatePresence mode="wait">
            <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center">

              {/* Controls */}
              <div className="flex items-center gap-3 mb-6 w-full max-w-md justify-between">
                <div className="text-sm text-gray-400">
                  Осталось: <span className="text-white font-bold">{flashcardPool.length}</span> ·
                  Выучено: <span className="text-green-400 font-bold">{learned.size}</span>
                </div>
                <button
                  onClick={() => setShowPhonetic(!showPhonetic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass-card"
                  style={{ color: showPhonetic ? "#c084fc" : "#6b7280" }}
                >
                  {showPhonetic ? <Eye size={13} /> : <EyeOff size={13} />}
                  Транскрипция
                </button>
              </div>

              {flashcardPool.length > 0 && currentCard ? (
                <>
                  {/* Progress bar */}
                  <div className="w-full max-w-md h-1.5 bg-dark-600 rounded-full mb-5 overflow-hidden">
                    <motion.div className="h-full xp-bar rounded-full"
                      animate={{ width: `${(learned.size / Math.max(wordsData.length, 1)) * 100}%` }} />
                  </div>

                  {/* Card */}
                  <div className="w-full max-w-md" style={{ perspective: 1200 }}>
                    <motion.div
                      key={currentCard.id + (cardFlipped ? "-back" : "-front")}
                      initial={{ rotateY: cardFlipped ? -180 : 0, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      onClick={() => {
                        setCardFlipped(!cardFlipped);
                        if (!cardFlipped) speak(currentCard.en);
                      }}
                      className="h-64 rounded-3xl cursor-pointer select-none flex flex-col items-center justify-center p-8 text-center relative"
                      style={{
                        background: cardFlipped
                          ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,182,212,0.18))"
                          : "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.18))",
                        border: `1px solid ${cardFlipped ? "rgba(16,185,129,0.45)" : "rgba(168,85,247,0.45)"}`,
                        boxShadow: cardFlipped
                          ? "0 0 40px rgba(16,185,129,0.2)"
                          : "0 0 40px rgba(168,85,247,0.2)",
                      }}
                    >
                      {/* Topic label */}
                      <div className="absolute top-4 left-4">
                        <span className="text-xs text-gray-500">{currentCard.topic}</span>
                      </div>

                      {/* Level */}
                      <div className="absolute top-4 right-4">
                        <LevelBadge level={currentCard.level} />
                      </div>

                      {!cardFlipped ? (
                        <>
                          <motion.div
                            key="en"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black text-white mb-3"
                          >
                            {currentCard.en}
                          </motion.div>
                          {showPhonetic && currentCard.phonetic && (
                            <div className="mb-3"><Phonetic text={currentCard.phonetic} /></div>
                          )}
                          <div className="text-gray-400 text-sm">Нажми, чтобы увидеть перевод</div>
                          <div className="absolute bottom-4 right-4" onClick={(e) => { e.stopPropagation(); speak(currentCard.en); }}>
                            <SpeakButton text={currentCard.en} />
                          </div>
                        </>
                      ) : (
                        <motion.div key="ru" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center">
                          <div className="text-3xl font-bold text-white mb-2">{currentCard.ru}</div>
                          <div className="text-gray-400 text-sm italic mb-3 text-center">
                            "{currentCard.example}"
                          </div>
                          <div onClick={(e) => { e.stopPropagation(); speak(currentCard.example); }}>
                            <SpeakButton text={currentCard.example} />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-4 mt-6">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setCardFlipped(false); setCardIndex((p) => (p + 1) % flashcardPool.length); }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-gray-300 glass-card">
                      <ChevronRight size={16} />
                      Пропустить
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setLearned((p) => new Set(p).add(currentCard.id));
                        setCardFlipped(false);
                        setCardIndex((p) => Math.max(0, Math.min(p, flashcardPool.length - 2)));
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white btn-glow-green">
                      <Check size={16} />
                      Выучил!
                    </motion.button>
                  </div>

                  <div className="mt-4 text-xs text-gray-600">Нажми на карточку для перевода · Слушай произношение</div>
                </>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12">
                  <motion.div className="text-7xl mb-5" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1 }}>
                    🎉
                  </motion.div>
                  <div className="text-2xl font-black text-white mb-2">Все слова выучены!</div>
                  <div className="text-gray-400 mb-6">Ты выучил {learned.size} слов. Потрясающе!</div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setLearned(new Set()); setCardIndex(0); }}
                    className="btn-glow-purple px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 mx-auto">
                    <RotateCcw size={16} />
                    Повторить снова
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Quiz tab ────────────────────────────────────────────────────── */}
        {tab === "quiz" && (
          <AnimatePresence mode="wait">
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-lg mx-auto">

              {!quizDone ? (
                <>
                  {wordsData.length > 0 && (() => {
                    const qWord = wordsData[quizIndex % wordsData.length];
                    const correctIdx = quizOptions.findIndex((o) => o.id === qWord.id);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-5">
                          <div className="text-sm text-gray-400">Вопрос {(quizIndex % 20) + 1} / 20</div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card">
                            <Trophy size={14} className="text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-300">{quizScore}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="h-1.5 bg-dark-600 rounded-full mb-6 overflow-hidden">
                          <motion.div className="h-full xp-bar rounded-full"
                            animate={{ width: `${((quizIndex % 20) / 20) * 100}%` }} />
                        </div>

                        {/* Question */}
                        <motion.div
                          key={quizIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="glass-card rounded-2xl p-6 mb-4 text-center"
                        >
                          <div className="text-xs text-gray-500 mb-2">Выбери перевод:</div>
                          <div className="text-4xl font-black text-white mb-2">{qWord.en}</div>
                          {qWord.phonetic && <div className="flex justify-center mb-3"><Phonetic text={qWord.phonetic} /></div>}
                          <div className="flex justify-center">
                            <SpeakButton text={qWord.en} size={18} />
                          </div>
                        </motion.div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-3">
                          {quizOptions.map((opt, i) => {
                            const isCorrect = opt.id === qWord.id;
                            const isSelected = quizAnswer !== null && quizOptions[quizAnswer]?.id === opt.id;
                            const showResult = quizAnswer !== null;

                            let style: React.CSSProperties = {};
                            if (showResult) {
                              if (isCorrect) style = { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.6)", color: "#34d399" };
                              else if (isSelected && !isCorrect) style = { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171" };
                              else style = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7280" };
                            } else {
                              style = { background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#e5e7eb" };
                            }

                            return (
                              <motion.button
                                key={opt.id}
                                whileHover={!showResult ? { scale: 1.03 } : {}}
                                whileTap={!showResult ? { scale: 0.97 } : {}}
                                disabled={showResult}
                                onClick={() => {
                                  setQuizAnswer(i);
                                  if (isCorrect) setQuizScore((s) => s + 1);
                                  setTimeout(() => {
                                    setQuizAnswer(null);
                                    const next = quizIndex + 1;
                                    if (next % 20 === 0) setQuizDone(true);
                                    else { setQuizIndex(next); buildOptions(next); }
                                  }, 900);
                                }}
                                className="p-4 rounded-xl text-sm font-medium text-left transition-all"
                                style={style}
                              >
                                {opt.ru}
                                {showResult && isCorrect && <span className="ml-1">✓</span>}
                                {showResult && isSelected && !isCorrect && <span className="ml-1">✗</span>}
                              </motion.button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass-card rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-4">{quizScore >= 16 ? "🏆" : quizScore >= 12 ? "⭐" : "📚"}</div>
                  <h2 className="text-2xl font-black text-white mb-2">Раунд завершён!</h2>
                  <div className="text-5xl font-black mb-1"
                    style={{ color: quizScore >= 16 ? "#10b981" : quizScore >= 12 ? "#f59e0b" : "#ef4444" }}>
                    {quizScore}/20
                  </div>
                  <div className="text-gray-400 mb-6">{Math.round((quizScore / 20) * 100)}% правильных ответов</div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setQuizDone(false); setQuizScore(0); setQuizIndex(0); buildOptions(0); }}
                    className="btn-glow-purple px-8 py-3 rounded-xl font-bold text-white mx-auto flex items-center gap-2">
                    <RotateCcw size={16} />
                    Играть снова
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Grammar tab ─────────────────────────────────────────────────── */}
        {tab === "grammar" && (
          <AnimatePresence mode="wait">
            <motion.div key="grammar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3">
              {grammarTopics.map((topic, i) => (
                <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-2xl overflow-hidden">

                  <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedGrammar(expandedGrammar === topic.id ? null : topic.id)}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[topic.level]}, #3b82f6)` }}>
                      {topic.level}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-white">{topic.title}</div>
                      <div className="text-sm text-gray-400">{topic.desc}</div>
                    </div>
                    <motion.div animate={{ rotate: expandedGrammar === topic.id ? 90 : 0 }}>
                      <ChevronRight size={18} className="text-gray-500" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedGrammar === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                          {/* Explanation */}
                          <p className="text-gray-300 text-sm">{topic.explanation}</p>

                          {/* Structure */}
                          <div className="p-3 rounded-xl font-mono text-sm"
                            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93c5fd" }}>
                            {topic.structure}
                          </div>

                          {/* Examples */}
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Примеры</div>
                            <div className="space-y-2">
                              {topic.examples.map((ex, ei) => (
                                <div key={ei} className="flex items-start gap-3 p-3 rounded-xl"
                                  style={{ background: "rgba(255,255,255,0.03)" }}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-white font-medium text-sm">{ex.en}</div>
                                    <div className="text-gray-500 text-xs mt-0.5">{ex.ru}</div>
                                  </div>
                                  <SpeakButton text={ex.en} size={13} />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tip */}
                          <div className="p-4 rounded-xl"
                            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                            <div className="text-xs text-yellow-400 font-bold mb-1.5">💡 Совет</div>
                            <div className="text-sm text-gray-300">{topic.tip}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
}
