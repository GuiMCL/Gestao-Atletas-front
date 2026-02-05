import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      screens: {
        // Mobile-first breakpoints (default Tailwind breakpoints are preserved)
        // sm: '640px'  - Small devices (landscape phones)
        // md: '768px'  - Medium devices (tablets)
        // lg: '1024px' - Large devices (desktops)
        // xl: '1280px' - Extra large devices
        // 2xl: '1536px' - 2X Extra large devices
        
        // Custom breakpoints for specific use cases
        'xs': '475px',              // Extra small devices (small phones in landscape)
        'tablet': '768px',          // Tablets (portrait) - alias for md
        'tablet-landscape': '1024px', // Tablets (landscape) - alias for lg
        'desktop': '1280px',        // Desktop - alias for xl
        'wide': '1536px',           // Wide screens - alias for 2xl
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
};

export default config;
