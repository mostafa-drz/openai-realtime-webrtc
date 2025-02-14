const config = {
  'src/**/*.{js,jsx,ts,tsx}': [
    'npm run lint:fix',
    'npm run format',
    () => 'npm run ts:check',
  ],
  'src/**/*.{json,md,yml,yaml}': ['npm run format'],
};

export default config;
