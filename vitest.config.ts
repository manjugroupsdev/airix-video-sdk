import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['core/tests/**/*.test.ts', 'react/tests/**/*.test.tsx', 'react-native/tests/**/*.test.tsx', 'webhooks/tests/**/*.test.ts'], environment: 'node', restoreMocks: true } })
