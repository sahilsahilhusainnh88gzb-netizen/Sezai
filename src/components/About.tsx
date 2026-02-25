import React from 'react';
import { ArrowLeft, Mail, Instagram, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-white p-6 max-w-2xl mx-auto w-full overflow-y-auto"
    >
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-2 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#6200EE]" />
        </button>
        <h1 className="text-2xl font-bold text-[#6200EE]">About SEZ AI</h1>
      </div>

      <div className="space-y-8 pb-12">
        {/* Terms & Policy Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#6200EE] font-semibold">
            <ShieldCheck className="w-5 h-5" />
            <h2>Terms & Privacy Policy</h2>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
            <p className="mb-3">
              Welcome to SEZ AI 2026. By using our services, you agree to our terms of service. We prioritize your privacy and ensure that your data is handled with the highest security standards.
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Your chat history is used only to improve your personal experience.</li>
              <li>We do not sell your personal information to third parties.</li>
              <li>AI-generated content is for informational purposes.</li>
              <li>Users are responsible for the content they generate and share.</li>
            </ul>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#6200EE] font-semibold">
            <Mail className="w-5 h-5" />
            <h2>Contact Us</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase">Email Support</p>
                <p className="text-gray-700 font-medium">imsahilsez@gmail.com</p>
              </div>
            </div>

            <a 
              href="https://www.instagram.com/im_sahil_sez?igsh=MWIyemxlNHNlYXR1Mw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white rounded-xl shadow-md hover:scale-[1.02] transition-transform active:scale-95"
            >
              <Instagram className="w-6 h-6" />
              <span className="font-bold">Follow on Instagram</span>
            </a>
          </div>
        </section>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm">Version 2.0.26 (Stable)</p>
          <p className="text-[#6200EE] font-bold mt-1">⚡ Powered by SEZ YT</p>
        </div>
      </div>
    </motion.div>
  );
};
