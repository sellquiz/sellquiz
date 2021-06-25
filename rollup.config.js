import { terser } from "rollup-plugin-terser";

export default {
    input: 'dist/index.js',
    output: {
        file: 'build/js/sellquiz.min.js',
        format: 'iife',
        name: 'sellquiz',
        globals: {
            'mathjs': 'math'
        } 
    },
    external: [
        'mathjs'
    ],
    plugins: [
        terser()
    ]
};
