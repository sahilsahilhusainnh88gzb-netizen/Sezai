import React from 'react';
import { motion } from 'motion/react';

export const Splash: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#6200EE] text-white p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="text-8xl mb-8"
      >
        ⚡
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-4xl font-bold mb-2 text-center"
      >
        SEZ AI 2026
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="text-white/50 text-lg mb-12"
      >
        by SEZ YT
      </motion.p>
      
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};
