import type { Config } from 'tailwindcss';

// Theme intentionally empty — task F-05 wires the design tokens in.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {},
  plugins: [],
};

export default config;
