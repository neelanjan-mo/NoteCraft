// src/popup/main.tsx
import { createRoot } from 'react-dom/client';
import '@/index.css';
import { PopupWorkspace } from '@/app/popup-workspace';
createRoot(document.getElementById('popup-root')!).render(<PopupWorkspace />);
