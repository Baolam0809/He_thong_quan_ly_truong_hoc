import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  MessageSquare, 
  User, 
  RefreshCw, 
  ArrowRight, 
  HelpCircle,
  GraduationCap,
  Calendar,
  BookOpen,
  Trophy
} from 'lucide-react';
import { Account } from '../types';
import { showToast } from './Toast';

interface AIAssistantProps {
  currentUser: Account | null;
  inlineMode?: boolean; // if true, render as a regular section, if false render as floating bubble
  onCloseFloating?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  {
    text: "Làm sao đăng ký khóa học?",
    icon: GraduationCap,
    category: "Học vụ"
  },
  {
    text: "Xem lịch thi & thời khóa biểu ở đâu?",
    icon: Calendar,
    category: "Lịch trình"
  },
  {
    text: "Quy chế đánh giá hạnh kiểm thế nào?",
    icon: BookOpen,
    category: "Quy chế"
  },
  {
    text: "Lớp học xuất sắc tuần này là lớp nào?",
    icon: Trophy,
    category: "Thi đua"
  }
];

export default function AIAssistant({ currentUser, inlineMode = true, onCloseFloating }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Welcome message based on user
    const welcomeText = currentUser 
      ? `Xin chào **${currentUser.name}** (${currentUser.role})! Mình là Trợ lý Học thuật AI (HPAI) của trường THCS Hòa Phú. Mình có thể giúp gì cho bạn hôm nay?`
      : `Xin chào Quý khách! Mình là Trợ lý Học thuật AI (HPAI) trường THCS Hòa Phú. Bạn cần mình giải đáp thắc mắc nào về học vụ hoặc hoạt động trường học không ạ?`;

    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build full payload containing message history to preserve context
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Không thể kết nối máy chủ AI.");
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.reply || "Xin lỗi, mình chưa nhận diện được phản hồi phù hợp.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("AI assistant error:", error);
      showToast(error.message || "Lỗi kết nối Trợ lý AI", "error");
      
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "⚠️ **Rất tiếc!** Hệ thống Trợ lý AI đang bận hoặc thiếu cấu hình API Key. Bạn vui lòng thử lại sau hoặc liên hệ Quản trị viên để được hỗ trợ trực tiếp.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Bạn có muốn làm mới lịch sử cuộc trò chuyện không?")) {
      const welcomeText = currentUser 
        ? `Lịch sử đã được làm sạch. Xin chào **${currentUser.name}**! Mình sẵn sàng hỗ trợ các câu hỏi mới.`
        : `Lịch sử đã được làm sạch. Sẵn sàng hỗ trợ Quý khách những câu hỏi mới về học đường.`;

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date()
        }
      ]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to parse simple markdown bold **text** for school-friendly UI
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Render for full dedicated tab page
  if (inlineMode) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px]" id="ai-assistant-full-view">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 animate-pulse">
              <Bot className="w-6 h-6 text-brand-orange-light" />
            </div>
            <div>
              <h2 className="font-black text-sm md:text-base flex items-center gap-1.5 uppercase tracking-wide">
                Trợ lý Học thuật AI (HPAI)
                <span className="bg-brand-orange text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-90">Beta</span>
              </h2>
              <p className="text-[11px] opacity-80 font-medium">Sẵn sàng trả lời thắc mắc học vụ 24/7 của THCS Hòa Phú</p>
            </div>
          </div>
          <button 
            onClick={handleClearHistory}
            className="p-2 hover:bg-white/10 text-white rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Làm mới cuộc trò chuyện"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Box */}
          <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.role === 'user' 
                        ? 'bg-blue-50 text-brand-blue border-blue-200' 
                        : 'bg-amber-50 text-brand-orange border-amber-200'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className={`p-3.5 rounded-2xl shadow-sm text-xs md:text-[13px] leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-brand-blue to-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {renderMessageContent(msg.content)}
                      </div>
                      <span className={`text-[9px] font-bold text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex gap-3 max-w-[75%]">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-brand-orange border border-amber-200 flex items-center justify-center shrink-0 animate-bounce">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white text-slate-500 border border-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    <span>HPAI đang suy nghĩ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters Panel at Bottom above input */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 md:px-6 py-3 border-t border-slate-200 bg-white shrink-0">
                <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                  Gợi ý câu hỏi nhanh:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_QUESTIONS.map((q, idx) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(q.text)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-brand-blue hover:bg-blue-50/20 text-left text-[11px] md:text-xs font-bold text-slate-700 transition cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-brand-blue flex items-center justify-center shrink-0 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 truncate">
                          <span className="block text-[9px] text-slate-400 font-extrabold uppercase">{q.category}</span>
                          <span className="block truncate">{q.text}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-350 group-hover:text-brand-blue opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-4 border-t border-slate-200 bg-white flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Đặt câu hỏi học tập, lịch thi, hướng dẫn học vụ..."
                className="flex-1 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:bg-white font-semibold transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  input.trim() && !isLoading
                    ? 'bg-brand-blue text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

          {/* Sidebar Guidelines Panel */}
          <div className="hidden lg:flex w-72 border-l border-slate-200 flex-col bg-slate-50/50 p-5 space-y-4 overflow-y-auto">
            <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-200 pb-2">
              <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
              Hướng dẫn tương tác
            </h3>
            
            <div className="space-y-3.5 text-[11px] leading-relaxed text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-150">
                <b className="text-slate-800 block mb-1">🎯 Mục tiêu của Trợ lý:</b>
                Hỗ trợ giải đáp nhanh các thắc mắc về tính năng của Cổng Giáo Vụ Số và cung cấp kiến thức học đường hữu ích.
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-150">
                <b className="text-indigo-700 block mb-1">🤖 Công nghệ tích hợp:</b>
                Hệ thống được vận hành bởi mô hình thế hệ mới nhất của Google **Gemini 3.5 Flash** trực tiếp từ máy chủ an toàn.
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <b className="text-amber-800 block mb-1">💡 Mẹo nhỏ:</b>
                Bạn có thể bấm trực tiếp các **Gợi ý câu hỏi nhanh** ở khung trò chuyện để HPAI giải quyết tức thì.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render as Floating Chat Widget (Bottom-Right)
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      className="fixed bottom-6 right-6 w-80 md:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-50"
      id="ai-assistant-floating-view"
    >
      {/* Mini Header */}
      <div className="bg-gradient-to-r from-brand-blue to-blue-700 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-orange-light animate-bounce" />
          <div>
            <h3 className="font-extrabold text-xs flex items-center gap-1">
              Trợ lý AI Hòa Phú
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
            </h3>
            <span className="text-[10px] opacity-75 font-medium block">Hỗ trợ giáo học số 24/7</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleClearHistory}
            className="p-1 hover:bg-white/10 rounded-md text-white transition cursor-pointer"
            title="Làm mới lịch sử"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onCloseFloating}
            className="p-1 hover:bg-white/10 rounded-md text-white transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Mini Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50 space-y-3 text-xs">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === 'user' ? 'bg-blue-50 text-brand-blue border-blue-200' : 'bg-amber-50 text-brand-orange border-amber-200'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col">
              <div className={`p-2.5 rounded-xl shadow-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-blue text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {renderMessageContent(msg.content)}
              </div>
              <span className={`text-[8px] font-semibold text-slate-400 mt-0.5 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 max-w-[75%]">
            <div className="w-7 h-7 rounded-full bg-amber-50 text-brand-orange border border-amber-200 flex items-center justify-center shrink-0 animate-bounce">
              <Bot className="w-3 h-3" />
            </div>
            <div className="bg-white text-slate-500 border border-slate-100 p-2.5 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1 text-[11px] font-bold">
              <span className="w-1 h-1 rounded-full bg-brand-orange animate-bounce"></span>
              <span>Đang phản hồi...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mini Quick starters */}
      {messages.length === 1 && !isLoading && (
        <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
          <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Gợi ý nhanh:</span>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_QUESTIONS.slice(0, 2).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.text)}
                className="p-1.5 rounded-lg border border-slate-150 hover:border-brand-blue text-left text-[10px] font-bold text-slate-700 truncate cursor-pointer transition block"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mini Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-slate-200 bg-white flex gap-1.5 items-center shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi HPAI..."
          className="flex-1 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/50 focus:bg-white font-semibold transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${
            input.trim() && !isLoading ? 'bg-brand-blue text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
