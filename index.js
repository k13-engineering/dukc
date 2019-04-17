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
const outfileRaw = args.o || args.output || "a.bin";
const outfile = path.resolve(outfileRaw);

console.error = function (msg) {
  process.stderr.write(msg + "\n");
};
console.warn = console.error;

if (args.v || args.verbose) {
  console.log = console.error;
} else {
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

    const temporaryOutputFile = path.resolve(workdir, "out.temp");

    await exec(`${newCompileBinary} ${files[0]} ${temporaryOutputFile}`);
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(temporaryOutputFile)
        .pipe(outfileRaw === "-" ? process.stdout : fs.createWriteStream(outfile))
        .on("error", (error) => reject(error))
        .on("end", () => resolve());
    });
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
