// for WebAssembly typings:
/// <reference lib="dom" />

import { compile, docs, run, test, upgrade } from "./commands";
import { join } from "path";
import { satisfies } from 'compare-versions';

import { Command } from "commander";
import debug from "debug";

const PACKAGE_VERSION = require("../package.json").version as string;
const SUPPORTED_NODE_VERSION = require("../package.json").engines.node as string;
if (!SUPPORTED_NODE_VERSION) {
  throw new Error("couldn't parse engines.node version from package.json");
}
const log = debug("wing:cli");

async function main() {
  checkNodeVersion()

  const program = new Command();

  program.name("wing");
  program.version(PACKAGE_VERSION);

  await upgrade({ force: false }).catch(log);

  program
    .command("run")
    .alias("it")
    .description("Runs either a Wing file (`.s` extension) or Wing Simulator file (`.wsim` extension) in the Wing Console")
    .argument("[entrypoint]", "Either a file (`.s` or `.wsim`) or a directory (which contains a single `.s` or `.wsim` file to run)")

  program
    .command("compile")
    .description("Compiles a Wing program")
    .argument("<entrypoint>", "program .w entrypoint")
    .option(
      "-o, --out-dir <out-dir>",
      "Output directory",
      join(process.cwd(), "target")
    )
    .option(
      "-t, --target <target>",
      "Target platform (options: 'tf-aws', 'tf-azure', 'sim')",
      "tf-aws"
    )
    .action(compile);

  program
    .command("test")
    .description("Compiles a Wing program and runs all functions with the word 'test' or start with 'test:' in their resource identifiers")
    .argument("<entrypoint...>", "all entrypoints to test")
    .action(test);

program
    .command("docs")
    .description("Open the Wing documentation")
    .action(docs);

  program
    .command("upgrade")
    .description("Upgrades the Wing toolchain to the latest version")
    .action(() => upgrade({ force: true }));

  program.parse();
}

function checkNodeVersion() {
  const supportedVersion = SUPPORTED_NODE_VERSION;

  if (!satisfies(process.version, supportedVersion)) {
    console.warn(`WARNING: You are running an incompatible node.js version ${process.version}. Compatible engine is: ${supportedVersion}.`)
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
