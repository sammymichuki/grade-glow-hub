import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  ListOrdered,
  HelpCircle,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiTutorService } from '../services/aiTutorService';
import {
  GlowBotMessage,
  SocraticContext,
  SocraticMode,
} from '../types/aiTutor';

interface GlowBotChatDrawerProps {
  context?: SocraticContext;
  initiallyOpen?: boolean;
  inline?: boolean;
  className?: string;
}

export const GlowBotChatDrawer: React.FC<GlowBotChatDrawerProps> = ({
  context = {
    subject: 'Mathematics',
    gradeLevel: 7,
    topic: 'Fractions & Proportions',
  },
  initiallyOpen = false,
  inline = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [socraticMode, setSocraticMode] = useState<SocraticMode>('hint');
  const [messages, setMessages] = useState<GlowBotMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting or persisted history
  useEffect(() => {
    const history = AiTutorService.loadHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      const greeting: GlowBotMessage = {
        id: 'bot-welcome',
        role: 'assistant',
        content: `👋 Jambo! I'm **GlowBot**, your personal Socratic study buddy for **${context.subject}** (${context.topic}).\n\nI won't give you direct answers, but I'll guide you step-by-step so you can master the concept yourself! Where would you like to start?`,
        timestamp: Date.now(),
        quickPrompts: [
          'Give me a conceptual hint',
          'Break down the problem step-by-step',
          'Check my current reasoning',
        ],
      };
      setMessages([greeting]);
    }
  }, [context.subject, context.topic]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: GlowBotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate natural thinking delay outside test environment
      if (process.env.NODE_ENV !== 'test') {
        await new Promise(r => setTimeout(r, 300));
      }
      const response = await AiTutorService.askGlowBot(text, context, socraticMode);
      setMessages(prev => [...prev, response]);
    } catch {
      const fallback: GlowBotMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble analyzing that question right now. Let's try breaking it into a simpler first step!",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    AiTutorService.clearHistory();
    const freshGreeting: GlowBotMessage = {
      id: `fresh-${Date.now()}`,
      role: 'assistant',
      content: `Ready for a new inquiry! How can I scaffold your learning in **${context.topic}**?`,
      timestamp: Date.now(),
      quickPrompts: ['Explain the core concept', 'Give me a hint', 'Show an example'],
    };
    setMessages([freshGreeting]);
  };

  if (inline) {
    return (
      <div className={`rounded-xl border border-purple-200 bg-white shadow-md overflow-hidden ${className}`}>
        {/* Inline Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-education-primary p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ring-2 ring-white/30">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide">GlowBot Socratic Tutor</h3>
                <span className="text-[10px] bg-emerald-400 text-emerald-950 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Child-Safe
                </span>
              </div>
              <p className="text-xs text-purple-100">{context.subject} &bull; {context.topic}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearChat}
            className="text-white hover:bg-white/20 text-xs h-8"
            title="Reset Conversation"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>

        {/* Inline Chat Content */}
        <div ref={chatScrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : msg.safetyFlagged
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {msg.suggestedSteps && (
                  <div className="mt-2.5 pt-2 border-t border-purple-100/40 text-xs">
                    <p className="font-semibold text-purple-900 mb-1 flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5" /> Recommended Steps:
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-gray-700">
                      {msg.suggestedSteps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {msg.quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(p)}
                      className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Lightbulb className="h-3 w-3" /> {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-purple-600 text-xs p-2">
              <Bot className="h-4 w-4 animate-spin" />
              <span>GlowBot is pondering a Socratic hint...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask a question about ${context.topic}...`}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            size="sm"
            aria-label="Send message"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Floating Drawer Mode
  return (
    <>
      {/* Floating Activator Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-white/50"
          aria-label="Open GlowBot AI Tutor"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="font-semibold text-sm">GlowBot AI</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">Hints</span>
        </button>
      )}

      {/* Floating Dialog Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded ? 'w-[90vw] md:w-[680px] h-[80vh]' : 'w-[92vw] sm:w-[420px] h-[550px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-education-primary p-3.5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">GlowBot Socratic Tutor</span>
                  <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1.5 py-0.2 rounded font-semibold">
                    COPPA Safe
                  </span>
                </div>
                <p className="text-[11px] text-purple-200 line-clamp-1">{context.subject}: {context.topic}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-purple-200 hover:text-white hover:bg-white/10"
                aria-label="Toggle drawer size"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-purple-200 hover:text-white hover:bg-white/10"
                aria-label="Close GlowBot drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Socratic Strategy Selector */}
          <div className="px-3 py-2 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs">
            <span className="text-purple-800 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-600" /> Mode:
            </span>
            <div className="flex space-x-1">
              {(['hint', 'scaffold', 'counter-example', 'reflection'] as SocraticMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSocraticMode(mode)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                    socraticMode === mode
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  {mode === 'scaffold' ? 'Steps' : mode === 'counter-example' ? 'Test Why' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gray-50/50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : msg.safetyFlagged
                      ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {msg.suggestedSteps && (
                    <div className="mt-2 pt-2 border-t border-purple-100 text-xs">
                      <p className="font-semibold text-purple-900 mb-1">Guiding Steps:</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-gray-700">
                        {msg.suggestedSteps.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 max-w-[85%]">
                    {msg.quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(p)}
                        className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-1.5 text-purple-600 text-xs p-1">
                <Bot className="h-3.5 w-3.5 animate-spin" />
                <span>GlowBot is crafting a Socratic hint...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask for a hint or test your reasoning..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              size="sm"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-3"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlowBotChatDrawer;
