export const colors = {
  brand: {
    50: '#eef4ff',
    100: '#dbe8ff',
    200: '#bed3ff',
    300: '#91b4ff',
    400: '#5d8bfa',
    500: '#315fce',
    600: '#254bb0',
    700: '#1e3c8c',
    800: '#1d356f',
    900: '#1c315b',
    950: '#111d38',
  },
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  surface: {
    DEFAULT: '#ffffff',
    muted: '#fafaf9',
    subtle: '#f5f5f4',
  },
  ink: {
    DEFAULT: '#1c2434',
    muted: '#536174',
    subtle: '#718096',
    inverse: '#ffffff',
  },
  border: {
    DEFAULT: '#e2e8f0',
    strong: '#cbd5e1',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  status: {
    neutral: {
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
    },
    success: {
      bg: '#ecfdf5',
      text: '#047857',
      border: '#a7f3d0',
    },
    warning: {
      bg: '#fffbeb',
      text: '#92400e',
      border: '#fde68a',
    },
    danger: {
      bg: '#fef2f2',
      text: '#b91c1c',
      border: '#fecaca',
    },
  },
} as const;

export const spacingScale = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
} as const;

export const typographyScale = {
  fontFamily: {
    sans: [
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif',
    ],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
  },
} as const;

export const radii = {
  none: '0px',
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  soft: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
  card: '0 4px 12px -2px rgb(15 23 42 / 0.08)',
  elevated: '0 16px 32px -8px rgb(15 23 42 / 0.16)',
  focus: '0 0 0 3px rgb(49 95 206 / 0.18)',
} as const;

export const tailwindThemeExtension = {
  colors,
  spacing: spacingScale,
  fontFamily: typographyScale.fontFamily,
  fontSize: typographyScale.fontSize,
  fontWeight: typographyScale.fontWeight,
  letterSpacing: typographyScale.letterSpacing,
  borderRadius: radii,
  boxShadow: shadows,
} as const;
