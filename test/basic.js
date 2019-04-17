const child_process = require("child_process");
const path = require("path");
const assert = require("assert");

const runWithFile = (file) => {
  return new Promise((resolve, reject) => {
    const proc = child_process.fork(path.resolve(__dirname, "../index.js"), [
      "--duktape", path.resolve(__dirname, "duktape-2.3.0"),
      file,
      // write to stdout
      "-o", "-"
    ], {
      "stdio": [ "pipe", "pipe", "ignore", "ipc" ]
    });
    
    let transmitted = Buffer.alloc(0);
    proc.stdout.on("data", (data) => {
      transmitted = Buffer.concat([transmitted, data]);
    });
    
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(transmitted);
      } else {
        reject(code);
      }
    });
  });
};

describe("compilation of a valid file", function () {
  this.timeout(20000);

  it("should produce a valid output file", () => {
    return runWithFile(path.resolve(__dirname, "good.djs"))
      .then((transmitted) => {
        assert.equal(transmitted.length, 144, "length of bytecode file not OK");
      });
  });
});

describe("compilation of invalid file", function () {
  this.timeout(20000);

  it("should given an error", () => {
    return assert.rejects(runWithFile(path.resolve(__dirname, "bad.djs")));
  });
});
