import { terser } from "rollup-plugin-terser";
//import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'dist/index.js',
    output: {
        file: 'build/js/sellquiz.min.js',
        format: 'iife',
        name: 'sellquiz',
        globals: {
            'mathjs': 'math',
            'codemirror': 'CodeMirror'
        }
    },
    external: [
        'mathjs',
        'codemirror'
    ],
    plugins: [
        //nodeResolve(),
        //commonjs(),
        terser()
    ]
};
  