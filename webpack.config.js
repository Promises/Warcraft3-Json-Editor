const path = require('path');

module.exports = {
  output: {
    globalObject: 'self',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'electron-renderer'
};
