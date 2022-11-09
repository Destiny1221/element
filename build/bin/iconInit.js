'use strict';

/**
 * 根据icon.scss样式文件中的选择器，通过正则匹配的方式，匹配所有的icon名称
 * 然后将所有icon名组成的数据写入到/examples/icon.json 文件中
 * 该文件再观望的icon图表页用来自动生成所有icon图标
 */
var postcss = require('postcss');
var fs = require('fs');
var path = require('path');
// 去取icon.scss文件内容
var fontFile = fs.readFileSync(path.resolve(__dirname, '../../packages/theme-chalk/src/icon.scss'), 'utf8');
// 得到样式节点
var nodes = postcss.parse(fontFile).nodes;
var classList = [];

nodes.forEach((node) => {
  var selector = node.selector || '';
  // 从选择器中匹配出 icon 名称，比如 el-icon-add，匹配得到 add
  var reg = new RegExp(/\.el-icon-([^:]+):before/);
  var arr = selector.match(reg);

  if (arr && arr[1]) {
    classList.push(arr[1]);
  }
});

classList.reverse(); // 希望按 css 文件顺序倒序排列

// 将 icon 名组成的数组写入 /examples/icon.json 文件
fs.writeFile(path.resolve(__dirname, '../../examples/icon.json'), JSON.stringify(classList), () => {});
