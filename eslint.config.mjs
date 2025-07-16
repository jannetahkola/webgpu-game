import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginVitest from '@vitest/eslint-plugin';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    ignores: ['dist/**'],
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
      'prettier/prettier': 'error',
    },
  },
  {
    extends: [eslintPluginVitest.configs.recommended],
    files: ['**/*.test.ts', '**/*.test-d.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vitest',
              importNames: Object.keys(
                eslintPluginVitest.environments.env.globals
              ),
              message: 'Use Vitest globals instead of importing',
            },
          ],
        },
      ],
    },
  }
);
