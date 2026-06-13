"use client";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Flame, Zap, Trophy, Target, Star, CheckCircle, Clock, TrendingUp, Award, BookOpen } from "lucide-react";

const dailyQuests = [
  { id: 1, title: "Выучи 10 новых слов", xp: 50, done: true, icon: "📚" },
  { id: 2, title: "Пройди квест «Аэропорт»", xp: 120, done: true, icon: "✈️" },
  { id: 3, title: "Реши 5 тестовых заданий", xp: 75, done: false, icon: "📝" },
  { id: 4, title: "Повтори карточки (20 шт)", xp: 40, done: false, icon: "🃏" },
  { id: 5, title: "Послушай диалог в чате", xp: 30, done: false, icon: "💬" },
];

const weeklyStats = [
  { day: "Пн", xp: 180 },
  { day: "Вт", xp: 240 },
  { day: "Ср", xp: 320 },
  { day: "Чт", xp: 150 },
  { day: "Пт", xp: 280 },
  { day: "Сб", xp: 200 },
  { day: "Вс", xp: 90 },
];
const maxXP = Math.max(...weeklyStats.map((d) => d.xp));

const recentAchievements = [
  { title: "Первый квест", icon: "🎯", color: "#a855f7", rare: false },
  { title: "Стрик 7 дней", icon: "🔥", color: "#f97316", rare: false },
  { title: "Словарный ас", icon: "📖", color: "#10b981", rare: true },
];

const topicProgress = [
  { topic: "Аэропорт", progress: 85, color: "#3b82f6", icon: "✈️" },
  { topic: "Медицина", progress: 60, color: "#10b981", icon: "🏥" },
  { topic: "Жильё", progress: 45, color: "#a855f7", icon: "🏠" },
  { topic: "Банк", progress: 30, color: "#f59e0b", icon: "🏦" },
  { topic: "Работа", progress: 15, color: "#ec4899", icon: "💼" },
];

function ProgressRing({ progress, size = 120, strokeWidth = 10, color = "#a855f7" }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={size} height={size} className="progress-ring -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth}
        fill="none" stroke="rgba(255,255,255,0.07)" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth}
        fill="none" stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const doneQuests = dailyQuests.filter((q) => q.done).length;
  const totalXP = dailyQuests.filter((q) => q.done).reduce((a, q) => a + q.xp, 0);

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Дашборд</h1>
              <p className="text-gray-400">Суббота, 16 мая 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                <Flame size={18} className="text-orange-400 streak-fire" />
                <span className="font-bold text-orange-300">7</span>
                <span className="text-gray-400 text-sm">дней</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                <Zap size={18} className="text-purple-400" />
                <span className="font-bold text-purple-300">2840</span>
                <span className="text-gray-400 text-sm">XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Daily quests */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  <h2 className="font-bold text-white">Ежедневные квесты</h2>
                </div>
                <div className="text-sm text-gray-400">{doneQuests}/{dailyQuests.length} выполнено</div>
              </div>
              <div className="h-2 bg-dark-600 rounded-full mb-5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full xp-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${(doneQuests / dailyQuests.length) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="space-y-3">
                {dailyQuests.map((quest, i) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      quest.done
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-white/3 border border-white/5 hover:border-purple-500/30"
                    }`}
                  >
                    <span className="text-xl">{quest.icon}</span>
                    <span className={`flex-1 text-sm font-medium ${quest.done ? "text-gray-400 line-through" : "text-white"}`}>
                      {quest.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${quest.done ? "text-green-400" : "text-purple-400"}`}>
                        +{quest.xp} XP
                      </span>
                      {quest.done
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <div className="w-4 h-4 rounded-full border border-gray-600" />
                      }
                    </div>
                  </motion.div>
                ))}
              </div>
              {doneQuests > 0 && (
                <div className="mt-4 p-3 rounded-xl text-center"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <span className="text-green-400 text-sm font-medium">Заработано сегодня: +{totalXP} XP 🎉</span>
                </div>
              )}
            </motion.div>

            {/* Weekly chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-blue-400" />
                <h2 className="font-bold text-white">XP за неделю</h2>
              </div>
              <div className="flex items-end gap-3 h-36">
                {weeklyStats.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      className="w-full rounded-t-lg relative overflow-hidden"
                      style={{
                        height: `${(day.xp / maxXP) * 120}px`,
                        background: i === 6
                          ? "linear-gradient(180deg, rgba(168,85,247,0.3), rgba(168,85,247,0.1))"
                          : "linear-gradient(180deg, #a855f7, #3b82f6)",
                        boxShadow: i < 6 ? "0 0 10px rgba(168,85,247,0.3)" : "none",
                        border: i === 6 ? "1px solid rgba(168,85,247,0.3)" : "none",
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.xp / maxXP) * 120}px` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                    />
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Topic progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={20} className="text-cyan-400" />
                <h2 className="font-bold text-white">Прогресс по темам</h2>
              </div>
              <div className="space-y-4">
                {topicProgress.map((topic, i) => (
                  <div key={topic.topic}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base">{topic.icon}</span>
                      <span className="flex-1 text-sm text-gray-300">{topic.topic}</span>
                      <span className="text-xs font-bold" style={{ color: topic.color }}>{topic.progress}%</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${topic.color}, ${topic.color}88)`, boxShadow: `0 0 8px ${topic.color}66` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.progress}%` }}
                        transition={{ delay: i * 0.1 + 0.4, duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Progress ring */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col items-center">
              <h2 className="font-bold text-white mb-4">Уровень 7</h2>
              <div className="relative">
                <ProgressRing progress={81} size={140} strokeWidth={12} color="#a855f7" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">81%</span>
                  <span className="text-xs text-gray-400">до 8 уровня</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-400">2840 / 3500 XP</div>
                <div className="text-xs text-purple-400 mt-1">Ещё 660 XP до следующего уровня</div>
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.1))", borderColor: "rgba(249,115,22,0.3)" }}>
              <div className="text-5xl mb-2 streak-fire">🔥</div>
              <div className="text-4xl font-black text-orange-400 mb-1">7</div>
              <div className="text-gray-300 font-medium mb-1">дней подряд</div>
              <div className="text-xs text-gray-500">Лучший результат: 14 дней</div>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: "rgba(249,115,22,0.3)", border: "1px solid rgba(249,115,22,0.5)" }}>
                    🔥
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent achievements */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-yellow-400" />
                <h2 className="font-bold text-white">Последние награды</h2>
              </div>
              <div className="space-y-3">
                {recentAchievements.map((ach) => (
                  <div key={ach.title} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${ach.color}11`, border: `1px solid ${ach.color}33` }}>
                    <span className="text-2xl">{ach.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{ach.title}</div>
                      {ach.rare && (
                        <div className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                          Редкое
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-purple-400" />
                <h2 className="font-bold text-white">Статистика</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Квестов", value: "23", icon: "🗺️" },
                  { label: "Слов", value: "847", icon: "📚" },
                  { label: "Тестов", value: "56", icon: "📝" },
                  { label: "Наград", value: "12", icon: "🏆" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
