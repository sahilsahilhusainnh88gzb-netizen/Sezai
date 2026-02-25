import React, { useState } from 'react';
import { Image as ImageIcon, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { generateImage } from '../services/gemini';

interface ImageGenProps {
  onBack: () => void;
}

export const ImageGen: React.FC<ImageGenProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    
    const result = await generateImage(prompt, negativePrompt);
    setImageUrl(result);
    setLoading(false);
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
        <h1 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">Image Studio</h1>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pb-20 pr-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Creative Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 p-5 glass rounded-[2rem] focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-[15px] leading-relaxed shadow-xl shadow-indigo-500/5 transition-all"
              placeholder="Describe the masterpiece you envision..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Negative Elements</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full h-20 p-5 glass rounded-[2rem] focus:ring-2 focus:ring-red-400 focus:outline-none resize-none text-[14px] leading-relaxed shadow-xl shadow-red-500/5 transition-all"
              placeholder="What should we avoid? (e.g. blurry, low quality)..."
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[2rem] font-display font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-2xl shadow-indigo-500/30 active:scale-95"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
            {loading ? 'Crafting Art...' : 'Generate Masterpiece'}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-zinc-500 font-medium animate-pulse">Our engine is painting your vision...</p>
          </div>
        )}

        {imageUrl && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-100 bg-white aspect-square flex items-center justify-center p-2">
              <img src={imageUrl} alt="Generated" className="w-full h-full object-cover rounded-[2rem]" />
            </div>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `sez-ai-${Date.now()}.png`;
                link.click();
              }}
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 text-white py-4 rounded-[2rem] font-display font-bold hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
            >
              <Download className="w-5 h-5" /> Download Artwork
            </button>
          </motion.div>
        )}

        {!loading && !imageUrl && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-300 border-2 border-dashed border-zinc-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-medium">Your artwork will appear here</p>
          </div>
        )}

        <p className="text-center text-zinc-400 text-[10px] font-bold tracking-widest uppercase mt-12">⚡ Powered by SEZ YT</p>
      </div>
    </motion.div>
  );
};
