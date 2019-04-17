#!/usr/bin/node

const fs = require("fs-extra");
const child_process = require("child_process");
const util = require("util");
const path = require("path");

const tmp = require("tmp");
const minimist = require("minimist");

const exec = util.promisify(child_process.exec);

const tmpdir = tmp.dirSync();
const workdir = path.resolve(tmpdir.name);
// const workdir = "/tmp";
const args = minimist(process.argv);

const kjsdir = ".";
const outfile = path.resolve(args.o || args.output || "a.bin");

if (!(args.v || args.verbose)) {
  console.log = function () {};
}

process.nextTick(async() => {
  try {
    const files = args._.slice(2);
    if (files.length === 0) {
      throw new Error("no input files given");
    } else if (files.length > 1) {
      throw new Error("too much input files given");
    }

    if (!args.duktape) {
      throw new Error("--duktape argument missing!");
    }
    const duktape = path.resolve(args.duktape);

    const newCompileBinary = path.resolve(workdir, "compile");

    console.log(`using duktape installation ${duktape} to prepare temporary compile worker ${newCompileBinary}`);

    await exec(`cc -o ${newCompileBinary} -I ${path.resolve(duktape, "src")} ${path.resolve(__dirname, "assets/compile.c")} ${path.resolve(duktape, "src/duktape.c")} -lm`);

    console.log(`executing compile worker to generate output file ${outfile} from ${files[0]}`);

    await exec(`${newCompileBinary} ${files[0]} ${outfile}`);

    // await compile(path.resolve(files[0]), path.resolve(workdir, "main.js"));
    // 
    // await exec(`ld -r -b binary main.js -o data.o`, { "cwd": workdir });
    // await exec(`musl-clang -g -Os -static ${path.resolve(kjsdir, "rt.c")} ${path.resolve(workdir, "data.o")} ${path.resolve(kjsdir, "..", "libkjs", "build", "linux-x86_64", "libkjs.a")} -o ${outfile}`);
  } catch (ex) {
    console.error(ex);
    process.exitCode = -1;
  } finally {
    try {
      await fs.remove(workdir);
    } catch (ex) {
      console.warn("failed to remove temporary directory", ex);
    }
  }
});
