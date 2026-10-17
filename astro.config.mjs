// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://el-j.github.io',
  base: process.env.ASTRO_BASE ?? '/count',
  vite: {
    plugins: [tailwindcss()]
  }
});