import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), crx({ manifest })],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
});
