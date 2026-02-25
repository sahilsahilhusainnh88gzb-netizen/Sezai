export interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
}

export type AppView = 'splash' | 'chat' | 'encrypt' | 'image-gen' | 'about';

export interface CryptoPrice {
  name: string;
  price: string;
  trend: 'up' | 'down';
}

export interface NewsItem {
  title: string;
  category: string;
}
