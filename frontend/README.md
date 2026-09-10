# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

TUTORIAL - https://lobotuerto.com/notes/build-a-vue3-typescript-dev-environment-with-vite

npm create vite@6.0
npm add -D @types/node

npm add -D prettier prettier-plugin-tailwindcss

npm add -D eslint eslint-plugin-vue eslint-config-prettier
npm add -D vue-eslint-parser @typescript-eslint/parser
npm add -D @typescript-eslint/eslint-plugin

husky
npx husky install
npx husky add .husky/pre-commit "npm run lint"

echo "🔍 Running type check..."
npx tsc --noEmit

echo "🎨 Running prettier and lint..."
npx lint-staged
