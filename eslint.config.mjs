import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  formatters: true,
  // Next.js specific rules or overrides if needed
  rules: {
    'no-console': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
})
