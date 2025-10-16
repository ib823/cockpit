module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    'react-hooks/exhaustive-deps': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/logger.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
