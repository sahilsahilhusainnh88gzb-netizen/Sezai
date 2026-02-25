import React from 'react';
import { motion } from 'motion/react';

export const Splash: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white text-zinc-900 p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 rotate-12">
          <span className="text-5xl">⚡</span>
        </div>
        
        <h1 className="text-4xl font-display font-bold tracking-tighter mb-2">
          SEZ <span className="text-indigo-500">AI</span>
        </h1>
        
        <p className="text-zinc-400 font-medium tracking-[0.2em] uppercase text-[10px] mb-12">
          SEZ AI
        </p>
        
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 bg-indigo-500/30 rounded-full animate-pulse delay-150" />
        </div>
      </motion.div>
      
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
          Powered by SEZ YT
        </p>
      </div>
    </div>
  );
};
