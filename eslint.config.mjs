import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'import/no-default-export': 'error',
    },
  },
  {
    files: [
      'apps/mobile/app/**/*.tsx', 
      'eslint.config.mjs', 
      '**/drizzle.config.ts', 
      '**/TabPlaceholder.tsx',
      '**/vitest.config.mts'
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.expo/**', '.next/**'],
  }
);
