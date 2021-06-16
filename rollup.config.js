import { terser } from "rollup-plugin-terser";

export default {
    input: 'src/index.js',
    output: {
        file: 'build/js/sell.min.js',
        format: 'iife',
        name: 'sell',
        globals: {
            'mathjs': 'math'
        } 
    },
    external: [
        'mathjs'
    ],
    //plugins: [terser()]
};
