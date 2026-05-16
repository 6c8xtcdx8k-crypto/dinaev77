"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Timer, Trophy, CheckCircle, XCircle, ChevronRight, RotateCcw, Zap } from "lucide-react";

type TestState = "select" | "running" | "result";

const testCategories = [
  { id: "airport", name: "Аэропорт", emoji: "✈️", color: "#3b82f6", questions: 10, xp: 150 },
  { id: "hospital", name: "Больница", emoji: "🏥", color: "#10b981", questions: 10, xp: 150 },
  { id: "shopping", name: "Магазин", emoji: "🛒", color: "#f59e0b", questions: 8, xp: 120 },
  { id: "bank", name: "Банк", emoji: "🏦", color: "#8b5cf6", questions: 10, xp: 160 },
  { id: "housing", name: "Жильё", emoji: "🏠", color: "#ec4899", questions: 10, xp: 160 },
  { id: "work", name: "Работа", emoji: "💼", color: "#f97316", questions: 12, xp: 200 },
  { id: "transport", name: "Транспорт", emoji: "🚌", color: "#06b6d4", questions: 8, xp: 120 },
  { id: "emergency", name: "Экстренные", emoji: "🚨", color: "#ef4444", questions: 8, xp: 200 },
];

const allQuestions = [
  {
    id: 1, category: "airport", level: "A1",
    question: "You need to show this document at the gate. What is it?",
    options: ["Boarding pass", "Credit card", "Driver's license", "Library card"],
    answer: 0, explanation: "Boarding pass — посадочный талон. Его нужно показать при посадке на самолёт."
  },
  {
    id: 2, category: "airport", level: "A1",
    question: "The announcement says: 'Flight BA201 is ___ at Gate 7.' Choose the correct word.",
    options: ["boarding", "sleeping", "cooking", "swimming"],
    answer: 0, explanation: "Boarding = посадка. 'Flight is boarding' = идёт посадка на рейс."
  },
  {
    id: 3, category: "airport", level: "A2",
    question: "At customs, the officer asks: 'Anything to ___?' What's the correct word?",
    options: ["declare", "decide", "delete", "deliver"],
    answer: 0, explanation: "Declare — декларировать. 'Nothing to declare' — нечего задекларировать."
  },
  {
    id: 4, category: "hospital", level: "A2",
    question: "You want to see a doctor tomorrow. You should make an ___.",
    options: ["appointment", "agreement", "announcement", "argument"],
    answer: 0, explanation: "Appointment — запись к врачу. 'Make an appointment' = записаться."
  },
  {
    id: 5, category: "hospital", level: "B1",
    question: "The doctor says: 'Take this medicine twice a ___.' Complete the phrase.",
    options: ["day", "year", "century", "decade"],
    answer: 0, explanation: "Twice a day = дважды в день. Стандартное указание по приёму лекарств."
  },
  {
    id: 6, category: "shopping", level: "A1",
    question: "At the checkout: 'That will be $12.50. Cash or ___?'",
    options: ["card", "coin", "check", "chance"],
    answer: 0, explanation: "'Cash or card?' — наличными или картой? — стандартный вопрос кассира."
  },
  {
    id: 7, category: "bank", level: "B1",
    question: "You want to send money abroad. You need to make an international ___.",
    options: ["transfer", "translation", "transition", "transaction"],
    answer: 3, explanation: "Transaction = финансовая транзакция/операция. Transfer тоже верно, но transaction — более общее."
  },
  {
    id: 8, category: "housing", level: "B1",
    question: "Before moving in, you must sign the ___ with the landlord.",
    options: ["lease", "recipe", "map", "menu"],
    answer: 0, explanation: "Lease = договор аренды. Landlord = хозяин/арендодатель."
  },
  {
    id: 9, category: "work", level: "B1",
    question: "HR asks: 'What are your salary ___?' Choose the correct word.",
    options: ["expectations", "explanations", "exceptions", "exclamations"],
    answer: 0, explanation: "Salary expectations = зарплатные ожидания. Стандартный вопрос на собеседовании."
  },
  {
    id: 10, category: "transport", level: "A1",
    question: "You're lost on the subway. Which question is correct?",
    options: ["Excuse me, which line goes to Downtown?", "Where is my car go?", "I want subway where?", "Take me bus please?"],
    answer: 0, explanation: "'Excuse me, which line goes to...?' — вежливый и правильный способ спросить дорогу."
  },
  {
    id: 11, category: "emergency", level: "A2",
    question: "There's a fire! What's the emergency number in the USA?",
    options: ["911", "999", "112", "000"],
    answer: 0, explanation: "911 — экстренный номер в США и Канаде. В Европе — 112, в Великобритании — 999."
  },
  {
    id: 12, category: "airport", level: "B1",
    question: "Your flight is delayed. You want to know more. Ask: 'When will the flight ___?'",
    options: ["depart", "arrive", "depend", "depart or arrive"],
    answer: 3, explanation: "Можно спросить и depart (отбыть) и arrive (прибыть) — оба варианта подходят в контексте задержки."
  },
];

const TIME_LIMIT = 30;

export default function TestsPage() {
  const [state, setState] = useState<TestState>("select");
  const [category, setCategory] = useState<typeof testCategories[0] | null>(null);
  const [questions, setQuestions] = useState<typeof allQuestions>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [totalTime, setTotalTime] = useState(0);

  const startTest = (cat: typeof testCategories[0]) => {
    const qs = allQuestions.filter((q) => q.category === cat.id);
    const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, Math.min(5, qs.length));
    setCategory(cat);
    setQuestions(shuffled);
    setAnswers(Array(shuffled.length).fill(null));
    setCurrentIndex(0);
    setSelected(null);
    setShowExplanation(false);
    setTimeLeft(TIME_LIMIT);
    setTotalTime(0);
    setState("running");
  };

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setShowExplanation(false);
      setTimeLeft(TIME_LIMIT);
    } else {
      setState("result");
    }
  }, [currentIndex, questions.length]);

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setAnswers((prev) => {
            const n = [...prev];
            n[currentIndex] = -1;
            return n;
          });
          setShowExplanation(true);
          setTimeout(nextQuestion, 1500);
          return 0;
        }
        return t - 1;
      });
      setTotalTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state, currentIndex, nextQuestion]);

  const handleAnswer = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswers((prev) => {
      const n = [...prev];
      n[currentIndex] = optionIndex;
      return n;
    });
    setShowExplanation(true);
  };

  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const xpEarned = Math.round((percentage / 100) * (category?.xp ?? 0));

  return (
    <PageLayout>
      <div className="px-4 lg:px-8 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Тесты 📝</h1>
          <p className="text-gray-400">1000+ заданий по темам переезда с таймером и объяснениями</p>
        </motion.div>

        {/* Category select */}
        {state === "select" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {testCategories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTest(cat)}
                  className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-10 text-5xl flex items-center justify-center">
                    {cat.emoji}
                  </div>
                  <div className="text-3xl mb-3">{cat.emoji}</div>
                  <div className="font-bold text-white text-sm mb-1">{cat.name}</div>
                  <div className="text-gray-400 text-xs mb-2">{cat.questions} вопросов</div>
                  <div className="text-xs font-bold" style={{ color: cat.color }}>+{cat.xp} XP</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Running test */}
        {state === "running" && questions.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-2xl mx-auto"
            >
              {/* Progress & timer */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category?.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{category?.name}</div>
                    <div className="text-xs text-gray-400">{currentIndex + 1} / {questions.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                  <Timer size={16} className={timeLeft <= 10 ? "text-red-400" : "text-blue-400"} />
                  <span className={`font-bold ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-dark-600 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #a855f7, #3b82f6)" }}
                  initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Timer bar */}
              <div className="h-1 bg-dark-600 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: timeLeft > 10 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "linear-gradient(90deg, #ef4444, #f97316)",
                    width: `${(timeLeft / TIME_LIMIT) * 100}%`,
                  }}
                />
              </div>

              {/* Question */}
              <div className="glass-card rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                    {questions[currentIndex]?.level}
                  </span>
                </div>
                <p className="text-lg font-semibold text-white leading-relaxed mt-2">
                  {questions[currentIndex]?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-4">
                {questions[currentIndex]?.options.map((opt, i) => {
                  const isCorrect = i === questions[currentIndex].answer;
                  const isSelected = selected === i;
                  let style: React.CSSProperties = {
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)"
                  };
                  if (selected !== null) {
                    if (isCorrect) style = { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.5)" };
                    else if (isSelected) style = { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)" };
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={selected === null ? { scale: 1.01 } : {}}
                      whileTap={selected === null ? { scale: 0.99 } : {}}
                      onClick={() => handleAnswer(i)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                      style={style}
                      disabled={selected !== null}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: selected !== null && isCorrect
                            ? "rgba(16,185,129,0.3)"
                            : selected !== null && isSelected && !isCorrect
                            ? "rgba(239,68,68,0.3)"
                            : "rgba(168,85,247,0.2)",
                          color: selected !== null && isCorrect ? "#34d399"
                            : selected !== null && isSelected ? "#f87171"
                            : "#c084fc"
                        }}>
                        {["A", "B", "C", "D"][i]}
                      </div>
                      <span className="text-sm text-white flex-1">{opt}</span>
                      {selected !== null && isCorrect && <CheckCircle size={18} className="text-green-400 flex-shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 mb-4"
                    style={{
                      background: selected === questions[currentIndex]?.answer
                        ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${selected === questions[currentIndex]?.answer
                        ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`
                    }}
                  >
                    <div className="text-sm font-bold mb-1"
                      style={{ color: selected === questions[currentIndex]?.answer ? "#34d399" : "#f87171" }}>
                      {selected === questions[currentIndex]?.answer ? "✅ Правильно!" : "❌ Неправильно"}
                    </div>
                    <div className="text-sm text-gray-300">{questions[currentIndex]?.explanation}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showExplanation && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={nextQuestion}
                  className="btn-glow-purple w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? "Следующий вопрос" : "Завершить тест"}
                  <ChevronRight size={18} />
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Result */}
        {state === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="glass-card rounded-3xl p-8">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? "🏆" : percentage >= 60 ? "⭐" : "📚"}
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {percentage >= 80 ? "Отлично!" : percentage >= 60 ? "Хорошо!" : "Продолжай стараться!"}
              </h2>
              <div className="text-5xl font-black mb-1"
                style={{
                  color: percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444",
                  textShadow: `0 0 20px ${percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444"}66`
                }}>
                {percentage}%
              </div>
              <div className="text-gray-400 mb-6">{score} из {questions.length} правильно</div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Правильно", value: score, icon: "✅", color: "#10b981" },
                  { label: "Ошибки", value: questions.length - score, icon: "❌", color: "#ef4444" },
                  { label: "Время", value: `${totalTime}с`, icon: "⏱️", color: "#3b82f6" },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl text-center"
                    style={{ background: `${s.color}11`, border: `1px solid ${s.color}33` }}>
                    <div className="text-lg">{s.icon}</div>
                    <div className="font-bold text-white" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-6"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
                <div className="flex items-center justify-center gap-2">
                  <Zap size={18} className="text-purple-400" />
                  <span className="text-lg font-bold text-purple-300">+{xpEarned} XP заработано</span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setState("select")}
                  className="flex-1 py-3 rounded-xl font-medium text-white glass-card flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Другой тест
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => category && startTest(category)}
                  className="flex-1 btn-glow-purple py-3 rounded-xl font-medium text-white"
                >
                  Повторить
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
