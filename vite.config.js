import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            outDir: 'public/build',
            buildBase: '/build/',
            scope: '/',
            workbox: {
                navigateFallback: '/',
                globDirectory: 'public/build',
                globPatterns: ['**/*.{js,css,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot}']
            },
            manifest: {
                name: 'GajiHub - HRIS App',
                short_name: 'GajiHub',
                description: 'Aplikasi HRIS & Payroll Perusahaan',
                theme_color: '#4F46E5',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/logo.png', // Fallback icon if any
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
});
