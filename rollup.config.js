import resolve  from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";

// TODO: must configure babel!! e.g. "replaceAll" is still in output!

export default {
    input: 'dist/index.js',
    output: {
        file: 'build/js/sellquiz.min.js',
        format: 'iife',
        name: 'sellquiz',
        globals: {
            'mathjs': 'math',
            'codemirror': 'CodeMirror',
            'jquery': '$'
        }
    },
    external: [
        'mathjs',
        'codemirror',
        'jquery'
    ],
    plugins: [
        resolve(),
        babel({ babelHelpers: 'bundled' }),
        terser()
    ]
};
  