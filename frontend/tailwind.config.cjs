const sharedPreset = require('@rentr/config/tailwind-preset');
const jiti = require('jiti')(__filename);
const { tailwindThemeExtension } = jiti('../../packages/ui/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/atoms/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/molecules/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/organisms/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/templates/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: tailwindThemeExtension,
  },
};
