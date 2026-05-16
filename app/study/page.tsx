"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { BookOpen, Volume2, Filter, Search, ChevronLeft, ChevronRight, Star, Check } from "lucide-react";

type Tab = "words" | "grammar" | "flashcards";
type Level = "all" | "A1" | "A2" | "B1" | "B2" | "C1";

const words = [
  { id: 1, en: "passport", ru: "паспорт", topic: "Аэропорт", level: "A1", example: "Show me your passport, please." },
  { id: 2, en: "boarding pass", ru: "посадочный талон", topic: "Аэропорт", level: "A1", example: "Where is your boarding pass?" },
  { id: 3, en: "luggage", ru: "багаж", topic: "Аэропорт", level: "A1", example: "My luggage is missing." },
  { id: 4, en: "customs", ru: "таможня", topic: "Аэропорт", level: "A2", example: "Nothing to declare at customs." },
  { id: 5, en: "appointment", ru: "приём/запись", topic: "Медицина", level: "A2", example: "I have an appointment at 3 PM." },
  { id: 6, en: "prescription", ru: "рецепт", topic: "Медицина", level: "B1", example: "You need a prescription for this." },
  { id: 7, en: "insurance", ru: "страховка", topic: "Банк", level: "B1", example: "Do you have health insurance?" },
  { id: 8, en: "mortgage", ru: "ипотека", topic: "Банк", level: "B2", example: "We applied for a mortgage." },
  { id: 9, en: "landlord", ru: "хозяин жилья", topic: "Жильё", level: "B1", example: "My landlord fixed the heater." },
  { id: 10, en: "lease", ru: "договор аренды", topic: "Жильё", level: "B2", example: "Sign the lease for 12 months." },
  { id: 11, en: "subway", ru: "метро", topic: "Транспорт", level: "A1", example: "Take the subway to downtown." },
  { id: 12, en: "transfer", ru: "пересадка", topic: "Транспорт", level: "A2", example: "You need one transfer." },
  { id: 13, en: "resume", ru: "резюме", topic: "Работа", level: "B1", example: "Send me your resume by email." },
  { id: 14, en: "salary", ru: "зарплата", topic: "Работа", level: "B1", example: "What is the expected salary?" },
  { id: 15, en: "emergency", ru: "экстренный случай", topic: "Экстренные ситуации", level: "A2", example: "Call 911 for emergencies." },
];

const grammarTopics = [
  {
    id: 1, title: "Present Simple", level: "A1", desc: "Настоящее простое",
    explanation: "Используется для регулярных действий и фактов.",
    examples: ["I work every day.", "She lives in New York.", "They don't speak French."],
    tip: "Запомни: после he/she/it добавляй -s: works, lives, speaks.",
  },
  {
    id: 2, title: "Present Continuous", level: "A2", desc: "Настоящее длительное",
    explanation: "Используется для действий, происходящих прямо сейчас.",
    examples: ["I am waiting for the doctor.", "She is filling out the form.", "They are checking in."],
    tip: "Формула: am/is/are + глагол+ing",
  },
  {
    id: 3, title: "Past Simple", level: "A2", desc: "Прошедшее простое",
    explanation: "Для завершённых действий в прошлом.",
    examples: ["I missed my flight.", "She called the ambulance.", "We signed the contract."],
    tip: "Правильные глаголы: +ed. Неправильные: учи отдельно (go→went).",
  },
  {
    id: 4, title: "Will / Going to", level: "B1", desc: "Будущее время",
    explanation: "Will — спонтанные решения, going to — планы.",
    examples: ["I will call you back.", "I am going to sign the lease.", "It will be ready tomorrow."],
    tip: "Will = решение прямо сейчас. Going to = заранее запланировано.",
  },
  {
    id: 5, title: "Modal verbs", level: "B1", desc: "Модальные глаголы",
    explanation: "Can, should, must, may — выражают возможность, обязанность.",
    examples: ["You must show your ID.", "Can I see the manager?", "You should see a doctor."],
    tip: "После модального — основной глагол без to: can go, must show.",
  },
  {
    id: 6, title: "Conditionals", level: "B2", desc: "Условные предложения",
    explanation: "Если... то... — разные типы для реальных и нереальных ситуаций.",
    examples: ["If you have insurance, it's free.", "If I were you, I would call them.", "If you had asked, I would have helped."],
    tip: "Type 1: If + present → will. Type 2: If + past → would.",
  },
];

const topics = ["all", "Аэропорт", "Медицина", "Банк", "Жильё", "Транспорт", "Работа", "Экстренные ситуации"];

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("words");
  const [levelFilter, setLevelFilter] = useState<Level>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [expandedGrammar, setExpandedGrammar] = useState<number | null>(null);

  const filteredWords = words.filter((w) => {
    const matchLevel = levelFilter === "all" || w.level === levelFilter;
    const matchTopic = topicFilter === "all" || w.topic === topicFilter;
    const matchSearch = !search || w.en.toLowerCase().includes(search.toLowerCase()) || w.ru.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchTopic && matchSearch;
  });

  const flashcardWords = words.filter((w) => !learned.has(w.id));
  const currentCard = flashcardWords[cardIndex % (flashcardWords.length || 1)];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "words", label: "Словарь", icon: "📚" },
    { key: "grammar", label: "Грамматика", icon: "📖" },
    { key: "flashcards", label: "Карточки", icon: "🃏" },
  ];

  const levels: Level[] = ["all", "A1", "A2", "B1", "B2", "C1"];

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Учёба 📚</h1>
          <p className="text-gray-400">1000+ слов и фраз · Грамматика · Флэш-карточки</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl glass-card w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              style={activeTab === tab.key ? {
                background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                boxShadow: "0 0 20px rgba(168,85,247,0.4)"
              } : {}}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Words tab */}
        {activeTab === "words" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2 flex-1 min-w-48">
                <Search size={16} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск слов..."
                  className="bg-transparent text-white placeholder-gray-500 text-sm outline-none flex-1"
                />
              </div>
              <div className="flex gap-1 glass-card rounded-xl p-1">
                {levels.map((l) => (
                  <button key={l} onClick={() => setLevelFilter(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      levelFilter === l ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                    style={levelFilter === l ? { background: "rgba(168,85,247,0.3)" } : {}}>
                    {l === "all" ? "Все" : l}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic pills */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {topics.map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    topicFilter === t
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={topicFilter === t
                    ? { background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.5)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
                  }>
                  {t === "all" ? "Все темы" : t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredWords.map((word, i) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card glass-card-hover rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-white">{word.en}</div>
                      <div className="text-gray-400 text-sm">{word.ru}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                        {word.level}
                      </span>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Volume2 size={14} className="text-gray-400 hover:text-purple-400" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 italic">"{word.example}"</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                      {word.topic}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredWords.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <div>Ничего не найдено</div>
              </div>
            )}
          </motion.div>
        )}

        {/* Grammar tab */}
        {activeTab === "grammar" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {grammarTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
                  onClick={() => setExpandedGrammar(expandedGrammar === topic.id ? null : topic.id)}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                    {topic.level}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{topic.title}</div>
                    <div className="text-sm text-gray-400">{topic.desc}</div>
                  </div>
                  <motion.div animate={{ rotate: expandedGrammar === topic.id ? 90 : 0 }}>
                    <ChevronRight size={18} className="text-gray-400" />
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
                      <div className="px-5 pb-5 border-t border-white/5 pt-4">
                        <p className="text-gray-300 text-sm mb-4">{topic.explanation}</p>
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Примеры</div>
                          {topic.examples.map((ex, ei) => (
                            <div key={ei} className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                              <span className="text-sm text-white font-medium">{ex}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 rounded-xl"
                          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                          <div className="text-xs text-yellow-400 font-bold mb-1">💡 Подсказка</div>
                          <div className="text-sm text-gray-300">{topic.tip}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Flashcards tab */}
        {activeTab === "flashcards" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-6">
              Осталось карточек: {flashcardWords.length} · Выучено: {learned.size}
            </div>

            {flashcardWords.length > 0 && currentCard ? (
              <>
                <motion.div
                  key={currentCard.id}
                  className="w-full max-w-md h-64 rounded-3xl cursor-pointer relative"
                  onClick={() => setCardFlipped(!cardFlipped)}
                  style={{ perspective: 1000 }}
                >
                  <motion.div
                    className="w-full h-full relative"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: cardFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                      style={{
                        backfaceVisibility: "hidden",
                        background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))",
                        border: "1px solid rgba(168,85,247,0.4)",
                        boxShadow: "0 0 40px rgba(168,85,247,0.2)"
                      }}>
                      <div className="text-4xl font-black text-white mb-3">{currentCard.en}</div>
                      <div className="text-gray-400 text-sm">Нажми, чтобы узнать перевод</div>
                      <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full"
                        style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                        {currentCard.level}
                      </div>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))",
                        border: "1px solid rgba(16,185,129,0.4)",
                        boxShadow: "0 0 40px rgba(16,185,129,0.2)"
                      }}>
                      <div className="text-3xl font-bold text-white mb-2">{currentCard.ru}</div>
                      <div className="text-gray-400 text-sm italic mb-3">"{currentCard.example}"</div>
                      <div className="text-xs text-gray-500">{currentCard.topic}</div>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="flex items-center gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCardFlipped(false);
                      setCardIndex((prev) => (prev + 1) % flashcardWords.length);
                    }}
                    className="px-6 py-3 rounded-xl font-medium text-white glass-card"
                  >
                    Пропустить →
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setLearned((prev) => new Set(prev).add(currentCard.id));
                      setCardFlipped(false);
                      setCardIndex((prev) => Math.min(prev, flashcardWords.length - 2));
                    }}
                    className="btn-glow-green px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                  >
                    <Check size={16} />
                    Выучил!
                  </motion.button>
                </div>
                <div className="mt-4 text-xs text-gray-500">Нажми на карточку, чтобы перевернуть</div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-xl font-bold text-white mb-2">Все карточки выучены!</div>
                <div className="text-gray-400 text-sm mb-6">Ты выучил {learned.size} слов. Отличная работа!</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setLearned(new Set()); setCardIndex(0); }}
                  className="btn-glow-purple px-6 py-3 rounded-xl font-medium text-white"
                >
                  Повторить снова
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
