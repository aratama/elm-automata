"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = main;

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _util = require("util");

var _util2 = _interopRequireDefault(_util);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _view = require("./template/view");

var _automata = require("./template/automata");

var _update = require("./template/update");

var _type = require("./template/type");

var _router = require("./template/router");

var _style = require("./template/style");

var _root = require("./template/root");

var _minimist = require("minimist");

var _minimist2 = _interopRequireDefault(_minimist);

var _readline = require("readline");

var _readline2 = _interopRequireDefault(_readline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getApplicationName() {
  const filesInRoot = await _fsExtra2.default.readdir(`./src`);

  const dirsWithNull = await Promise.all(filesInRoot.map(async file => {
    const stat = await _fsExtra2.default.stat(_path2.default.resolve("./src/", file));
    return stat.isDirectory() ? file : null;
  }));

  const dirs = dirsWithNull.filter(dir => dir !== null);

  if (dirs.length !== 1) {
    throw new Error("Cannot decide the application name. Too many directory or no directory in src directory. ");
  }

  const application = dirs[0];

  return application;
}

async function generateRouter(argv) {
  // ensure application directory
  try {
    const application = await getApplicationName();
    console.log(`Found application: ${application}`);
  } catch (e) {
    await new Promise((resolve, reject) => {
      console.log("No application directory found. It will be generated.");

      const rl = _readline2.default.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Application name? ", async answer => {
        if (/[A-Z][a-zA-Z0-9_]*/.test(answer)) {
          await _fsExtra2.default.ensureDir(_path2.default.resolve("src", answer));
          rl.close();
          resolve();
        } else {
          rl.close();
          reject(new Error(`${answer} is not a valid package name.`));
        }
      });
    });
  }

  // create root Type.elm
  const application = await getApplicationName();

  if (!_fsExtra2.default.existsSync(_path2.default.resolve("src", application, "Type.elm"))) {
    console.log(`Generating ${application}/Type.elm`);
    await _fsExtra2.default.writeFile(`./src/${application}/Type.elm`, (0, _root.renderRootType)(application));
  }

  // generate NoutFound
  const notFoundExists = await pageExists("NotFound");
  if (!notFoundExists) {
    await generateNewPage("NotFound");
  }

  // get page names

  const ds = await _util2.default.promisify(_glob2.default)(`./src/${application}/Page/**/`);

  const pages = ds.map(dir => {
    if (_fsExtra2.default.existsSync(_path2.default.resolve(dir, "style.css")) && _fsExtra2.default.existsSync(_path2.default.resolve(dir, "Type.elm")) && _fsExtra2.default.existsSync(_path2.default.resolve(dir, "Update.elm")) && _fsExtra2.default.existsSync(_path2.default.resolve(dir, "View.elm"))) {
      return _path2.default.relative(`./src/${application}/Page/`, dir).split(_path2.default.sep);
    } else {
      return null;
    }
  }).filter(dir => dir !== null);

  if (pages.length === 0) {
    throw new Error("Pege not found.");
  }

  // generate <application>.Automata.elm
  console.log(`Generating ./src/${application}/Automata.elm for ${pages.map(p => p.join(".")).join(", ")}...`);
  const source = (0, _router.renderRouter)(application, pages, argv);
  await _fsExtra2.default.writeFile(`./src/${application}/Automata.elm`, source);

  // generate automata.js
  console.log(`Generating ./src/${application}/automata.js...`);
  const indexSource = (0, _style.renderStyle)(application, pages);
  await _fsExtra2.default.writeFile(_path2.default.resolve("./src/", application, "automata.js"), indexSource);

  // generate Automata.elm
  await Promise.all(pages.map(async page => {
    await _fsExtra2.default.writeFile(_path2.default.resolve("./src/", application, "Page", page.join("/"), "Automata.elm"), (0, _automata.renderAutomata)(application, page));
  }));

  console.log("Done.");
}

async function pageExists(pageName) {
  if (!/[A-Z][a-zA-Z0-9_]*/.test(pageName)) {
    throw new Error(`Invalid page name: ${pageName}. An page name must be an valid Elm module name.`);
  }

  const application = await getApplicationName();

  return _fsExtra2.default.existsSync(_path2.default.resolve(`./src/`, application, `Page`, pageName));
}

async function generateNewPage(pageName) {
  if (!/[A-Z][a-zA-Z0-9_]*/.test(pageName)) {
    throw new Error(`Invalid page name: ${pageName}. An page name must be an valid Elm module name.`);
  }

  console.log(`Generating new page: ${pageName}`);

  const application = await getApplicationName();

  const exists = await pageExists(pageName);
  if (exists) {
    console.error(`[Error] Directory '${pageName}' already exists.`);
    process.exitCode = 1;
  } else {
    const dir = _path2.default.resolve("./src/", application, "Page", pageName);
    await _fsExtra2.default.ensureDir(dir);
    await _fsExtra2.default.writeFile(_path2.default.resolve(dir, "style.css"), "");
    await _fsExtra2.default.writeFile(_path2.default.resolve(dir, "Type.elm"), (0, _type.renderType)(application, pageName));
    await _fsExtra2.default.writeFile(_path2.default.resolve(dir, "Update.elm"), (0, _update.renderUpdate)(application, pageName));
    await _fsExtra2.default.writeFile(_path2.default.resolve(dir, "View.elm"), (0, _view.renderView)(application, pageName));
  }
}

async function main() {
  var argv = (0, _minimist2.default)(process.argv.slice(2));
  const command = argv._[0];
  if (argv._.length === 0) {
    console.log(`
Usage: 

  elm-automata update
    
    (Re)Generate Automata.elm, automata.js

  elm-automata new <name>
      
    Create new page named <name>. <name> must be an valid module name.

Options:

  --parse <hash|path>
    
     Specify an url parse function. The default is "hash".

    `.trim());

    try {
      const application = await getApplicationName();
      console.log(`\nApplication found: ${application}`);
    } catch (e) {
      console.log(e.toString());
    }
  } else if (command === "update") {
    await generateRouter(argv);
  } else if (command === "new") {
    await generateNewPage(process.argv[3]);
    await generateRouter(argv);
  } else {
    console.error(`[ERROR] Unknown command: ${command}`);
    process.exitCode = 1;
  }
}

main();