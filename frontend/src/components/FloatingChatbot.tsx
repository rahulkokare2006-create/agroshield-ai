import React, { useState, useEffect, useRef } from 'react';
import { IconMic, IconVolume2, IconSend } from './Icons';
import { Language } from '../translations';

interface FloatingChatbotProps {
  language: Language;
  t: Record<string, string>;
  onSpeak: (text: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  source?: string;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ language, t, onSpeak }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        language === 'kn'
          ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕಿಸಾನ್ ಟೊಮೇಟೊ AI ಸಹಾಯಕ. ಟೊಮೇಟೊ ರೋಗಗಳು, ಗೊಬ್ಬರ ಅಥವಾ ಕೃಷಿ ಪದ್ಧತಿಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ."
          : language === 'mr'
          ? "नमस्कार! मी आपला किसान टोमॅटो AI सहाय्यक आहे. टोमॅटो पिकाबद्दल काहीही विचारा."
          : language === 'hi'
          ? "नमस्ते! मैं आपका किसान टमाटर AI सहायक हूँ। टमाटर की फसल के बारे में कुछ भी पूछें।"
          : "Hello! I am your Kisan Tomato AI Assistant. Ask me anything about tomato diseases, fertigation, or cultural practices.",
      source: "ICAR-IIHR Grounded Agronomy Repository",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language: language }),
      });
      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply_text,
        source: data.source_reference,
      };
      setMessages((prev) => [...prev, botMsg]);

      if (data.reply_audio_text) {
        onSpeak(data.reply_audio_text);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      language === 'kn' ? 'kn-IN' :
      language === 'mr' ? 'mr-IN' :
      language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(transcript);
        handleSend(transcript);
      }
    };

    recognition.start();
  };

  return (
    <>
      {/* Floating Chat Icon (Fixed at Bottom-Right of Website) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2">
        {!isOpen && (
          <span className="hidden md:inline-block px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-md border border-white/20 animate-pulse">
            💬 {t.floatingChatHint || 'Kisan AI'}
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-2xl shadow-2xl border-2 border-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative"
          title={t.chatbotTitle}
        >
          {isOpen ? '✕' : '💬'}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[9px] font-bold">
              AI
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[94vw] md:w-[420px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">👨‍🌾</span>
              <div>
                <h3 className="font-bold text-sm tracking-tight leading-none">
                  {t.chatbotTitle}
                </h3>
                <span className="text-[10px] text-emerald-100 font-medium">
                  {t.chatSubtitle}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-emerald-100 text-lg font-bold w-7 h-7 rounded-full bg-emerald-700/60 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Questions Chips */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto flex-shrink-0 text-xs">
            <button
              onClick={() => handleSend(t.suggestedQ1)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] font-medium transition cursor-pointer"
            >
              {t.suggestedQ1}
            </button>
            <button
              onClick={() => handleSend(t.suggestedQ2)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] font-medium transition cursor-pointer"
            >
              {t.suggestedQ2}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.source && (
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[9px] text-slate-400">
                      {t.chatSourcePrefix}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl p-2.5 text-xs text-slate-500 flex items-center space-x-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                  <span>ICAR-IIHR AI Reasoning...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleVoiceInput}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse border-rose-600'
                  : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200'
              }`}
              title="Voice Mic"
            >
              <IconMic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.chatPlaceholder}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition cursor-pointer shadow-xs"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
