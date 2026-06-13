"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Zap, Flame, Trophy, BookOpen, Map, Star, TrendingUp, Award, Edit3, AlertCircle } from "lucide-react";

const achievements = [
  { id: 1, title: "Первые шаги", desc: "Пройди первый квест", icon: "👣", color: "#10b981", earned: true, rare: false },
  { id: 2, title: "Словарный запас", desc: "Выучи 100 слов", icon: "📚", color: "#3b82f6", earned: true, rare: false },
  { id: 3, title: "Неделя огня", desc: "7 дней подряд", icon: "🔥", color: "#f97316", earned: true, rare: false },
  { id: 4, title: "Путешественник", desc: "Пройди 5 локаций", icon: "✈️", color: "#a855f7", earned: true, rare: false },
  { id: 5, title: "Словарный ас", desc: "Выучи 500 слов", icon: "📖", color: "#ec4899", earned: true, rare: true },
  { id: 6, title: "Месяц силы", desc: "30 дней подряд", icon: "💪", color: "#f59e0b", earned: false, rare: true },
  { id: 7, title: "Мастер тестов", desc: "100% на 10 тестах", icon: "🏆", color: "#06b6d4", earned: false, rare: true },
  { id: 8, title: "Полиглот", desc: "Достигни уровня B2", icon: "🌍", color: "#8b5cf6", earned: false, rare: true },
  { id: 9, title: "Суперстрик", desc: "100 дней подряд", icon: "⚡", color: "#ef4444", earned: false, rare: true },
];

const weakTopics = [
  { topic: "Условные предложения", errors: 12, level: "B1", icon: "📝" },
  { topic: "Медицинская лексика", errors: 8, level: "B1", icon: "🏥" },
  { topic: "Неправильные глаголы", errors: 7, level: "A2", icon: "📖" },
];

const history = [
  { date: "Сегодня", action: "Квест «Регистрация на рейс»", xp: 80, icon: "✈️" },
  { date: "Сегодня", action: "Тест «Аэропорт» — 80%", xp: 120, icon: "📝" },
  { date: "Вчера", action: "Выучено 15 новых слов", xp: 50, icon: "📚" },
  { date: "Вчера", action: "Квест «Запись к врачу»", xp: 90, icon: "🏥" },
  { date: "2 дня назад", action: "Тест «Больница» — 100%", xp: 150, icon: "🎯" },
];

function ProgressRing({ progress, size = 100, color = "#a855f7" }: { progress: number; size?: number; color?: string }) {
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 progress-ring">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" stroke="rgba(255,255,255,0.07)" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" stroke={color}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"achievements" | "history" | "mistakes">("achievements");

  const tabs = [
    { key: "achievements" as const, label: "Награды", icon: "🏆" },
    { key: "history" as const, label: "История", icon: "📜" },
    { key: "mistakes" as const, label: "Ошибки", icon: "🎯" },
  ];

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-4xl">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at top right, #a855f7, transparent 60%)" }} />

          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                whileHover={{ scale: 1.05 }}
              >
                ⚡
              </motion.div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#1a2236", border: "1px solid rgba(168,85,247,0.4)" }}>
                <Edit3 size={12} className="text-purple-400" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-black text-white">Ты 🫵</h1>
                <div className="level-badge px-3 py-1 text-sm">Ур. 7</div>
              </div>
              <div className="text-gray-400 text-sm mb-3">Учится 23 дня · Аэропорт → Работа</div>

              {/* XP bar */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-500 w-12">2840 XP</span>
                <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div className="h-full xp-bar rounded-full"
                    initial={{ width: 0 }} animate={{ width: "81%" }}
                    transition={{ duration: 1.2, delay: 0.3 }} />
                </div>
                <span className="text-xs text-gray-500 w-12">3500 XP</span>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 flex-wrap">
                {[
                  { icon: "🔥", value: "7", label: "streak" },
                  { icon: "📚", value: "847", label: "слов" },
                  { icon: "🗺️", value: "23", label: "квестов" },
                  { icon: "🏆", value: "5", label: "наград" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1 text-sm">
                    <span>{s.icon}</span>
                    <span className="font-bold text-white">{s.value}</span>
                    <span className="text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress ring */}
            <div className="relative hidden sm:block flex-shrink-0">
              <ProgressRing progress={81} size={90} color="#a855f7" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">B1</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Zap, value: "2,840", label: "Всего XP", color: "#a855f7" },
            { icon: Flame, value: "7 дн", label: "Текущий стрик", color: "#f97316" },
            { icon: Map, value: "23", label: "Квестов", color: "#3b82f6" },
            { icon: BookOpen, value: "847", label: "Слов выучено", color: "#10b981" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }} className="glass-card rounded-2xl p-4 text-center">
                <Icon size={20} className="mx-auto mb-2" style={{ color: s.color }} />
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 glass-card rounded-2xl w-fit">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              style={tab === t.key ? { background: "linear-gradient(135deg, #a855f7, #3b82f6)", boxShadow: "0 0 20px rgba(168,85,247,0.4)" } : {}}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Achievements */}
        {tab === "achievements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((ach, i) => (
                <motion.div key={ach.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`glass-card rounded-2xl p-4 relative overflow-hidden ${ach.earned ? "" : "opacity-50"}`}
                  style={{ border: ach.earned ? `1px solid ${ach.color}44` : undefined }}>
                  {ach.rare && ach.earned && (
                    <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(168,85,247,0.3)", color: "#c084fc" }}>
                      Редкое
                    </div>
                  )}
                  {!ach.earned && (
                    <div className="absolute top-2 right-2 text-gray-600">🔒</div>
                  )}
                  <div className="text-3xl mb-2">{ach.icon}</div>
                  <div className={`font-bold text-sm ${ach.earned ? "text-white" : "text-gray-500"}`}>{ach.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{ach.desc}</div>
                  {ach.earned && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg, transparent, ${ach.color}, transparent)` }} />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {tab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {history.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-4 glass-card rounded-xl">
                <div className="text-2xl flex-shrink-0">{h.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{h.action}</div>
                  <div className="text-xs text-gray-500">{h.date}</div>
                </div>
                <div className="text-sm font-bold text-purple-400 flex-shrink-0">+{h.xp} XP</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mistakes */}
        {tab === "mistakes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card rounded-2xl p-5 mb-4"
              style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Слабые места</span>
              </div>
              <p className="text-xs text-gray-400">Эти темы стоит повторить. Сделай больше упражнений для уверенности.</p>
            </div>
            <div className="space-y-3">
              {weakTopics.map((t, i) => (
                <motion.div key={t.topic} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 p-4 glass-card rounded-xl">
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{t.topic}</div>
                    <div className="text-xs text-gray-400">{t.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-400">{t.errors} ошибок</div>
                    <button className="text-xs text-purple-400 hover:text-purple-300 mt-0.5">Повторить →</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
