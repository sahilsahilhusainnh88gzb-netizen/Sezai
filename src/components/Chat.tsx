import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Palette, Newspaper, CircleDollarSign, CloudSun, Bot, User, Mic, MicOff, Info, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { generateAIResponseStream, generateSpeech } from '../services/gemini';
import { Content } from '@google/genai';

interface ChatProps {
  onNavigate: (view: 'image-gen' | 'about') => void;
}

// Add type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Content[]>([]);
  const [input, setInput] = useState('');
  const [isToolsVisible, setIsToolsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechQueue = useRef<string[]>([]);
  const isSpeaking = useRef(false);

  useEffect(() => {
    const welcome = `Welcome to SEZ AI, how may I help you?`;

    setMessages([{
      id: '1',
      text: welcome,
      isAI: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        console.warn('Speech recognition is not supported in your browser.');
        return;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleVoice = () => {
    const newVoiceState = !isVoiceEnabled;
    setIsVoiceEnabled(newVoiceState);
    if (!newVoiceState) {
      // Stop speaking immediately if turned off
      window.speechSynthesis.cancel();
      speechQueue.current = [];
      isSpeaking.current = false;
    }
  };

  const processSpeechQueue = () => {
    if (!isVoiceEnabled || isSpeaking.current || speechQueue.current.length === 0) {
      if (!isVoiceEnabled) {
        speechQueue.current = [];
        isSpeaking.current = false;
      }
      return;
    }

    isSpeaking.current = true;
    const text = speechQueue.current.shift()!;
    
    // Improved cleaning: Remove ALL symbols, emojis, and markdown
    const cleanText = text
      .replace(/[^\w\s\u0900-\u097F,.!?]/g, '') // Keep alphanumeric, spaces, Hindi characters, and basic punctuation
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 2) {
      isSpeaking.current = false;
      processSpeechQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    
    utterance.onend = () => {
      isSpeaking.current = false;
      // Small delay between sentences for natural flow
      setTimeout(processSpeechQueue, 100);
    };

    utterance.onerror = () => {
      isSpeaking.current = false;
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakChunk = (text: string) => {
    if (!isVoiceEnabled) return;
    speechQueue.current.push(text);
    processSpeechQueue();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return; // Prevent multiple simultaneous requests from same user

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      isAI: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      text: '',
      isAI: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, aiMsg]);

    let fullResponse = '';
    let sentenceBuffer = '';

    // Stop any ongoing speech for new request
    window.speechSynthesis.cancel();
    speechQueue.current = [];
    isSpeaking.current = false;

    try {
      const response = await generateAIResponseStream(input, history, (chunk) => {
        fullResponse += chunk;
        sentenceBuffer += chunk;

        // Update UI
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullResponse } : m));
        setIsTyping(false);

        // Speak sentences as they arrive - wait for natural pauses to avoid stuttering
        if (isVoiceEnabled) {
          // Look for sentence endings: . ! ? or newline
          const parts = sentenceBuffer.split(/([.!?\n]+)/);
          if (parts.length > 2) {
            // We have at least one complete sentence
            const completedSentence = parts[0] + parts[1];
            speakChunk(completedSentence);
            sentenceBuffer = parts.slice(2).join('');
          }
        }
      });

      // Speak remaining buffer if it's long enough or ends the response
      if (isVoiceEnabled && sentenceBuffer.trim()) {
        speakChunk(sentenceBuffer);
      }

      // Update history state
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: input }] },
        { role: 'model', parts: [{ text: response }] }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Sez ai is currently under Mentinanc please try after some time" } : m));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-[#6200EE] to-[#7C4DFF] text-white h-14 flex items-center px-4 shadow-lg z-10">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsToolsVisible(!isToolsVisible)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
        <h1 className="flex-1 text-center font-bold text-xl tracking-tight">⚡ SEZ AI</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Quick Tools */}
      <AnimatePresence>
        {isToolsVisible && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white overflow-hidden border-b border-gray-100 shadow-sm"
          >
            <div className="flex justify-around p-3">
              <ToolButton icon={<Palette />} onClick={() => onNavigate('image-gen')} label="Art" />
              <ToolButton icon={<Info />} onClick={() => onNavigate('about')} label="About" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex max-w-[90%] ${msg.isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm ${msg.isAI ? 'bg-white border border-gray-100 mr-2' : 'bg-[#6200EE] ml-2'}`}>
                  {msg.isAI ? <Bot className="w-5 h-5 text-[#6200EE]" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div className="flex flex-col group relative">
                  <div className={`p-4 rounded-2xl text-[15px] shadow-sm leading-relaxed ${
                    msg.isAI 
                      ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' 
                      : 'bg-[#6200EE] text-white rounded-tr-none'
                  }`}>
                    {msg.isAI ? (
                      <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                  </div>
                  
                  {/* Copy Button */}
                  <motion.button
                    initial={{ opacity: 0.6 }}
                    whileHover={{ opacity: 1, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`absolute -top-2 ${msg.isAI ? '-right-2' : '-left-2'} p-2 bg-white border border-gray-100 rounded-lg shadow-md text-gray-500 hover:text-[#6200EE] transition-all z-20 flex items-center justify-center`}
                    onClick={() => handleCopy(msg.text, msg.id)}
                    title="Copy to clipboard"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>

                  <span className={`text-[10px] text-gray-400 mt-1 font-medium ${msg.isAI ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 px-4 py-2 rounded-full text-xs text-[#6200EE] font-medium shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  className="w-1 h-1 bg-[#6200EE] rounded-full"
                ></motion.div>
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  className="w-1 h-1 bg-[#6200EE] rounded-full"
                ></motion.div>
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  className="w-1 h-1 bg-[#6200EE] rounded-full"
                ></motion.div>
              </div>
              SEZ AI is thinking...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-[#6200EE] focus-within:ring-2 focus-within:ring-[#6200EE]/10 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask SEZ AI anything..."
            className="flex-1 bg-transparent py-2 text-[15px] outline-none resize-none max-h-32 min-h-[24px]"
            rows={1}
          />
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-all ${isVoiceEnabled ? 'text-[#6200EE] bg-[#6200EE]/10' : 'text-gray-400 hover:text-[#6200EE]'}`}
            title={isVoiceEnabled ? "Voice Mode On" : "Voice Mode Off"}
          >
            {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-[#6200EE]'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-[#6200EE] text-white rounded-xl disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#6200EE]/20"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
  <motion.button 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-all group"
  >
    <div className="p-2.5 rounded-xl bg-gray-50 text-gray-600 group-hover:bg-[#6200EE]/5 group-hover:text-[#6200EE] transition-all">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : icon}
    </div>
    <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#6200EE]">{label}</span>
  </motion.button>
);
