"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import {
  Zap, Star, Trophy, BookOpen, Map, ArrowRight, Flame,
  Globe, Users, Award, TrendingUp
} from "lucide-react";

const levels = [
  { code: "A1", name: "Beginner", color: "#10b981", desc: "Базовые фразы и слова", quests: 12, locked: false },
  { code: "A2", name: "Elementary", color: "#06b6d4", desc: "Повседневное общение", quests: 18, locked: false },
  { code: "B1", name: "Intermediate", color: "#3b82f6", desc: "Реальные ситуации", quests: 24, locked: false },
  { code: "B2", name: "Upper-Int", color: "#8b5cf6", desc: "Свободное общение", quests: 30, locked: true },
  { code: "C1", name: "Advanced", color: "#a855f7", desc: "Профессиональный уровень", quests: 36, locked: true },
  { code: "C2", name: "Mastery", color: "#ec4899", desc: "Полное владение", quests: 40, locked: true },
];

const stats = [
  { icon: Users, value: "12,847", label: "Учеников", color: "#a855f7" },
  { icon: Globe, value: "50+", label: "Локаций", color: "#3b82f6" },
  { icon: BookOpen, value: "1000+", label: "Заданий", color: "#06b6d4" },
  { icon: Award, value: "200+", label: "Наград", color: "#f59e0b" },
];

const features = [
  { icon: Map, title: "Игровая карта", desc: "Путешествуй по локациям: аэропорт, больница, банк, школа", color: "#a855f7" },
  { icon: Zap, title: "XP & Уровни", desc: "Зарабатывай очки, повышай уровень, открывай новые квесты", color: "#3b82f6" },
  { icon: Flame, title: "Ежедневные стрики", desc: "Занимайся каждый день и не теряй серию побед", color: "#f97316" },
  { icon: Trophy, title: "Лидерборд", desc: "Соревнуйся с другими учениками по всему миру", color: "#f59e0b" },
  { icon: Star, title: "Редкие награды", desc: "Коллекционируй достижения и эксклюзивные бейджи", color: "#10b981" },
  { icon: TrendingUp, title: "Аналитика", desc: "Следи за своим прогрессом и слабыми местами", color: "#ec4899" },
];

export default function HomePage() {
  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-6xl">

        {/* Hero section */}
        <section className="relative mb-16">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
            <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
              style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          </div>

          <div className="text-center pt-8 pb-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}
            >
              <Zap size={14} />
              Gamified English for Real Life
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black mb-6 leading-tight"
            >
              <span className="neon-text-purple">Catch</span>{" "}
              <span style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Quest</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Учи английский через <strong className="text-white">реальные ситуации</strong> — аэропорт, врач, банк, работа.
              <br />Квесты, уровни, награды и ежедневные миссии.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/quest">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-glow-purple px-8 py-4 rounded-2xl font-bold text-lg text-white flex items-center gap-2"
                >
                  <Map size={20} />
                  Начать квест
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/study">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-2xl font-bold text-lg text-white flex items-center gap-2 glass-card"
                >
                  <BookOpen size={20} />
                  Учиться
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5 text-center rounded-2xl"
              >
                <Icon size={24} className="mx-auto mb-2" style={{ color: stat.color }} />
                <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            );
          })}
        </section>

        {/* Levels A1-C2 */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.5), transparent)" }} />
            <h2 className="text-2xl font-bold text-white">Уровни владения</h2>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5))" }} />
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((level, i) => (
              <motion.div
                key={level.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: level.locked ? 1 : 1.03 }}
                className={`glass-card rounded-2xl p-5 cursor-pointer relative overflow-hidden ${
                  level.locked ? "opacity-50" : "glass-card-hover"
                }`}
              >
                {level.locked && (
                  <div className="absolute top-3 right-3 text-gray-500 text-lg">🔒</div>
                )}
                <div className="text-3xl font-black mb-1" style={{ color: level.color, textShadow: `0 0 20px ${level.color}66` }}>
                  {level.code}
                </div>
                <div className="font-semibold text-white text-sm mb-1">{level.name}</div>
                <div className="text-gray-400 text-xs mb-3">{level.desc}</div>
                <div className="flex items-center gap-2">
                  <Map size={12} style={{ color: level.color }} />
                  <span className="text-xs text-gray-500">{level.quests} квестов</span>
                </div>
                {!level.locked && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, transparent, ${level.color}, transparent)` }} />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Почему Catch Quest?</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card glass-card-hover p-6 rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))",
              border: "1px solid rgba(168,85,247,0.3)"
            }}
          >
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 opacity-20"
                style={{ background: "radial-gradient(ellipse at center, #a855f7, transparent 70%)" }} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Готов к первому квесту? 🎯
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Начни с аэропорта и пройди весь путь до работы мечты. Каждый день — новые задания и награды.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-glow-purple px-8 py-4 rounded-2xl font-bold text-white text-lg flex items-center gap-2"
                >
                  <Zap size={20} />
                  Открыть дашборд
                </motion.button>
              </Link>
              <Link href="/tests">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-card px-8 py-4 rounded-2xl font-bold text-white text-lg"
                >
                  Пройти тест уровня
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

      </div>
    </PageLayout>
  );
}
