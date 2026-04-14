// Configuracao do Vite para build/dev server do frontend.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    // Arquivos que dependem de DOM (FileReader, localStorage real) usam happy-dom.
    environmentMatchGlobs: [
      ['src/utils/files.test.js', 'happy-dom'],
      ['src/utils/storage.test.js', 'happy-dom'],
      ['src/components/**/*.test.{js,jsx}', 'happy-dom'],
      ['src/lib/**/*.test.{js,jsx}', 'happy-dom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**',
        'src/components/AuthModal.jsx',
        'src/lib/supabaseClient.js',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
})
