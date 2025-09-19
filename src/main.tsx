// src/main.tsx (app.html)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import { AppWorkspace } from '@/app/app-workspace';
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppWorkspace />
    </StrictMode>
);
