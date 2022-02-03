import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    name: 'Bluefish-Dataflow',
    sourcemap: true,
  },
  plugins: [
    typescript(),
    commonjs(),
    nodeResolve(),
  ],
};