/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        screens: {
            'xs': '475px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                'dash-bg': '#121214',       // Neutral dark gray for main background
                'dash-card': '#1a1a1d',     // Slightly lighter neutral gray for cards
                'dash-card-hover': '#222225',
                'dash-border': '#2d2d31',   // Neutral gray borders
                'dash-text': '#e4e4e7',     // Main text (neutral)
                'dash-text-dim': '#a1a1aa', // Secondary text (neutral gray)
                'dash-accent': 'var(--color-accent)',   // Primary accent (dynamic)
                'dash-accent-hover': 'var(--color-accent-hover)',
            },
            fontFamily: {
                sans: ['Ubuntu', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'], // Keep a mono option for code/data
            },
        },
    },
    plugins: [],
}
