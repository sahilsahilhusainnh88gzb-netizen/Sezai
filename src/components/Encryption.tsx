import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, Share2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

interface EncryptionProps {
  onBack: () => void;
}

export const Encryption: React.FC<EncryptionProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [cipherMap, setCipherMap] = useState<Record<string, string>>({});
  const [keyPreview, setKeyPreview] = useState('');

  const generateCipher = () => {
    const chars = LETTERS.split('');
    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    const newMap: Record<string, string> = {};
    
    chars.forEach((char, i) => {
      newMap[char] = shuffled[i];
    });

    setCipherMap(newMap);
    setKeyPreview(`A→${shuffled[0]} B→${shuffled[1]} C→${shuffled[2]}...`);
  };

  useEffect(() => {
    generateCipher();
  }, []);

  const processText = (encrypt: boolean) => {
    if (!input.trim()) return;

    let result = '';
    if (encrypt) {
      result = input.split('').map(char => cipherMap[char] || char).join('');
      setOutput(`🔐 Encrypted:\n\n${result}`);
    } else {
      const reverseMap: Record<string, string> = {};
      (Object.entries(cipherMap) as [string, string][]).forEach(([key, value]) => {
        reverseMap[value] = key;
      });
      result = input.split('').map(char => reverseMap[char] || char).join('');
      setOutput(`🔓 Decrypted:\n\n${result}`);
    }
  };

  const shareText = () => {
    if (!output) return;
    const textToShare = output + "\n\n⚡ SEZ AI 2026";
    if (navigator.share) {
      navigator.share({ text: textToShare });
    } else {
      navigator.clipboard.writeText(textToShare);
      console.log('Copied to clipboard!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-zinc-50 p-8 max-w-2xl mx-auto w-full transition-colors duration-500"
    >
      <div className="flex items-center mb-10">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl mr-4 transition-all shadow-sm border border-zinc-100">
          <ArrowLeft className="w-5 h-5 text-indigo-600" />
        </button>
        <h1 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">Encryption</h1>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pb-20 pr-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Input Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 p-5 glass rounded-[2rem] focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-[15px] leading-relaxed shadow-xl shadow-indigo-500/5 transition-all"
            placeholder="Type or paste your secret message..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">SEZ AI Key</label>
          <div className="flex items-center gap-3 glass p-4 rounded-[2rem] shadow-xl shadow-indigo-500/5">
            <span className="flex-1 font-mono text-xs text-zinc-500 truncate ml-2">{keyPreview}</span>
            <button onClick={generateCipher} className="p-2.5 hover:bg-indigo-50 rounded-2xl transition-all">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => processText(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-[2rem] font-display font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <Lock className="w-4 h-4" /> Encrypt
          </button>
          <button
            onClick={() => processText(false)}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white py-4 rounded-[2rem] font-display font-bold hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
          >
            <Unlock className="w-4 h-4" /> Decrypt
          </button>
        </div>

        {output && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Result</label>
            <div className="w-full min-h-[120px] p-6 glass rounded-[2rem] whitespace-pre-wrap font-mono text-sm shadow-2xl shadow-indigo-500/10">
              {output}
            </div>
          </motion.div>
        )}

        {output && (
          <button
            onClick={shareText}
            className="w-full flex items-center justify-center gap-3 bg-indigo-50 text-indigo-600 py-4 rounded-[2rem] font-display font-bold hover:bg-indigo-100 transition-all active:scale-95"
          >
            <Share2 className="w-5 h-5" /> Share Result
          </button>
        )}

        <p className="text-center text-zinc-400 text-[10px] font-bold tracking-widest uppercase mt-12">⚡ Powered by SEZ YT</p>
      </div>
    </motion.div>
  );
};
