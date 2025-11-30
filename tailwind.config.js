/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'dash-bg': '#0f1014',       // Very dark blue/black for main background
                'dash-card': '#181b21',     // Slightly lighter for cards
                'dash-card-hover': '#1f232b',
                'dash-border': '#2a2e37',   // Borders
                'dash-text': '#e2e8f0',     // Main text
                'dash-text-dim': '#94a3b8', // Secondary text
                'dash-accent': '#3b82f6',   // Primary accent (blue)
                'dash-accent-hover': '#2563eb',
            },
            fontFamily: {
                sans: ['Ubuntu', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'], // Keep a mono option for code/data
            },
        },
    },
    plugins: [],
}
