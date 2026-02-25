import { useState, useEffect } from 'react';
import { AppView } from './types';
import { Splash } from './components/Splash';
import { Chat } from './components/Chat';
import { Encryption } from './components/Encryption';
import { ImageGen } from './components/ImageGen';
import { About } from './components/About';

export default function App() {
  const [view, setView] = useState<AppView>('splash');

  useEffect(() => {
    if (view === 'splash') {
      const timer = setTimeout(() => {
        setView('chat');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full h-full max-w-md bg-white shadow-2xl relative overflow-hidden">
        {view === 'splash' && <Splash />}
        {view === 'chat' && <Chat onNavigate={setView} />}
        {view === 'encrypt' && <Encryption onBack={() => setView('chat')} />}
        {view === 'image-gen' && <ImageGen onBack={() => setView('chat')} />}
        {view === 'about' && <About onBack={() => setView('chat')} />}
      </div>
    </div>
  );
}
