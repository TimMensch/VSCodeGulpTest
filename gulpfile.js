/* eslint-env node */
"use strict";

/* eslint no-shadow: 0 */
const Promise = require("bluebird");

const gulp = require("gulp");
const imageop = require("gulp-imagemin");
const tslint = require("gulp-tslint");
const newer = require("gulp-newer");
const extend = require("node.extend");
// We import the "fullpath" here because posix path
// doesn't know about backslash, and so path.posix.basename
// fails. Use fullpath if you need a cross-platform safe
// basename. Use path for everything else (we don't want
// path.join to change path separators to backslashes).
const fullpath = require("path");
const runSequence = require("gulp-run-sequence");
const path = fullpath.posix;
const gutil = require("gulp-util");
const promisify = require("es6-promisify");
const fs = require("fs");
const stat = promisify(fs.stat);
const rimraf = promisify(require("rimraf"));
const rimrafSync = require("rimraf").sync;
const rollup = require("rollup").rollup;
const globby = require("globby");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const gulpif = require("gulp-if");
// const uglify = require('gulp-uglify');
const mkdirp = promisify(require("mkdirp"));
const rollupConfig = require("./.rollup.js");
const vendorRollupConfig = require("./vendor.rollup.js");
const rollupUglify = require("rollup-plugin-uglify");
const cache = require("gulp-cached");
const parseXMLString = promisify(require("xml2js").parseString);
// const levelXMLtoJSON = require("./gulp/leveltojson.js");
const ts = require("gulp-typescript");
const assign = require("lodash/assign");
const keys = require("lodash/keys");
const strip = require("gulp-strip-comments");
const exec = promisify(require("child_process").exec, { multiArgs: true });
const execSync = require("child_process").execSync;
const gulpprint = require("gulp-print");
const htmlmin = require("gulp-htmlmin");
const lazypipe = require("lazypipe");
// const updateJsonImports = require("./gulp/jsonimports");
// const generateAndValidate = require("./gulp/validateSchema");
// const makeProductionHTMLBuilder = require("./gulp/makeproduction");
// const genimages = require("./gulp/genimages");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
// const injectCSS = require("./gulp/injectcss");

// Stubbed functions
function generateAndValidate(task, type, paths) {
    var generateTask = task + "-generate";
    gulp.task(generateTask, function(cb) {
        cb();
    });

    gulp.task(task, [generateTask], function(cb) {
        cb();
    });
}

function makeProductionHTMLBuilder() {}
function genimages() {}
function injectCSS() {}

const rootpaths = {
    host: "./app/www",
    client: "./server/clientdist",
    test: "./server/testdist",
};

var paths = {
    host: rootpaths.host,
    client: rootpaths.client,
    test: rootpaths.test,
    host_js: path.join(rootpaths.host, "js"),
    test_js: path.join(rootpaths.test, "js"),
    client_js: path.join(rootpaths.client, "js"),

    host_src: ["src/host/**/*.ts", "src/qc/**/*.ts", "src/common/**/*.ts"],
    client_src: ["src/client/**/*.ts", "src/common/**/*.ts", "src/qc/**/*.ts"],
    client_scss: "src/client/html/index.scss",
    host_scss: "src/host/html/index.scss",
    vendor_entry: "src/vendor.es6",
    host_root: ["src/host/html/index.html", "node_modules/animate.css/animate.min.css"],
    host_css: ["src/host/html/*.?css", "src/common/css/*"],
    client_css: ["src/client/html/*.?css", "src/common/css/*"],
    client_root: [
        "src/client/html/index.html",
        "node_modules/animate.css/animate.min.css",
    ],
    commonAssets: ["genArt/common/**/*"],
    client_image_source: [
        "int/client/**/*.json",
        "int/client/**/*.jpg",
        "int/client/**/*.obj",
        "int/client/**/*.png",
        "int/client/**/*.mtl",
        "int/client/**/*.svg",
        "genArt/client/**/*",
    ],
    host_image_source: [
        "genArt/host/**/*",
        "int/host/**/*.json",
        "int/host/**/*.jpg",
        "int/host/**/*.obj",
        "int/host/**/*.svg",
        "int/host/**/*.mtl",
        "int/host/**/*.png",
    ],
    app_logo: "sourceArt/app/logo.png",
    app_image_source_dir: "genArt/app/images",
    app_images_windows: "app/platforms/windows/images",
    app_images_android: "app/platforms/android",
    app_image_source_windows: "genArt/app/images/windows/*.png",
    app_image_source_android: "genArt/app/images/android/**/*.png",
    levels: "sourceArt/maps/*.tmx",
    levelOut: "int/levels",

    // Resolution independent assets
    host_rx_assets: [
        "int/levels/*.json",
        "sourceArt/gui/host/*.json",
        "sourceArt/scenarios/*.json",
        "sourceArt/map_art/host/*",
    ],

    json_validation: ["src/declarations/scenario.d.ts"],

    client_rx_assets: [
        "sourceArt/gui/client/*.json",
        "sourceArt/theme/clientsvg/*",
        "sourceArt/ui/assets/*",
        "sourceArt/map_art/client/*",
    ],

    common_rx_assets: [
        "sourceArt/button/frames/*.png",
        "sourceArt/3d/textures/*.jpg",
        "sourceArt/portraits/*",
        "sourceArt/3d/objects/*",
        "sourceArt/items/icons/*",
        "sourceArt/items/svg/*",
        "sourceArt/cards/images/*",
    ],

    host_images: rootpaths.host,
    client_images: rootpaths.client,

    project: "./src/project.json",

    int: "./int",
    host_int: "./int/host",
    client_int: "./int/client",
    static_js: [
        "frameworks/phaser/phaser.js",
        "frameworks/phaser/phaser.min.js",
        "int/js/vendor.js",
        "int/js/vendor.js.map",
        "node_modules/lodash/lodash.min.js",
        "node_modules/bluebird/js/browser/bluebird.core.min.js",
        "node_modules/socket.io-client/dist/socket.io.slim.js",
        "node_modules/socket.io-client/dist/socket.io.slim.js.map",
    ],
    json_imports: "src/common/jsonimports.ts",
    imports: {
        "items:ItemDictionary": "sourceArt/coregame/items.json",
        "patrons:PatronSpec[]": "sourceArt/coregame/patrons.json",
        "actors:ActorSpec[]": "sourceArt/coregame/actors.json",
        gameGlobals: "sourceArt/coregame/gameglobals.json",
        "loot:LootTableSpec[]": "sourceArt/coregame/loottables.json",
    },
    scenarios: "sourceArt/scenarios/*.json",
    actors: "sourceArt/coregame/actors.json",
    coregame: "sourceArt/coregame/*.json",
    items: "sourceArt/coregame/items.json",
};

paths.client_image_source = paths.client_image_source.concat(paths.commonAssets);
paths.host_image_source = paths.host_image_source.concat(paths.commonAssets);
paths.host_rx_assets = paths.host_rx_assets.concat(paths.common_rx_assets);
paths.client_rx_assets = paths.client_rx_assets.concat(paths.common_rx_assets);

var imageMinOptions = {
    optimizationLevel: 1,
    progressive: false,
};

var node_env = process.env.NODE_ENV;
var production = false;

function sleep(time) {
    const stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        /*do nothing*/
    }
}

rollupConfig.onwarn = warning => {
    if (warning.code === "UNUSED_EXTERNAL_IMPORT" && warning.message.includes("Quat")) {
        return;
    }
    console.warn(warning);
};
vendorRollupConfig.onwarn = message => {
    console.warn(message);
};

function enableProduction(tries) {
    if (tries === 0) {
        throw new Error("Failed to clear build for production.");
    }
    if (tries == null) {
        console.log("Building Production");
        tries = 5;
    }

    try {
        rimrafSync(paths.host_int);
        rimrafSync(paths.client_int);
        rimrafSync(path.join(paths.int, "js"));
        rimrafSync(path.join(paths.host, "assets"));
        rimrafSync(path.join(paths.host_js, "*.map"));
        rimrafSync(path.join(paths.client_js, "*.map"));
    } catch (e) {
        sleep(100);
        enableProduction(tries - 1);
    }

    production = true;
    imageMinOptions.optimizationLevel = 5;

    rollupConfig.plugins.push(rollupUglify());
    rollupConfig.output.sourcemap = false;
    vendorRollupConfig.plugins.push(rollupUglify());
    vendorRollupConfig.output.sourcemap = false;
}

// Auto-enable production for Docker builds.
process.argv.forEach(function(val, index, array) {
    if (val === "docker") {
        enableProduction();
    }
});

if (node_env && node_env.trim().toLowerCase() === "production") {
    enableProduction();
}

gulp.task("lint", function() {
    return gulp
        .src(["./src/**/*.ts", "!./src/declarations/**/*"])
        .pipe(cache("linting"))
        .pipe(
            tslint({
                formatter: "verbose",
            })
        )
        .pipe(tslint.report());
});

gulp.task("jsonimports", function(callback) {
    // updateJsonImports(paths.imports, paths.json_imports);
    callback();
});

var clientCache;
gulp.task("client-js", function() {
    var options = extend({}, rollupConfig);
    options.output = extend({}, options.output);
    options.output.file = path.join(paths.client, "js/main.js");
    options.input = "src/client/main.ts";
    options.cache = clientCache;
    addVendor(options);

    return rollup(options)
        .then(function(bundle) {
            clientCache = bundle;
            return bundle.write(options.output);
        })
        .catch(err => {
            console.error("Failed to build client-js:", err);
            throw new Error("Failed to build client-js");
        });
});

var vendorBuilt = false;
gulp.task("vendor-js", function() {
    if (vendorBuilt) {
        // Only build the vendor once; watches will need to be restarted to
        // rebuild vendors, but that's a small sacrifice for the time savings.
        return Promise.resolve();
    }
    var options = extend({}, vendorRollupConfig);
    options.output.file = path.join(paths.int, "js/vendor.js");
    options.input = paths.vendor_entry;
    options.output.name = "vendor";
    delete options.exports;

    return rollup(options).then(function(bundle) {
        vendorBuilt = true;
        return bundle.write(options.output);
    });
});

const globalVendorReferences = {
    // "socket.io-client": "vendor._io",
    "component-emitter": "vendor._Emitter",
    nanoajax: "vendor._ajax",
    screenfull: "vendor._screenfull",
    three: "vendor._three",
    oimo: "vendor._oimo",
    mithril: "vendor._mithril",
    hammerjs: "vendor._Hammer",
    "b-spline": "vendor._bspline",
    "mithril-slider": "vendor._mithrilSlider",
};

function addVendor(options) {
    options.output.globals = options.output.globals || {};
    assign(options.output.globals, globalVendorReferences);

    options.external = options.external || [];
    options.external = options.external.concat(keys(globalVendorReferences));
}

var hostCache;
gulp.task("host-js", function() {
    var options = extend({}, rollupConfig);
    options.output = extend({}, options.output);
    options.output.file = path.join(paths.host, "js/main.js");
    options.cache = hostCache;
    addVendor(options);

    return rollup(options)
        .then(function(bundle) {
            hostCache = bundle;
            return bundle.write(options.output);
        })
        .catch(err => {
            console.error("Failed to build host-js:", err);
            throw new Error("Failed to build host-js");
        });
});

gulp.task("levels", function() {
    return mkdirp(paths.levelOut)
        .then(() => globby(paths.levels))
        .then(files => {
            let fileStatPairs = [];
            let outFiles = [];
            for (let file of files) {
                let outFile = fullpath.basename(file, ".tmx");
                outFile = path.join(paths.levelOut, outFile + ".json");
                fileStatPairs.push(stat(file));
                fileStatPairs.push(
                    stat(outFile)
                        // If the destination file doesn't exist, return an mtime of 0.
                        .catch(err => {
                            return { mtime: 0 };
                        })
                );
                outFiles.push(outFile);
            }
            return Promise.all(fileStatPairs).then(statPairs => {
                return { pairs: statPairs, files: files, outFiles: outFiles };
            });
        })
        .then(data => {
            let modifiedFiles = [];
            const statPairs = data.pairs;
            for (let i = 0; i < statPairs.length; i += 2) {
                const inFileStat = statPairs[i];
                const outFileStat = statPairs[i + 1];
                if (inFileStat.mtime >= outFileStat.mtime) {
                    modifiedFiles.push({
                        fileIn: data.files[i / 2],
                        fileOut: data.outFiles[i / 2],
                    });
                }
            }
            return modifiedFiles;
        })
        .then(files => {
            let promises = [];
            for (let filePair of files) {
                const file = filePair.fileIn;
                const outFile = filePair.fileOut;
                promises.push(
                    readFile(file)
                        .then(data => data.toString())
                        .then(parseXMLString)
                        // .then(levelXMLtoJSON)
                        .then(jsonOutput => writeFile(outFile, jsonOutput))
                        .catch(err => {
                            console.error("Error parsing level:", err);
                            throw new Error("Parsing error");
                        })
                );
            }
            return Promise.all(promises);
        })
        .catch(err => {
            console.error("Failed to create levels", err);
        });
});

generateAndValidate("scenario-lint", "Scenario", paths.scenarios);
generateAndValidate("actors-lint", "ActorSpecArray", paths.actors);
generateAndValidate("items-lint", "ItemDictionary", paths.items);

gulp.task("host-rx-assets", ["levels", "scenario-lint"], function() {
    return gulp
        .src(paths.host_rx_assets)
        .pipe(newer(path.join(paths.host_int, "assets/hd")))
        .pipe(gulpif("*.json", strip()))
        .pipe(gulpif("*.png", imageop(imageMinOptions)))
        .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
        .pipe(gulp.dest(path.join(paths.host_int, "assets/hd")))
        .pipe(gulp.dest(path.join(paths.host_int, "assets/sd")));
});

gulp.task("client-rx-assets", function() {
    return gulp
        .src(paths.client_rx_assets)
        .pipe(newer(path.join(paths.client_int, "assets/hd")))
        .pipe(gulpif("*.json", strip()))
        .pipe(gulpif("*.png", imageop(imageMinOptions)))
        .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
        .pipe(gulp.dest(path.join(paths.client_int, "assets/hd")))
        .pipe(gulp.dest(path.join(paths.client_int, "assets/sd")));
});

gulp.task("client-scss", function() {
    return gulp
        .src(paths.client_scss)
        .pipe(sass().on("error", sass.logError))
        .pipe(
            autoprefixer({
                browsers: [">1%", "not ie < 11"],
                remove: true,
            })
        )
        .pipe(gulp.dest(paths.client_int));
});

gulp.task("host-scss", function() {
    return gulp
        .src(paths.host_scss)
        .pipe(sass().on("error", sass.logError))
        .pipe(
            autoprefixer({
                browsers: ["last 2 versions", "not ie < 11"],
                remove: true,
            })
        )
        .pipe(gulp.dest(paths.host_int));
});

var hostComplete = null;
var hostFailed = null;
/* eslint no-unused-expressions: 0 */
gulp.task("host-images", ["host-rx-assets"], function(cb) {
    gulp.src(paths.host_image_source)
        .pipe(newer(paths.host_images))
        .pipe(gulpif("*.png", imageop(imageMinOptions)))
        .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
        .pipe(
            gulpif(
                "*.json",
                gulpprint(function(filepath) {
                    return "Copying: " + filepath;
                })
            )
        )
        .pipe(gulp.dest(paths.host_images))
        .on("end", () => {
            cb();
            hostComplete && hostComplete();
        })
        .on("error", err => {
            cb(err);
            hostFailed && hostFailed(err);
        });
});

gulp.task("app-gen-images", function(cb) {
    const logo = paths.app_logo;

    Promise.all(genimages(logo, paths.app_image_source_dir))
        .then(() => cb())
        .catch(cb);
});

gulp.task("app-images", ["app-gen-images"], function(cb) {
    let win = new Promise((resolve, reject) => {
        gulp.src(paths.app_image_source_windows)
            .pipe(newer(paths.app_images_windows))
            .pipe(gulpif("*.png", imageop(imageMinOptions)))
            .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
            .pipe(
                gulpif(
                    "*.json",
                    gulpprint(function(filepath) {
                        return "Copying: " + filepath;
                    })
                )
            )
            .pipe(gulp.dest(paths.app_images_windows))
            .on("end", () => {
                resolve();
                hostComplete && hostComplete();
            })
            .on("error", err => {
                reject(err);
                hostFailed && hostFailed(err);
            });
    });

    let android = new Promise((resolve, reject) => {
        gulp.src(paths.app_image_source_android)
            .pipe(newer(paths.app_images_android))
            .pipe(gulpif("*.png", imageop(imageMinOptions)))
            .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
            .pipe(
                gulpif(
                    "*.json",
                    gulpprint(function(filepath) {
                        return "Copying: " + filepath;
                    })
                )
            )
            .pipe(gulp.dest(paths.app_images_android))
            .on("end", () => {
                resolve();
                hostComplete && hostComplete();
            })
            .on("error", err => {
                reject(err);
                hostFailed && hostFailed(err);
            });
    });

    Promise.all([win, android])
        .then(() => cb())
        .catch(cb);
});

gulp.task("host-images-delayed", function(callback) {
    // Wait 4000ms to start on images. When exporting images from
    // TexturePacker it writes several images and the newer() test
    // doesn't see images written *after* the first one.
    return setTimeout(() => {
        runSequence("host-images", callback);
    }, 4000);
});

var clientComplete = null;
var clientFailed = null;

gulp.task("client-images", ["client-copy-root"], function(cb) {
    gulp.src(paths.client_image_source)
        .pipe(newer(paths.client_images))
        .pipe(gulpif("*.png", imageop(imageMinOptions)))
        .pipe(gulpif("*.jpg", imageop(imageMinOptions)))
        .pipe(gulp.dest(paths.client_images))
        .on("end", () => {
            cb();
            clientComplete && clientComplete();
        })
        .on("error", err => {
            cb(err);
            clientFailed && clientFailed(err);
        });
});

gulp.task("client-images-delayed", function(callback) {
    // Wait 4000ms to start on images. When exporting images from
    // TexturePacker it writes several images and the newer() test
    // doesn't see images written *after* the first one.
    setTimeout(() => {
        runSequence("client-images", callback);
    }, 4000);
});

gulp.task("host-copy-js", ["vendor-js"], function() {
    return gulp
        .src(paths.static_js)
        .pipe(newer(paths.host_js))
        .pipe(gulp.dest(paths.host_js));
});

gulp.task("client-copy-js", ["vendor-js"], function() {
    return gulp
        .src(paths.static_js)
        .pipe(newer(paths.client_js))
        .pipe(gulp.dest(paths.client_js));
});

gulp.task("host-copy-root", ["host-scss"], function() {
    const productionPipe = lazypipe()
        .pipe(function() {
            return makeProductionHTMLBuilder("hostProduction");
        })
        .pipe(function() {
            return htmlmin({
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
            });
        });

    return gulp
        .src(paths.host_root)
        .pipe(gulpif("index.html", injectCSS(path.join(paths.host_int, "index.css"))))
        .pipe(gulpif("index.html", gulpif(production, productionPipe())))
        .pipe(gulp.dest(paths.host));
});
gulp.task("client-copy-root", ["client-scss", "client-rx-assets"], function() {
    const productionPipe = lazypipe()
        .pipe(function() {
            return makeProductionHTMLBuilder("clientProduction");
        })
        .pipe(function() {
            return htmlmin({
                collapseWhitespace: true,
                minifyCSS: true,
            });
        });
    return gulp
        .src(paths.client_root)
        .pipe(gulpif("index.html", injectCSS(path.join(paths.client_int, "index.css"))))
        .pipe(gulpif("index.html", gulpif(production, productionPipe())))
        .pipe(gulp.dest(paths.client));
});

gulp.task("clean", function(callback) {
    // Call all three directory deletes at once, and
    // wait for all three to be done before calling callback.
    Promise.all([
        rimraf(paths.int),
        rimraf(paths.host),
        rimraf(paths.test),
        rimraf(paths.client),
    ])
        .then(() => {
            callback();
        })
        .catch(err => {
            if (err) {
                throw new gutil.PluginError("rimraf", err);
            } else {
                throw new gutil.PluginError("rimraf");
            }
        });
});

gulp.task("test-copy-root", function() {
    return gulp
        .src(["test/index.html", "./node_modules/mocha/mocha.css"])
        .pipe(gulp.dest(paths.test));
});

gulp.task("test-copy-js", function() {
    return gulp
        .src(
            [
                "./node_modules/power-assert/build/power-assert.js",
                "./node_modules/mocha/mocha.js",
            ].concat(paths.static_js)
        )
        .pipe(gulp.dest(paths.test_js));
});

let testCache;
gulp.task("build-test", ["test-copy-root", "test-copy-js"], function() {
    const espowerSource = require("./gulp/espower");
    const tsProject = ts.createProject("./tsconfig.json", {
        module: "es6",
        target: "es6",
        typescript: require("typescript"),
    });
    var options = extend({}, rollupConfig);

    options.output.file = path.join(paths.test, "js/tests.js");
    // disable TypeScript
    options.plugins = options.plugins.slice(1);
    options.output.sourcemap = false;
    options.input = "gentest/alltests.js";
    options.cache = testCache;
    addVendor(options);

    return mkdirp("gentest/helpers")
        .then(() => {
            const copyPromise = new Promise(resolve => {
                gulp.src(["test/helpers/*"])
                    .pipe(gulp.dest("gentest/helpers"))
                    .on("end", () => {
                        resolve();
                    });
            });
            let done = new Promise(resolve => {
                const promises = [copyPromise];
                let headers = `
import { polyfill } from "../src/common/polyfill.ts" ;
// Implement some necessary polyfills
polyfill();
                `;
                let tests = "";
                let i = 0;

                gulp.src(["test/**/*.test.ts", "src/declarations/*.d.ts"])
                    .pipe(tsProject())
                    .on("data", processedFile => {
                        const file = processedFile.path;
                        if (file.substr(-5) === ".d.ts") return;

                        const js = fullpath.basename(file);
                        headers += `import { result as test_${i} } from "./${js}";\n`;
                        tests += `assert.notEqual(test_${i},null);\n`;

                        promises.push(
                            writeFile(
                                `gentest/${js}`,
                                espowerSource(processedFile.contents.toString(), file)
                            )
                        );
                        i++;
                    })
                    .on("end", () => {
                        promises.push(writeFile("gentest/alltests.js", headers + tests));
                        resolve(Promise.all(promises));
                    });
            });
            return done;
        })
        .then(() => {
            return rollup(options)
                .then(function(bundle) {
                    testCache = bundle;
                    return bundle.write(options.output);
                })
                .catch(err => {
                    console.error("Failed to build test:", err);
                    throw new Error("Failed to build test");
                });
        });
});

gulp.task("test", ["build-test"], function() {
    const mochaPhantomJS = require("gulp-mocha-phantomjs");
    return gulp.src(path.join(paths.test, "index.html")).pipe(mochaPhantomJS());
});

gulp.task("watch-host", ["host"], function() {
    gulp.watch(paths.host_src, ["host-js"]);
    gulp.watch(paths.host_root.concat(paths.host_css), ["host-copy-root"]);
    gulp.watch(
        paths.host_image_source.concat(
            [paths.levels],
            paths.host_rx_assets,
            paths.json_validation
        ),
        ["host-images-delayed"]
    );
    gulp.watch(paths.coregame, ["jsonimports", "items-lint", "actors-lint"]);
});

gulp.task("watch-client", ["client"], function() {
    gulp.watch(paths.client_src, ["client-js"]);
    gulp.watch(paths.client_root.concat(paths.client_css), ["client-copy-root"]);
    gulp.watch(paths.client_image_source.concat(paths.client_rx_assets), [
        "client-images-delayed",
    ]);
});

gulp.task("watch", ["watch-host", "watch-client"], function() {
    gulp.watch(paths.static_js, ["host-copy-js", "client-copy-js"]);
});

gulp.task("serve", ["watch"], function() {
    const nodeStatic = require("node-static");

    function handleError(request, response, err) {
        if (request.url === "/exit") {
            response.writeHead(200, { "Content-Type": "text/plain; charset=utf8" });
            response.end("Exiting");

            setTimeout(() => {
                console.log("Calling exit");
                process.exit(0);
            }, 200);
            return;
        }
        console.error("Error serving " + request.url + " - " + err.message);

        // Respond to the client
        err.headers["Content-Type"] = "text/plain; charset=utf8";
        response.writeHead(err.status, err.headers);
        response.end("404 - not found");
    }
    function checkSource(request, response) {
        let localFile = false;
        if (request.url.search(/^\/node_modules/) !== -1) {
            localFile = "." + request.url;
        }
        if (request.url.search(/^\/source/) !== -1) {
            localFile = path.join("frameworks/phaser/", request.url.substr(7));
        }
        if (!localFile) return false;

        readFile(localFile)
            .then(data => {
                console.log("serving", request.url);

                response.end(data.toString());
            })
            .catch(e => {
                console.log("not found", localFile, e, process.cwd());

                response.writeHead(404);
                response.end("File not found (404): ", request.url);
            });
        return true;
    }
    const serverHeaders = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Server: "steel_debug_node",
    };
    const hostServer = new nodeStatic.Server(paths.host, {
        cache: false,
        headers: serverHeaders,
    });
    // const user = process.env["USER"] || process.env["USERNAME"];
    require("http")
        .createServer(function(request, response) {
            request
                .addListener("end", function() {
                    if (request.url === "/") {
                        response.writeHead(200, {
                            "Content-Type": "text/html; charset=utf8",
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                            Server: "steel_debug_node",
                        });
                        fs.readFile(
                            path.join(paths.host, "index.html"),
                            (error, data) => {
                                const modified = data
                                    .toString()
                                    .replace('<script src="cordova.js"></script>', "")
                                    .replace(
                                        /\/\*GAME_CLIENT_DEBUG\*\//,
                                        `'debug':true,`
                                    );

                                response.end(modified);
                            }
                        );
                    } else if (!checkSource(request, response)) {
                        hostServer.serve(request, response, function(err, result) {
                            if (err) {
                                // There was an error serving the file
                                handleError(request, response, err);
                            }
                        });
                    }
                })
                .resume();
        })
        .listen(8888);

    const clientServer = new nodeStatic.Server(paths.client, {
        cache: false,
        headers: serverHeaders,
    });
    require("http")
        .createServer(function(request, response) {
            request
                .addListener("end", function() {
                    let parts = request.url.split("?");
                    let requestPath = parts[0];
                    // let options = parts[1];
                    if (requestPath === "/") {
                        response.writeHead(200, {
                            "Content-Type": "text/html; charset=utf8",
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                            Server: "steel_debug_node",
                        });
                        // let clientId = options ? Number(options.split("=")[1]) : 1;
                        fs.readFile(
                            path.join(paths.client, "index.html"),
                            (error, data) => {
                                const modified = data
                                    .toString()
                                    .replace(
                                        /\/\*GAME_CLIENT_DEBUG\*\//,
                                        `'debug':true,`
                                    );
                                response.end(modified);
                            }
                        );
                    } else if (!checkSource(request, response)) {
                        clientServer.serve(request, response, function(err, result) {
                            if (err) {
                                // There was an error serving the file
                                handleError(request, response, err);
                            }
                        });
                    }
                })
                .resume();
        })
        .listen(8889);

    console.log("Servers running on localhost. Connect to http://localhost:8888");
});

gulp.task("watch-test", ["build-test"], function() {
    gulp.watch(paths.host_src.concat("test/**/*.ts"), ["test"]);
});

gulp.task("watch-all", ["watch"], function() {
    gulp.watch(paths.host_src.concat("test/**/*.ts"), ["test"]);
});

gulp.task("cordova", ["host", "app-images"], function(cb) {
    exec("cd app && cordova run windows")
        .then(a => {
            console.log("Cordova results:");
            console.log(a[0]);
            console.log(a[1]);
            cb();
        })
        .catch(err => {
            cb(err);
        });
});

gulp.task("phaser", function(cb) {
    const buildPhaser = require("./gulp/phaser");
    return buildPhaser(production, cb);
});

gulp.task("client", [
    "lint",
    "client-js",
    "client-images",
    "client-copy-js",
    "client-copy-root",
]);

gulp.task("host", [
    "lint",
    "host-js",
    "host-images",
    "host-copy-js",
    "host-copy-root",
    "levels",
    "jsonimports",
    "items-lint",
    "actors-lint",
]);

gulp.task("default", ["client", "host"]);

gulp.task("docker", ["client"], function(cb) {
    exec("cd server && docker build -t quickcharge/dracoweb .")
        .then(a => {
            console.log("Docker results:");
            console.log(a[0]);
            console.log(a[1]);
            cb();
        })
        .catch(err => {
            cb(err);
        });
});

gulp.task("dockerpush", function(cb) {
    exec("docker push quickcharge/dracoweb")
        .then(a => {
            console.log(a[0]);
            console.log(a[1]);
            const ACCESS_TOKEN = "df9dc6ee121d495ea6e191028466aeb0";
            const ENVIRONMENT = "production";
            const LOCAL_USERNAME = execSync(
                `git log -n 1 --pretty=format:"%an"`
            ).toString();
            const REVISION = execSync(`git log -n 1 --pretty=format:"%H"`).toString();
            const LOCATION = process.env.CIRCLECI ? "CircleCI" : "Dev System";

            return exec(`curl https://api.rollbar.com/api/1/deploy/ \
                -F access_token=${ACCESS_TOKEN} \
                -F environment=${ENVIRONMENT}:${LOCATION} \
                -F revision=${REVISION} \
                -F local_username='${LOCAL_USERNAME}'`);
        })
        .then(a => {
            console.log(a[1]);
            cb();
        })
        .catch(err => {
            cb(err);
        });
});
