// src/popup/main.tsx
import { createRoot } from 'react-dom/client';
import '@/index.css';
import Popup from './popup';

createRoot(document.getElementById('popup-root')!).render(<Popup />);
