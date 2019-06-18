"use strict";

let typescript = require("rollup-plugin-typescript2");
let nodeResolve = require("rollup-plugin-node-resolve");
let commonjs = require("rollup-plugin-commonjs");
let json = require("rollup-plugin-json");
let buble = require("rollup-plugin-buble");

const path = require("path");

// var buble = require('buble');
// var rollupPluginutils = require('rollup-pluginutils');

// function bublePlugin ( options ) {
// 	if ( !options ) options = {};
// 	var filter = rollupPluginutils.createFilter( options.include, options.exclude );

// 	if ( !options.transforms ) options.transforms = {};
// 	options.transforms.modules = false;

// 	return {
// 		name: 'buble',

// 		transform: function ( code, id ) {
// 			if ( !filter( id ) ) return null;
// 			return buble.transform( code, options );
// 		}
// 	};
// }

function pkg(name) {
    //    return path.relative(__dirname, require.resolve(name));
    return require.resolve(name);
}

function pkgs(name) {
    return pkg(name).replace(/\\/g, "/");
}

module.exports = {
    input: "src/host/main.ts",
    output: {
        globals: {
            lodash: "_",
            _: "_",
            bluebird: "Promise",
            "power-assert": "assert",
            "add-to-homescreen": "addToHomescreen",
            "socket.io-client": "io",
        },
        strict: true,
        sourcemap: true,
        format: "iife",
        exports: "none",
        file: "int/js/mainout.js",
    },
    external: ["bluebird", "power-assert", "lodash", "socket.io-client", "_"],
    plugins: [
        json(),
        typescript({
            typescript: require("typescript"),
        }),
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
            extensions: [".js", ".json"], // Default: ['.js']
            sourceMap: true,

            // whether to prefer built-in modules (e.g. `fs`, `path`) or
            // local ones with the same names
            preferBuiltins: false, // Default: true
        }),
        commonjs({
            namedExports: {
                screenfull: ["request"],
                "add-to-homescreen": ["addToHomescreen"],
                marked: ["Renderer", "setOptions", "parse"],
            },
        }),
        buble({
            transforms: { dangerousForOf: true, dangerousTaggedTemplateString: true },
        }),
    ],
};
