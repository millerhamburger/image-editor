/*
 * @Author: YEYI millerye1995@foxmail.com
 * @Date: 2025-11-26 19:55:18
 * @LastEditors: YEYI millerye1995@foxmail.com
 * @LastEditTime: 2025-11-26 19:55:21
 * @FilePath: \image-editor\build-example.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function build() {
  console.log('Building example...');

  // Bundle JS
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'example/bundle.js',
    bundle: true,
    format: 'esm',
    sourcemap: true,
  });
  console.log('JS bundled.');

  // Compile LESS
  // We'll use the lessc command from node_modules
  const lessc = path.join('node_modules', '.bin', 'lessc');
  // On Windows, it might be lessc.cmd
  const lessCmd = process.platform === 'win32' ? 'npx lessc' : 'npx lessc';
  
  exec(`${lessCmd} src/styles/editor.less example/style.css`, (err, stdout, stderr) => {
    if (err) {
      console.error('LESS compilation failed:', stderr);
      return;
    }
    console.log('LESS compiled.');
  });
}

build();
