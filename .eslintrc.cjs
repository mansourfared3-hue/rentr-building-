module.exports = {
  root: true,
  extends: ['./packages/config/eslint/base.cjs'],
  ignorePatterns: ['node_modules/', '**/dist/', '**/.next/', 'pnpm-lock.yaml'],
};
