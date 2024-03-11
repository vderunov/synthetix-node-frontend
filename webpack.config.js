const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const dotenv = require('dotenv');

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const htmlPlugin = new HtmlWebpackPlugin({
  template: './index.html',
  title: 'Synthetix node frontend',
  scriptLoading: 'defer',
  minify: false,
  hash: false,
  xhtml: true,
});

const devServer = {
  port: process.env.NODE_PORT || '3000',

  hot: !isTest,
  liveReload: false,

  historyApiFallback: true,

  devMiddleware: {
    writeToDisk: true,
    publicPath: '',
  },

  client: {
    logging: 'log',
    overlay: false,
    progress: false,
  },

  static: './public',

  headers: { 'Access-Control-Allow-Origin': '*' },
  allowedHosts: 'all',
  open: false,
  compress: false,
};

const babelRule = {
  test: /\.(js)$/,
  include: [
    // Only include code in the src to ensure that library functions do not need compilation
    /src/,
  ],
  use: {
    loader: require.resolve('babel-loader'),
    options: {
      configFile: path.resolve(__dirname, 'babel.config.js'),
    },
  },
};

module.exports = {
  devtool: isProd ? 'inline-source-map' : isTest ? false : 'source-map',
  devServer,
  mode: isProd ? 'production' : 'development',
  entry: './src/index.js',
  optimization: {
    moduleIds: 'named',
    minimize: false,
  },

  output: {
    path: path.resolve(__dirname, 'dist/ethers'),
    publicPath: '',
    filename: '[name].js',
    chunkFilename: '[name].js',
    assetModuleFilename: '[name].[contenthash:8][ext]',
    clean: true,
  },

  plugins: [
    htmlPlugin,
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),
    new webpack.NormalModuleReplacementPlugin(
      /^debug$/,
      path.resolve(path.dirname(require.resolve('debug/package.json')), 'src', 'browser.js')
    ),
    ...(isProd ? [] : isTest ? [] : [new ReactRefreshWebpackPlugin({ overlay: false })]),
  ],

  resolve: {
    extensions: ['.js'],
  },

  module: {
    rules: [babelRule],
  },
};
