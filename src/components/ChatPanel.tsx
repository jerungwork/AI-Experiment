import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Terminal, Network, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';
import { lmlaService } from '../lmlaService';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onStop: () => void;
  isProcessing: boolean;
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  inputValue: string;
  onInputChange: (val: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onStop,
  isProcessing,
  selectedMessageId,
  onSelectMessage,
  inputValue,
  onInputChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.4);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center rounded-lg shadow-sm">
            <span className="text-white font-bold text-xs">LMLA</span>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-700 underline underline-offset-4 decoration-indigo-200">
            LINGUISTIC-MLA PROTOTYPE
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-mono uppercase leading-tight tracking-tighter">Primary Processor</span>
            <span className="text-[11px] font-medium text-slate-600">Gemini Flash v3.0</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-200"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-mono uppercase leading-tight tracking-tighter">Deep MoE Search</span>
            <span className="text-[11px] font-medium text-slate-600">Gemini Pro v3.1</span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
            <Network className="w-12 h-12 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">MLA Layer: 6-Variable Isotopic Structure Active</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelectMessage(msg.id)}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group cursor-pointer`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200 border ${
              msg.role === 'user' 
                ? 'bg-slate-100 border-slate-200 text-slate-800' 
                : 'bg-indigo-50 border-indigo-100 text-slate-700 shadow-sm'
            } ${selectedMessageId === msg.id ? 'ring-2 ring-accent/20 ring-offset-1' : ''}`}>
               {msg.content}
               {msg.status === 'processing' && (
                <div className="flex gap-1 mt-2">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
              )}
            </div>
            <span className={`text-[10px] mt-2 uppercase font-semibold tracking-wider ${
              msg.role === 'user' ? 'mr-2 text-slate-400' : 'ml-2 text-indigo-400'
            }`}>
              {msg.role === 'user' ? 'USER / DECODING' : 'LMLA-ENCODED RESPONSE'}
            </span>
            {msg.status === 'error' && (
              <div className="mx-2 mt-1 flex items-center gap-1.5 text-rose-500 text-[10px] font-bold uppercase">
                <AlertCircle className="w-3 h-3" />
                Processing_Fail
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="relative flex flex-col group">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to structure via LMLA..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none resize-none transition-all placeholder:text-slate-400"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
             {isProcessing ? (
               <button
                 onClick={onStop}
                 className="bg-rose-500 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase transition-all flex items-center gap-1 shadow-sm hover:brightness-110 active:scale-95"
               >
                 <span>Stop</span>
                 <div className="w-2 h-2 bg-white" />
               </button>
             ) : (
               <button
                 onClick={handleSend}
                 disabled={!inputValue.trim()}
                 className="text-xs font-bold text-accent uppercase tracking-widest disabled:opacity-30 hover:opacity-80 transition-opacity p-2"
               >
                 SEND
               </button>
             )}
          </div>
        </div>
        <p className="mt-2 px-1 text-[10px] text-slate-400 font-medium">
          MLA Layer: 6-Variable Isotopic Structure Active
        </p>
      </div>

      <footer className="h-8 bg-slate-900 text-white flex items-center px-6 justify-between shrink-0">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            <span className="text-[10px] font-mono uppercase tracking-widest">KV_CACHE_LMLA: {isProcessing ? 'SYNCING' : 'OK'}</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          MLA LATENT ATTENTION MODULE // 0.04ms DECODE
        </div>
      </footer>
    </div>
  );
};
