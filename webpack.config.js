var path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
      'svebaselib': './src/index.ts',
      'svebaselib.min': './src/index.ts'
    },
    output: {
      path: path.resolve(__dirname, '_bundles'),
      filename: '[name].js',
      libraryTarget: 'umd',
      library: 'SveBaseLib',
      umdNamedDefine: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'source-map',
    module: {
      rules: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
        query: {
          declaration: false,
        }
      }]
    }
};
  
  