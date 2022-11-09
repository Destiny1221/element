/**
 * 监听/examples/pages/template 目录下的所有模版文件，当模版文件发生改变时自动执行npm run i18n
 * 即node i18n.js命令
 */
const path = require('path');
/**
 * 监听目录
 * process.cwd()返回一个字符串，该字符串指令node.js进程的当前工作目录，即执行node template.js时的工作目录，
 * 由于该命令是在package.json文件中scripts中配置的，package.json文件一般都处在根目录下，因此不会经常变
 */
const templates = path.resolve(process.cwd(), './examples/pages/template');

// 负责监听的库
const chokidar = require('chokidar');
// 监听模板目录
let watcher = chokidar.watch([templates]);

// 当目录下的文件发生改变时，自动执行 npm run i18n
watcher.on('ready', function() {
  watcher
    .on('change', function() {
      exec('npm run i18n');
    });
});

function exec(cmd) {
  return require('child_process').execSync(cmd).toString().trim();
}
