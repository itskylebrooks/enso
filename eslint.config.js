import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'

const reactRecommendedRules = {
  ...react.configs.recommended.rules,
  ...react.configs['jsx-runtime'].rules,
}

const reactHooksRules = reactHooks.configs.recommended.rules
const jsxA11yRules = jsxA11y.configs.recommended.rules
const importRules = {
  ...importPlugin.configs.recommended.rules,
  ...importPlugin.configs.typescript.rules,
}

const tailwindRules = tailwindcss.configs['flat/recommended'][1]?.rules ?? {}

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'pnpm-lock.yaml', 'scripts/**/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      tailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.app.json'],
        },
      },
      tailwindcss: {
        callees: ['clsx', 'cn'],
        config: 'tailwind.config.ts',
      },
    },
    rules: {
      ...reactRecommendedRules,
      ...reactHooksRules,
      ...jsxA11yRules,
      ...importRules,
      ...tailwindRules,
      'import/no-default-export': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
      'react-hooks/exhaustive-deps': 'error',
      'tailwindcss/no-arbitrary-value': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../**'],
        },
      ],
    },
  },
)
