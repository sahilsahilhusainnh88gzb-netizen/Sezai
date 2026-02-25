export interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
  attachments?: { data: string, mimeType: string }[];
  feedback?: 'positive' | 'negative';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
}

export type AppView = 'splash' | 'chat' | 'encrypt' | 'image-gen' | 'about' | 'history';

export interface CryptoPrice {
  name: string;
  price: string;
  trend: 'up' | 'down';
}

export interface NewsItem {
  title: string;
  category: string;
}
