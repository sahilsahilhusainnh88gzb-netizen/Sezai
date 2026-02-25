import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Palette, Newspaper, CircleDollarSign, CloudSun, Bot, User, Mic, MicOff, Info, Volume2, VolumeX, Copy, Check, Brain, Zap, MapPin, Image as ImageIcon, Video, X, History, Plus, Trash2, ThumbsUp, ThumbsDown, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ChatSession } from '../types';
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

const SezLogo = () => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-display font-bold text-[10px] tracking-tighter">
    SEZ
  </div>
);

export const Chat: React.FC<ChatProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Content[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState('');
  const [isToolsVisible, setIsToolsVisible] = useState(true); // Always visible now
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const [isMaps, setIsMaps] = useState(false);
  const [attachments, setAttachments] = useState<{ data: string, mimeType: string, name: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechQueue = useRef<string[]>([]);
  const isSpeaking = useRef(false);

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('sez_ai_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        const lastSession = parsed[0];
        setCurrentSessionId(lastSession.id);
        setMessages(lastSession.messages);
      } else {
        startNewSession();
      }
    } else {
      startNewSession();
    }

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

  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSessionId ? { ...s, messages } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem('sez_ai_sessions', JSON.stringify(updatedSessions));
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const startNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [{
        id: '1',
        text: "Welcome to SEZ AI, how may I help you?",
        isAI: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }],
      timestamp: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(newSession.messages);
    setHistory([]);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      // Reconstruct history for Gemini
      const newHistory: Content[] = [];
      session.messages.forEach(m => {
        if (m.id !== '1') { // Skip welcome
          newHistory.push({
            role: m.isAI ? 'model' : 'user',
            parts: [{ text: m.text }]
          });
        }
      });
      setHistory(newHistory);
      setShowHistory(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('sez_ai_sessions', JSON.stringify(updated));
    if (currentSessionId === id) {
      if (updated.length > 0) {
        loadSession(updated[0].id);
      } else {
        startNewSession();
      }
    }
  };

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

  const handleFeedback = (id: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: type } : m));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments(prev => [...prev, { 
          data: base64, 
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      isAI: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.map(a => ({ data: a.data, mimeType: a.mimeType }))
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachments = [...attachments];
    
    setInput('');
    setAttachments([]);
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
      const response = await generateAIResponseStream(
        currentInput || (currentAttachments.length > 0 ? "Analyze these files" : ""), 
        history, 
        (chunk) => {
          fullResponse += chunk;
          sentenceBuffer += chunk;

          // Update UI
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullResponse } : m));
          setIsTyping(false);

          // Speak sentences as they arrive
          if (isVoiceEnabled) {
            const parts = sentenceBuffer.split(/([.!?\n]+)/);
            if (parts.length > 2) {
              const completedSentence = parts[0] + parts[1];
              speakChunk(completedSentence);
              sentenceBuffer = parts.slice(2).join('');
            }
          }
        },
        {
          isThinking,
          isFast,
          isMaps,
          attachments: currentAttachments
        }
      );

      // If response came back but onChunk was never called (e.g. fallback error message)
      if (!fullResponse && response) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: response } : m));
        setIsTyping(false);
      }

      // Speak remaining buffer if it's long enough or ends the response
      if (isVoiceEnabled && sentenceBuffer.trim()) {
        speakChunk(sentenceBuffer);
      } else if (isVoiceEnabled && !fullResponse && response) {
        // Speak the fallback error message if voice is enabled
        speakChunk(response);
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
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden transition-colors duration-500">
      {/* Top Bar */}
      <header className="glass h-16 flex items-center px-6 shadow-sm z-20 sticky top-0">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(true)}
          className="p-2.5 hover:bg-zinc-100 rounded-2xl transition-all text-zinc-600"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
        <h1 className="flex-1 text-center font-display font-bold text-lg tracking-tight text-zinc-900">
          SEZ <span className="text-indigo-600">AI</span>
        </h1>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={startNewSession}
          className="p-2.5 hover:bg-zinc-100 rounded-2xl transition-all text-zinc-600"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden">
                    <SezLogo />
                  </div>
                  <span className="font-display font-bold text-xl text-zinc-900">Menu</span>
                </div>
                <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-zinc-50 rounded-full">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4 py-2">Quick Tools</p>
                <div className="grid grid-cols-2 gap-2">
                  <ToolButton 
                    icon={<Brain />} 
                    onClick={() => { setIsThinking(!isThinking); if (!isThinking) { setIsFast(false); setIsMaps(false); } }} 
                    label="Thinking" 
                    active={isThinking}
                  />
                  <ToolButton 
                    icon={<Zap />} 
                    onClick={() => { setIsFast(!isFast); if (!isFast) { setIsThinking(false); setIsMaps(false); } }} 
                    label="Fast" 
                    active={isFast}
                  />
                  <ToolButton 
                    icon={<MapPin />} 
                    onClick={() => { setIsMaps(!isMaps); if (!isMaps) { setIsThinking(false); setIsFast(false); } }} 
                    label="Maps" 
                    active={isMaps}
                  />
                  <ToolButton icon={<Palette />} onClick={() => { onNavigate('image-gen'); setShowMenu(false); }} label="Art" />
                </div>

                <div className="pt-6">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4 py-2">Navigation</p>
                  <button 
                    onClick={() => { setShowHistory(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-3xl transition-all text-zinc-700 font-medium"
                  >
                    <History className="w-5 h-5 text-indigo-600" />
                    <span>Chat History</span>
                  </button>
                  <button 
                    onClick={() => { setShowFeedbackModal(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-3xl transition-all text-zinc-700 font-medium"
                  >
                    <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
                    <span>Suggest Feature</span>
                  </button>
                  <button 
                    onClick={() => { onNavigate('about'); setShowMenu(false); }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-3xl transition-all text-zinc-700 font-medium"
                  >
                    <Info className="w-5 h-5 text-indigo-600" />
                    <span>About SEZ AI</span>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100">
                <button 
                  onClick={() => { startNewSession(); setShowMenu(false); }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-display font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> New Chat
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-zinc-900">Chat History</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-zinc-50 rounded-full">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {sessions.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No chat history yet</p>
                  </div>
                ) : (
                  sessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${
                        currentSessionId === session.id 
                          ? 'bg-indigo-50 border-indigo-100' 
                          : 'bg-zinc-50 border-transparent hover:border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          currentSessionId === session.id ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-400'
                        }`}>
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${currentSessionId === session.id ? 'text-indigo-900' : 'text-zinc-900'}`}>
                            {session.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 bg-zinc-50">
                <button 
                  onClick={startNewSession}
                  className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-display font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Start New Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
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
                <div className={`flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-lg shadow-sm ${msg.isAI ? 'mr-2' : 'ml-2 bg-[#6200EE]'}`}>
                  {msg.isAI ? <SezLogo /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div className="flex flex-col group relative max-w-[85%]">
                  <div className={`p-3 rounded-2xl text-[13px] shadow-sm leading-relaxed transition-all duration-300 ${
                    msg.isAI 
                      ? 'bg-white text-zinc-800 rounded-tl-none border border-zinc-100 shadow-indigo-500/5' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20'
                  }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-zinc-100">
                            {att.mimeType.startsWith('image/') ? (
                              <img src={att.data} alt="upload" className="w-32 h-32 object-cover" />
                            ) : (
                              <div className="w-32 h-32 bg-zinc-50 flex flex-col items-center justify-center p-2">
                                <Video className="w-8 h-8 mb-1" />
                                <span className="text-[8px] text-center truncate w-full">Video File</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.isAI ? (
                      <div className="markdown-body prose prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white text-[13px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-[13px]">{msg.text}</div>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-3 mt-2 ${msg.isAI ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {msg.timestamp}
                    </span>
                    {msg.isAI && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleFeedback(msg.id, 'positive')}
                          className={`p-1.5 rounded-lg transition-all ${msg.feedback === 'positive' ? 'text-green-600 bg-green-50' : 'text-zinc-400 hover:text-green-600 hover:bg-green-50'}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleFeedback(msg.id, 'negative')}
                          className={`p-1.5 rounded-lg transition-all ${msg.feedback === 'negative' ? 'text-red-600 bg-red-50' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-100 rounded-full shadow-sm text-[10px] font-bold text-zinc-500 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                      onClick={() => handleCopy(msg.text, msg.id)}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-end">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center mr-2 shadow-sm">
                <SezLogo />
              </div>
              <div className="bg-white border border-zinc-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex gap-1.5">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2">
        <div className="max-w-2xl mx-auto">
          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0, y: 10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: 10 }}
                className="flex flex-wrap gap-3 mb-4 overflow-x-auto pb-2"
              >
                {attachments.map((att, i) => (
                  <div key={i} className="relative group">
                    <div className="w-20 h-20 rounded-2xl border border-zinc-200 overflow-hidden bg-white flex items-center justify-center shadow-sm">
                      {att.mimeType.startsWith('image/') ? (
                        <img src={att.data} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-8 h-8 text-zinc-400" />
                      )}
                    </div>
                    <button 
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass rounded-[2rem] p-2 shadow-2xl shadow-indigo-500/5 flex items-end gap-2 border-zinc-200/50">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,video/*"
              multiple
            />
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ImageIcon className="w-5 h-5" />
            </motion.button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="SEZ AI"
              className="flex-1 bg-transparent py-3.5 px-2 text-[15px] outline-none resize-none max-h-[60vh] min-h-[24px] leading-relaxed overflow-y-auto"
              rows={1}
            />
            <div className="flex items-center gap-1 pb-1 pr-1">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoice}
                className={`p-3 rounded-2xl transition-all ${isVoiceEnabled ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100'}`}
                title={isVoiceEnabled ? "Voice Mode On" : "Voice Mode Off"}
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100'}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isTyping}
                className="p-3.5 bg-indigo-600 text-white rounded-2xl disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium tracking-wide uppercase">
            Powered by SEZ AI
          </p>
        </div>
      </div>
      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-display font-bold text-2xl text-zinc-900 mb-2">Suggest a Feature</h2>
              <p className="text-zinc-500 text-sm mb-6">Help us make SEZ AI better. What would you like to see next?</p>
              
              <textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe your idea..."
                className="w-full h-32 bg-zinc-50 border border-zinc-100 rounded-3xl p-4 text-sm outline-none focus:border-indigo-500 transition-all resize-none mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-3xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (feedbackText.trim()) {
                      alert("Thank you for your suggestion!");
                      setFeedbackText('');
                      setShowFeedbackModal(false);
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolButton = ({ icon, onClick, label, active }: { icon: React.ReactNode, onClick: () => void, label: string, active?: boolean }) => (
  <motion.button 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-all group"
  >
    <div className={`p-2.5 rounded-xl transition-all ${active ? 'bg-[#6200EE] text-white' : 'bg-gray-50 text-gray-600 group-hover:bg-[#6200EE]/5 group-hover:text-[#6200EE]'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : icon}
    </div>
    <span className={`text-[10px] font-medium transition-all ${active ? 'text-[#6200EE]' : 'text-gray-400 group-hover:text-[#6200EE]'}`}>{label}</span>
  </motion.button>
);
