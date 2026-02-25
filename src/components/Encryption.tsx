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
      className="flex flex-col h-full bg-white p-4 max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft className="w-6 h-6 text-[#6200EE]" />
        </button>
        <h1 className="text-2xl font-bold text-[#6200EE]">🔐 SEZ Encryption</h1>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pb-20">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Enter Text:</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6200EE] focus:outline-none resize-none"
            placeholder="Type or paste here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Encryption Key:</label>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="flex-1 font-mono text-sm text-gray-500 truncate">{keyPreview}</span>
            <button onClick={generateCipher} className="p-1 hover:bg-gray-200 rounded transition-colors">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => processText(true)}
            className="flex items-center justify-center gap-2 bg-[#6200EE] text-white py-3 rounded-lg font-medium hover:bg-[#5000c7] transition-colors"
          >
            <Lock className="w-4 h-4" /> Encrypt
          </button>
          <button
            onClick={() => processText(false)}
            className="flex items-center justify-center gap-2 bg-[#03DAC6] text-black py-3 rounded-lg font-medium hover:bg-[#02b8a7] transition-colors"
          >
            <Unlock className="w-4 h-4" /> Decrypt
          </button>
        </div>

        {output && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="block text-sm font-medium text-gray-600 mb-1">Result:</label>
            <div className="w-full min-h-[100px] p-3 bg-gray-100 border border-gray-200 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {output}
            </div>
          </motion.div>
        )}

        {output && (
          <button
            onClick={shareText}
            className="w-full flex items-center justify-center gap-2 bg-[#03DAC6] text-black py-3 rounded-lg font-medium hover:bg-[#02b8a7] transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">⚡ Powered by SEZ YT</p>
      </div>
    </motion.div>
  );
};
