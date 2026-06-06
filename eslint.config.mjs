import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const commonGlobals = {
  console: 'readonly',
  globalThis: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
};

const browserGlobals = {
  ...commonGlobals,
  Blob: 'readonly',
  document: 'readonly',
  HTMLElement: 'readonly',
  HTMLImageElement: 'readonly',
  Image: 'readonly',
  localStorage: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  window: 'readonly',
};

const nodeGlobals = {
  ...commonGlobals,
  Buffer: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
};

const gameLayerRestrictedImports = [
  {
    group: ['../app/*', '../../app/*', '../components/*', '../../components/*'],
    message: 'game層からapp/components層へ依存しないでください。依存方向は app/components -> game を維持してください。',
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.venv/**',
      'tmp/**',
      'coverage/**',
      '.wrangler/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: browserGlobals,
    },
  },
  {
    files: ['src/**/*.{tsx,ts}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/game/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: gameLayerRestrictedImports,
        },
      ],
    },
  },
  {
    files: [
      '*.config.{js,mjs,ts}',
      'eslint.config.mjs',
      'playwright.config.ts',
      'scripts/**/*.mjs',
      'tests/**/*.ts',
      'vite.config.ts',
    ],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
);
