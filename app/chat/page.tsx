"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Send, Bot, User, Zap, Volume2 } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
  typing?: boolean;
}

const QUICK_REPLIES = [
  "Как сказать «Мне плохо» по-английски?",
  "Помоги с диалогом в аэропорту",
  "Объясни Present Perfect простыми словами",
  "Как вежливо отказать на работе?",
  "Фразы для аренды квартиры",
];

const AI_RESPONSES: Record<string, string> = {
  "привет": "Привет! 👋 Я твой AI-помощник в изучении английского. Могу помочь с грамматикой, словами, фразами для реальных ситуаций. Что тебя интересует?",
  "как сказать «мне плохо» по-английски?": "Вот несколько способов:\n\n• **\"I feel sick\"** — мне плохо / меня тошнит\n• **\"I don't feel well\"** — я плохо себя чувствую (мягче)\n• **\"I feel terrible\"** — мне ужасно\n\nВ больнице лучше говорить: _\"I'm not feeling well, I need to see a doctor.\"_\n\n💡 Попробуй пройти квест «На приёме у врача» для практики!",
  "помоги с диалогом в аэропорту": "Конечно! Вот типичный диалог при регистрации:\n\n**Стойка регистрации:**\n— _\"Your passport and boarding pass, please.\"_\n— ✅ \"Here you are.\"\n\n**Место:**\n— _\"Do you prefer window or aisle?\"_\n— ✅ \"Window seat, please.\"\n\n**Багаж:**\n— _\"Any checked luggage?\"_\n— ✅ \"Yes, one suitcase.\"\n\nХочешь потренировать этот диалог? Перейди в квест ✈️ **Аэропорт**!",
  "объясни present perfect простыми словами": "Present Perfect — это когда что-то случилось в прошлом, но важно **сейчас**.\n\n**Формула:** have/has + V3 (3-я форма глагола)\n\n**Примеры:**\n• _I **have lost** my passport._ — Я потерял паспорт (и сейчас его нет)\n• _She **has called** the doctor._ — Она позвонила врачу (и это важно сейчас)\n\n**Подсказка:** слова-маркеры — already, just, never, ever, yet.\n\n📚 Найдёшь полное объяснение в разделе **Грамматика**!",
  "как вежливо отказать на работе?": "Вот вежливые способы отказать:\n\n**На предложение:**\n• _\"I appreciate the offer, but I need to decline.\"_\n• _\"Thank you, but it's not the right fit for me.\"_\n\n**На задачу:**\n• _\"I'm afraid I can't take this on right now.\"_\n• _\"Could we revisit this later?\"_\n\n**На встречу:**\n• _\"I'm unavailable at that time. Could we reschedule?\"_\n\n💼 Практикуй в квесте **Работа → Первый день в офисе**!",
  "фразы для аренды квартиры": "Ключевые фразы:\n\n**При просмотре:**\n• _\"Is utilities included in the rent?\"_ — Коммунальные включены?\n• _\"How long is the lease?\"_ — На какой срок договор?\n• _\"Are pets allowed?\"_ — Разрешены ли животные?\n\n**С хозяином:**\n• _\"When can I move in?\"_ — Когда можно въехать?\n• _\"Can I see the contract?\"_ — Можно посмотреть договор?\n\n🏠 Пройди квест **Жильё → Просмотр квартиры** для полного диалога!",
};

function getTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function findResponse(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) return AI_RESPONSES[key];
  }
  return `Отличный вопрос! 🤔\n\nДля этой темы рекомендую:\n• Раздел **Учёба** → найди нужные слова и фразы\n• Раздел **Квесты** → практикуй в реальных диалогах\n\nПопробуй спросить что-то конкретное, например:\n_«Как сказать... по-английски?»_ или _«Помоги с диалогом в...»_`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, role: "assistant", time: getTime(),
      text: "Привет! 👋 Я **Max**, твой AI-помощник в изучении английского.\n\nМогу помочь с:\n• Переводом фраз\n• Объяснением грамматики\n• Диалогами для реальных ситуаций\n\nЧем могу помочь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now(), role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = findResponse(text);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: response, time: getTime() },
      ]);
    }, 1200 + Math.random() * 800);
  };

  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
          if (part.startsWith("_") && part.endsWith("_"))
            return <em key={j} className="text-blue-300 not-italic">{part.slice(1, -1)}</em>;
          return <span key={j}>{part}</span>;
        })}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 lg:px-8 py-5 flex items-center gap-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Bot size={22} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2"
              style={{ borderColor: "#080b14" }} />
          </div>
          <div>
            <div className="font-bold text-white">Max AI</div>
            <div className="text-xs text-green-400">Онлайн · Готов помочь</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <Zap size={12} className="text-purple-400" />
            <span>AI-помощник по английскому</span>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                  msg.role === "assistant"
                    ? ""
                    : ""
                }`}
                  style={msg.role === "assistant"
                    ? { background: "linear-gradient(135deg, #a855f7, #3b82f6)" }
                    : { background: "linear-gradient(135deg, #1a2236, #252f45)", border: "1px solid rgba(168,85,247,0.3)" }
                  }>
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm"
                      : "rounded-tl-sm"
                  }`}
                    style={msg.role === "assistant"
                      ? { background: "rgba(19,25,41,0.9)", border: "1px solid rgba(168,85,247,0.2)", color: "#e2e8f0" }
                      : { background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "white" }
                    }>
                    {renderText(msg.text)}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-gray-600">{msg.time}</span>
                    {msg.role === "assistant" && (
                      <button className="text-gray-600 hover:text-purple-400 transition-colors">
                        <Volume2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                  style={{ background: "rgba(19,25,41,0.9)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-400"
                      animate={{ y: [-3, 0, -3] }}
                      transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="px-4 lg:px-8 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr}
              onClick={() => sendMessage(qr)}
              disabled={isTyping}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 lg:px-8 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(19,25,41,0.9)", border: "1px solid rgba(168,85,247,0.25)" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Напиши вопрос по-русски или по-английски..."
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none resize-none"
                style={{ maxHeight: 100 }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
            >
              <Send size={18} />
            </motion.button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-600">Enter — отправить · Shift+Enter — новая строка</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
