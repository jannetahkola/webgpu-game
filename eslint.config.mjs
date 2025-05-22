import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: ['dist/**'],
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: [
            'eslint.config.mjs',
            'vite.config.ts',
            'tests/webgpu-setup.ts',
            'tests/vitest-extensions-setup.ts',
          ],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    extends: [vitest.configs.recommended],
    files: ['**/*.test.ts', '**/*.test-d.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vitest',
              importNames: Object.keys(vitest.environments.env.globals),
              message: 'Use Vitest globals instead of importing',
            },
          ],
        },
      ],
    },
  }
);
