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
      className="flex flex-col h-full bg-white p-4 max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft className="w-6 h-6 text-[#6200EE]" />
        </button>
        <h1 className="text-2xl font-bold text-[#6200EE]">🎨 AI Image Studio</h1>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pb-20">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">What to generate:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6200EE] focus:outline-none resize-none text-[15px]"
              placeholder="Describe the image you want to generate (e.g., A futuristic city at sunset)..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Negative Prompt (What to avoid):</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full h-16 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:outline-none resize-none text-[14px]"
              placeholder="E.g., blurry, low quality, distorted, extra limbs..."
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#6200EE] text-white py-4 rounded-xl font-bold hover:bg-[#5000c7] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6200EE]/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            {loading ? 'Processing Masterpiece...' : 'Generate High-End Image'}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-[#6200EE] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 animate-pulse">Creating your masterpiece...</p>
          </div>
        )}

        {imageUrl && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
              <img src={imageUrl} alt="Generated" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `sez-ai-${Date.now()}.png`;
                link.click();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#03DAC6] text-black py-3 rounded-lg font-medium hover:bg-[#02b8a7] transition-colors"
            >
              <Download className="w-5 h-5" /> Save Image
            </button>
          </motion.div>
        )}

        {!loading && !imageUrl && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
            <p>Your generated image will appear here</p>
          </div>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">⚡ Powered by SEZ YT</p>
      </div>
    </motion.div>
  );
};
