// src/App.tsx
import { Workspace } from '@/app/workspace';
import { ThemeProvider } from '@/components/theme/theme-provider';

export default function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <Workspace />
        </ThemeProvider>
    );
}
