export default [
  {
    files: ['frontend/js/**/*.js', 'test/**/*.js'],
    languageOptions: {ecmaVersion: 2022, sourceType: 'module', globals: {
      document:'readonly', location:'readonly', localStorage:'readonly', structuredClone:'readonly',
      URLSearchParams:'readonly', FormData:'readonly', fetch:'readonly', confirm:'readonly', window:'readonly', crypto:'readonly', TextEncoder:'readonly'
    }},
    rules: {
      'no-unused-vars': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always']
    }
  }
];
