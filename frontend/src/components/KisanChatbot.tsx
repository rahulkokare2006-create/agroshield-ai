import React, { useState, useEffect, useRef } from 'react';
import { IconMic, IconVolume2, IconSend } from './Icons';

interface KisanChatbotProps {
  language: string;
  t: Record<string, string>;
  onSpeak: (text: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  source?: string;
}

export const KisanChatbot: React.FC<KisanChatbotProps> = ({ language, t, onSpeak }) => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      // Automatically speak the response
      if (data.reply_audio_text) {
        onSpeak(data.reply_audio_text);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Voice Speech-to-Text handler
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
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            💬
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t.chatbotTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.chatSubtitle}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
          ICAR-IIHR Grounded
        </span>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="py-2.5 flex items-center space-x-2 overflow-x-auto flex-shrink-0 border-b border-slate-100">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">💡</span>
        {[t.suggestedQ1, t.suggestedQ2, t.suggestedQ3, t.suggestedQ4].map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-medium whitespace-nowrap border border-slate-200 transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-800 border border-slate-200'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              {msg.source && (
                <div className="mt-2 pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                  {t.chatSourcePrefix}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span>ICAR-IIHR AI Reasoning...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={handleVoiceInput}
          className={`p-3 rounded-2xl border transition cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse border-rose-600'
              : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200'
          }`}
          title="Voice Speech-to-Text"
        >
          <IconMic className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition cursor-pointer shadow-xs"
        >
          <IconSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
