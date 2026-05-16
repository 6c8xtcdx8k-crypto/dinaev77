"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Lock, Star, Zap, Trophy, ChevronRight, X, Play } from "lucide-react";

const locations = [
  {
    id: 1, name: "Аэропорт", emoji: "✈️", color: "#3b82f6",
    quests: [
      { id: 1, title: "Регистрация на рейс", xp: 80, difficulty: "A1", done: true, stars: 3 },
      { id: 2, title: "Таможня и паспортный контроль", xp: 100, difficulty: "A1", done: true, stars: 2 },
      { id: 3, title: "В зале ожидания", xp: 90, difficulty: "A2", done: false, stars: 0 },
      { id: 4, title: "Потерянный багаж", xp: 120, difficulty: "A2", done: false, stars: 0 },
    ],
    locked: false, progress: 50,
  },
  {
    id: 2, name: "Больница", emoji: "🏥", color: "#10b981",
    quests: [
      { id: 5, title: "Запись к врачу", xp: 90, difficulty: "A2", done: true, stars: 3 },
      { id: 6, title: "На приёме у врача", xp: 110, difficulty: "A2", done: false, stars: 0 },
      { id: 7, title: "В аптеке", xp: 80, difficulty: "B1", done: false, stars: 0 },
      { id: 8, title: "Скорая помощь", xp: 150, difficulty: "B1", done: false, stars: 0 },
    ],
    locked: false, progress: 25,
  },
  {
    id: 3, name: "Супермаркет", emoji: "🛒", color: "#f59e0b",
    quests: [
      { id: 9, title: "Поиск продуктов", xp: 60, difficulty: "A1", done: true, stars: 3 },
      { id: 10, title: "На кассе", xp: 70, difficulty: "A1", done: true, stars: 3 },
      { id: 11, title: "Возврат товара", xp: 100, difficulty: "A2", done: false, stars: 0 },
      { id: 12, title: "Жалоба менеджеру", xp: 120, difficulty: "B1", done: false, stars: 0 },
    ],
    locked: false, progress: 50,
  },
  {
    id: 4, name: "Банк", emoji: "🏦", color: "#8b5cf6",
    quests: [
      { id: 13, title: "Открытие счёта", xp: 120, difficulty: "B1", done: false, stars: 0 },
      { id: 14, title: "Перевод денег", xp: 100, difficulty: "B1", done: false, stars: 0 },
      { id: 15, title: "Ипотека", xp: 200, difficulty: "B2", done: false, stars: 0 },
    ],
    locked: false, progress: 0,
  },
  {
    id: 5, name: "Аренда жилья", emoji: "🏠", color: "#ec4899",
    quests: [
      { id: 16, title: "Просмотр квартиры", xp: 100, difficulty: "B1", done: false, stars: 0 },
      { id: 17, title: "Договор аренды", xp: 160, difficulty: "B2", done: false, stars: 0 },
      { id: 18, title: "Разговор с хозяином", xp: 120, difficulty: "B1", done: false, stars: 0 },
    ],
    locked: true, progress: 0,
  },
  {
    id: 6, name: "Работа", emoji: "💼", color: "#f97316",
    quests: [
      { id: 19, title: "Собеседование", xp: 200, difficulty: "B2", done: false, stars: 0 },
      { id: 20, title: "Первый день в офисе", xp: 160, difficulty: "B2", done: false, stars: 0 },
      { id: 21, title: "Встреча с командой", xp: 140, difficulty: "B1", done: false, stars: 0 },
    ],
    locked: true, progress: 0,
  },
  {
    id: 7, name: "Школа", emoji: "🎒", color: "#06b6d4",
    quests: [
      { id: 22, title: "Запись в школу", xp: 120, difficulty: "B1", done: false, stars: 0 },
      { id: 23, title: "Встреча с учителем", xp: 110, difficulty: "B1", done: false, stars: 0 },
    ],
    locked: true, progress: 0,
  },
  {
    id: 8, name: "Транспорт", emoji: "🚌", color: "#a855f7",
    quests: [
      { id: 24, title: "Билет на автобус", xp: 70, difficulty: "A1", done: false, stars: 0 },
      { id: 25, title: "Метро", xp: 80, difficulty: "A1", done: false, stars: 0 },
      { id: 26, title: "Такси/Uber", xp: 90, difficulty: "A2", done: false, stars: 0 },
    ],
    locked: true, progress: 0,
  },
  {
    id: 9, name: "Экстренные ситуации", emoji: "🚨", color: "#ef4444",
    quests: [
      { id: 27, title: "Звонок 911", xp: 200, difficulty: "B2", done: false, stars: 0 },
      { id: 28, title: "Авария на дороге", xp: 180, difficulty: "B2", done: false, stars: 0 },
    ],
    locked: true, progress: 0,
  },
];

const miniGames = [
  { id: 1, name: "Слушай и повторяй", icon: "🎧", desc: "Аудирование с NPC", xp: 40 },
  { id: 2, name: "Заполни пропуск", icon: "✏️", desc: "Вставь нужное слово", xp: 30 },
  { id: 3, name: "Сортировка слов", icon: "🔤", desc: "Составь предложение", xp: 35 },
  { id: 4, name: "Диалог с NPC", icon: "🧑‍💼", desc: "Разговорная практика", xp: 60 },
];

export default function QuestPage() {
  const [selected, setSelected] = useState<typeof locations[0] | null>(null);
  const [activeQuest, setActiveQuest] = useState<typeof locations[0]["quests"][0] | null>(null);

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Карта квестов 🗺️</h1>
          <p className="text-gray-400">Выбери локацию и начни приключение. 9 локаций · 50+ квестов</p>
        </motion.div>

        {/* Location grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: loc.locked ? 1 : 1.04 }}
              onClick={() => !loc.locked && setSelected(loc)}
              className={`glass-card rounded-2xl p-5 relative overflow-hidden ${
                loc.locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer glass-card-hover"
              }`}
            >
              {loc.locked && (
                <div className="absolute top-3 right-3">
                  <Lock size={16} className="text-gray-500" />
                </div>
              )}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 text-8xl flex items-center justify-center pointer-events-none">
                {loc.emoji}
              </div>
              <div className="text-3xl mb-3">{loc.emoji}</div>
              <div className="font-bold text-white mb-1">{loc.name}</div>
              <div className="text-xs text-gray-400 mb-3">{loc.quests.length} квестов</div>
              {!loc.locked && (
                <>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${loc.color}, ${loc.color}88)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${loc.progress}%` }}
                      transition={{ delay: i * 0.06 + 0.3, duration: 0.8 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{loc.progress}% пройдено</div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mini-games */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-400" />
            <h2 className="font-bold text-white">Мини-игры</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {miniGames.map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="p-4 rounded-xl cursor-pointer text-center"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <div className="text-3xl mb-2">{game.icon}</div>
                <div className="text-sm font-medium text-white mb-1">{game.name}</div>
                <div className="text-xs text-gray-400 mb-2">{game.desc}</div>
                <div className="text-xs text-purple-400 font-bold">+{game.xp} XP</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Location modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.emoji}</span>
                    <div>
                      <h2 className="text-xl font-black text-white">{selected.name}</h2>
                      <p className="text-sm text-gray-400">{selected.quests.length} квестов</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  {selected.quests.map((quest, i) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => setActiveQuest(quest)}
                      className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: quest.done ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                        border: quest.done ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: quest.done ? "rgba(16,185,129,0.2)" : "rgba(168,85,247,0.15)" }}>
                        {quest.done ? "✅" : "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm mb-0.5 truncate">{quest.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                            {quest.difficulty}
                          </span>
                          {quest.done && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: 3 }).map((_, si) => (
                                <Star key={si} size={10}
                                  className={si < quest.stars ? "text-yellow-400" : "text-gray-600"}
                                  fill={si < quest.stars ? "#fbbf24" : "none"} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold" style={{ color: selected.color }}>+{quest.xp} XP</span>
                        {!quest.done && <ChevronRight size={16} className="text-gray-500" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quest mini modal */}
        <AnimatePresence>
          {activeQuest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
              onClick={() => setActiveQuest(null)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                className="glass-card rounded-3xl p-8 w-full max-w-sm text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-black text-white mb-2">{activeQuest.title}</h3>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="text-sm px-3 py-1 rounded-full"
                    style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                    {activeQuest.difficulty}
                  </span>
                  <span className="text-sm font-bold text-purple-400">+{activeQuest.xp} XP</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  NPC расскажет тебе, что делать. Выполни задание и получи награду!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-glow-purple w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  onClick={() => setActiveQuest(null)}
                >
                  <Play size={18} fill="white" />
                  Начать квест
                </motion.button>
                <button onClick={() => setActiveQuest(null)}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  Отмена
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
