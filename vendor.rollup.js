"use strict";

const nodeResolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const json = require("rollup-plugin-json");
const buble = require("rollup-plugin-buble");

module.exports = {

    input: "src/vendor.ts",
    output: {
        file: "int/vendor.js",
        globals: {
            bluebird: "Promise",
            "power-assert": "assert",
        },
        strict: true,
        sourcemap: true,
        format: "iife",
        name: "vendor",
    },
    external: [ "bluebird", "power-assert", "socket.io-client" ],
    plugins: [
        json(),
        nodeResolve({
            // use "jsnext:main" if possible
            // – see https://github.com/rollup/rollup/wiki/jsnext:main
            jsnext: true, // Default: false

            // use "main" field or index.js, even if it's not an ES6 module
            // (needs to be converted from CommonJS to ES6
            // – see https://github.com/rollup/rollup-plugin-commonjs
            main: true, // Default: true

            // some package.json files have a `browser` field which
            // specifies alternative files to load for people bundling
            // for the browser. If that's you, use this option, otherwise
            // pkg.browser will be ignored
            browser: true, // Default: false

            // not all files you want to resolve are .js files
            extensions: [ ".js", ".json" ], // Default: ['.js']
            sourceMap: true,

            // whether to prefer built-in modules (e.g. `fs`, `path`) or
            // local ones with the same names
            preferBuiltins: false, // Default: true
        }),
        commonjs({
            extensions: [ ".js" ],
            namedExports: {
                screenfull: [ "request" ],
            },
        }),
        buble({ transforms: { dangerousForOf: true, dangerousTaggedTemplateString: true } }),
    ],
};

// export default module.exports;
