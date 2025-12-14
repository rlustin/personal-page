#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

const commonOptions = {
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

const buildConfigs = [
  {
    ...commonOptions,
    entryPoints: [join(__dirname, 'static/js/main.js')],
    outfile: join(__dirname, 'public/js/bundle.js'),
  },
  {
    ...commonOptions,
    entryPoints: [join(__dirname, 'static/js/index.js')],
    outfile: join(__dirname, 'public/js/index-bundle.js'),
  },
  {
    ...commonOptions,
    entryPoints: [join(__dirname, 'static/js/mixes-index.js')],
    outfile: join(__dirname, 'public/js/mixes-index-bundle.js'),
  },
];

async function build() {
  try {
    if (isWatch) {
      console.log('👀 Watching for changes...');
      const contexts = await Promise.all(buildConfigs.map((config) => esbuild.context(config)));
      await Promise.all(contexts.map((ctx) => ctx.watch()));
    } else {
      console.log('🔨 Building JavaScript bundles...');
      await Promise.all(buildConfigs.map((config) => esbuild.build(config)));
      console.log('✅ Build complete!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
