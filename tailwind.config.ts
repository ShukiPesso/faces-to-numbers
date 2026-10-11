import type { Config } from 'tailwindcss';

// Theme is built only from the design tokens (src/styles/tokens.css, mirrors design/tokens.css).
// Every value is a reference to a CSS custom property; no literal colours or sizes live here.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      border: 'var(--color-border)',
      ink: 'var(--color-ink)',
      'ink-muted': 'var(--color-ink-muted)',
      primary: 'var(--color-primary)',
      'primary-ink': 'var(--color-primary-ink)',
      accent: 'var(--color-accent)',
      'accent-soft': 'var(--color-accent-soft)',
      gold: 'var(--color-gold)',
      'gold-soft': 'var(--color-gold-soft)',
      'warning-bg': 'var(--color-warning-bg)',
      focus: 'var(--color-focus)',
    },
    fontFamily: {
      body: 'var(--font-body)',
      display: 'var(--font-display)',
    },
    fontSize: {
      xs: ['var(--text-xs)', { lineHeight: 'var(--leading-xs)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--leading-sm)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
      lg: ['var(--text-lg)', { lineHeight: 'var(--leading-lg)' }],
      xl: ['var(--text-xl)', { lineHeight: 'var(--leading-xl)' }],
      '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-2xl)' }],
      '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-3xl)' }],
      read: ['var(--text-read)', { lineHeight: 'var(--leading-read)' }],
    },
    spacing: {
      0: '0px',
      px: '1px',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      5: 'var(--space-5)',
      6: 'var(--space-6)',
      7: 'var(--space-7)',
      8: 'var(--space-8)',
      9: 'var(--space-9)',
      10: 'var(--space-10)',
      11: 'var(--space-11)',
      12: 'var(--space-12)',
    },
    borderRadius: {
      none: '0px',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px',
    },
    boxShadow: {
      card: 'var(--shadow-card)',
    },
    extend: {
      maxWidth: {
        measure: 'var(--measure)',
        content: 'var(--content-max)',
      },
      width: {
        'icon-sm': 'var(--icon-sm)',
        'icon-md': 'var(--icon-md)',
        sidenav: 'var(--sidenav-width)',
      },
      height: {
        'icon-sm': 'var(--icon-sm)',
        'icon-md': 'var(--icon-md)',
      },
      size: {
        'icon-sm': 'var(--icon-sm)',
        'icon-md': 'var(--icon-md)',
      },
      zIndex: {
        sticky: 'var(--z-sticky)',
        nav: 'var(--z-nav)',
        skip: 'var(--z-skip)',
      },
      borderWidth: {
        hairline: 'var(--border-width-hairline)',
        accent: 'var(--border-width-accent)',
      },
      fontWeight: {
        regular: 'var(--font-weight-regular)',
        semibold: 'var(--font-weight-semibold)',
        display: 'var(--font-weight-display)',
        'display-bold': 'var(--font-weight-display-bold)',
      },
    },
  },
  plugins: [],
};

export default config;
