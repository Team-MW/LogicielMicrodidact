#!/usr/bin/env node
// prebundle.mjs - Pré-bundle les librairies lourdes avant le démarrage de Vite
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const depsDir = join(cwd, 'node_modules/.vite/deps');

if (!existsSync(depsDir)) {
  mkdirSync(depsDir, { recursive: true });
}

const esbuild = join(cwd, 'node_modules/.bin/esbuild');

const bundles = [
  {
    input: 'node_modules/reka-ui/dist/index.cjs',
    output: 'node_modules/.vite/deps/reka-ui.js',
    external: ['vue']
  },
  {
    input: 'node_modules/radix-vue/dist/index.umd.cjs',
    output: 'node_modules/.vite/deps/radix-vue.js',
    external: ['vue']
  }
];

for (const bundle of bundles) {
  if (!existsSync(join(cwd, bundle.input))) {
    console.log(`⚠️  ${bundle.input} introuvable, ignoré.`);
    continue;
  }
  const externals = bundle.external.map(e => `--external:${e}`).join(' ');
  const cmd = `"${esbuild}" "${bundle.input}" --bundle --format=esm --outfile="${bundle.output}" --platform=browser ${externals}`;
  console.log(`📦 Pre-bundling ${bundle.input.split('/').pop()}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd });
  } catch (e) {
    console.error(`❌ Erreur: ${e.message}`);
  }
}

console.log('✅ Pre-bundling terminé.');
