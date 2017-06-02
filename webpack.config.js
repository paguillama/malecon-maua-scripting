var path = require('path');

module.exports = {
  entry: [
    path.join(__dirname, 'src/index.js')
  ],
  module: {
    rules: [{
      exclude: /node_modules/,
      test: /\.js$/,
      use: { loader: 'babel-loader' }
    }],
  },
  output: {
    filename: 'bundle.gs',
    libraryTarget: 'this',
    path: path.join(__dirname, 'dist')
  }
};
