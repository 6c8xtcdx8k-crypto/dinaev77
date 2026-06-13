"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Trophy, Flame, Map, Zap, TrendingUp } from "lucide-react";

type SortKey = "xp" | "streak" | "quests" | "level";

const players = [
  { rank: 1, name: "Алина К.", avatar: "👩‍💼", xp: 12450, streak: 45, quests: 67, level: 12, country: "🇩🇪", badge: "🏆" },
  { rank: 2, name: "Максим Т.", avatar: "👨‍💻", xp: 11200, streak: 38, quests: 61, level: 11, country: "🇺🇸", badge: "🥈" },
  { rank: 3, name: "Дарья О.", avatar: "👩‍🎓", xp: 10800, streak: 52, quests: 58, level: 11, country: "🇬🇧", badge: "🥉" },
  { rank: 4, name: "Игорь В.", avatar: "👨‍🔬", xp: 9640, streak: 21, quests: 52, level: 10, country: "🇨🇦", badge: null },
  { rank: 5, name: "Светлана М.", avatar: "👩‍🏫", xp: 9210, streak: 30, quests: 49, level: 10, country: "🇦🇺", badge: null },
  { rank: 6, name: "Андрей П.", avatar: "👨‍🎨", xp: 8900, streak: 14, quests: 45, level: 9, country: "🇳🇿", badge: null },
  { rank: 7, name: "Ты 🫵", avatar: "⚡", xp: 2840, streak: 7, quests: 23, level: 7, country: "🇷🇺", badge: null, isMe: true },
  { rank: 8, name: "Наталья Б.", avatar: "👩‍💻", xp: 2650, streak: 5, quests: 20, level: 6, country: "🇧🇾", badge: null },
  { rank: 9, name: "Сергей Н.", avatar: "👨‍🚀", xp: 2100, streak: 3, quests: 17, level: 6, country: "🇺🇦", badge: null },
  { rank: 10, name: "Елена Д.", avatar: "👩‍⚕️", xp: 1840, streak: 9, quests: 14, level: 5, country: "🇰🇿", badge: null },
];

const sortOptions: { key: SortKey; label: string; icon: typeof Zap; color: string }[] = [
  { key: "xp", label: "По XP", icon: Zap, color: "#a855f7" },
  { key: "streak", label: "По стрику", icon: Flame, color: "#f97316" },
  { key: "quests", label: "По квестам", icon: Map, color: "#3b82f6" },
  { key: "level", label: "По уровню", icon: TrendingUp, color: "#10b981" },
];

export default function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>("xp");

  const sorted = [...players].sort((a, b) => b[sort] - a[sort]).map((p, i) => ({ ...p, rank: i + 1 }));

  const top3Colors = ["#f59e0b", "#9ca3af", "#cd7f32"];
  const top3Emojis = ["🥇", "🥈", "🥉"];

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Лидерборд 🏆</h1>
          <p className="text-gray-400">Рейтинг учеников по всему миру</p>
        </motion.div>

        {/* Top 3 podium */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-end justify-center gap-4 mb-8 pt-4">
          {[sorted[1], sorted[0], sorted[2]].map((player, i) => {
            if (!player) return null;
            const heights = [80, 110, 65];
            const podiumRanks = [2, 1, 3];
            return (
              <div key={player.name} className="flex flex-col items-center" style={{ width: 90 }}>
                <div className="text-2xl mb-1">{player.avatar}</div>
                <div className="text-xs text-center font-medium text-white truncate w-full text-center mb-1">{player.name}</div>
                <div className="text-xs text-gray-400 mb-2">{player.country}</div>
                <div className="text-lg">{top3Emojis[podiumRanks[i] - 1]}</div>
                <motion.div
                  className="w-full rounded-t-xl flex items-center justify-center text-2xl font-black mt-2"
                  style={{
                    height: heights[i],
                    background: `linear-gradient(180deg, ${top3Colors[podiumRanks[i] - 1]}33, ${top3Colors[podiumRanks[i] - 1]}11)`,
                    border: `1px solid ${top3Colors[podiumRanks[i] - 1]}55`,
                    color: top3Colors[podiumRanks[i] - 1],
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: heights[i] }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.6 }}
                >
                  {podiumRanks[i]}
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  sort === opt.key ? "text-white" : "text-gray-400 hover:text-white glass-card"
                }`}
                style={sort === opt.key ? {
                  background: `${opt.color}22`,
                  border: `1px solid ${opt.color}55`,
                  color: opt.color
                } : {}}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard list */}
        <div className="space-y-2">
          {sorted.map((player, i) => {
            const isTop3 = player.rank <= 3;
            const isMe = (player as any).isMe;

            return (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isMe ? "glass-card-hover" : ""
                }`}
                style={{
                  background: isMe
                    ? "rgba(168,85,247,0.15)"
                    : isTop3
                    ? `${top3Colors[player.rank - 1]}0a`
                    : "rgba(255,255,255,0.03)",
                  border: isMe
                    ? "1px solid rgba(168,85,247,0.4)"
                    : isTop3
                    ? `1px solid ${top3Colors[player.rank - 1]}33`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isMe ? "0 0 20px rgba(168,85,247,0.1)" : "none",
                }}
              >
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {isTop3
                    ? <span className="text-xl">{top3Emojis[player.rank - 1]}</span>
                    : <span className="text-sm font-bold text-gray-500">#{player.rank}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="text-2xl flex-shrink-0">{player.avatar}</div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isMe ? "text-purple-300" : "text-white"}`}>
                    {player.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>{player.country}</span>
                    <span>·</span>
                    <span>Ур. {player.level}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {sort === "xp" && (
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-purple-400" />
                      <span className="text-sm font-bold text-purple-300">{player.xp.toLocaleString()}</span>
                    </div>
                  )}
                  {sort === "streak" && (
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-400" />
                      <span className="text-sm font-bold text-orange-300">{player.streak}</span>
                    </div>
                  )}
                  {sort === "quests" && (
                    <div className="flex items-center gap-1">
                      <Map size={12} className="text-blue-400" />
                      <span className="text-sm font-bold text-blue-300">{player.quests}</span>
                    </div>
                  )}
                  {sort === "level" && (
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} className="text-green-400" />
                      <span className="text-sm font-bold text-green-300">{player.level}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My position banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl text-center"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}
        >
          <div className="text-sm text-gray-400 mb-1">Твоя позиция</div>
          <div className="text-2xl font-black text-purple-300">#7 из 12,847</div>
          <div className="text-sm text-gray-400 mt-1">
            Ещё <span className="text-white font-bold">5,360 XP</span> до 6-го места
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
