const path = require('path');

module.exports = {
  presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],

  env: {
    production: {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'commonjs',
            targets: { browsers: ['last 1 Chrome version'] },
          },
        ],
      ],
    },

    development: {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'commonjs',
            targets: { browsers: ['last 1 Chrome version'] },
          },
        ],
      ],
      plugins: [require.resolve('react-refresh/babel')],
    },

    test: {
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'commonjs',
            targets: { node: 'current' },
          },
        ],
      ],
      plugins: [
        [
          require.resolve('babel-plugin-istanbul'),
          {
            cwd: path.resolve('.'),
            all: false,
            excludeNodeModules: true,
            include: ['lib/**/*.js'],
            exclude: ['**/*.test.*', '**/*.cy.*', '**/*.e2e.*'],
          },
          'istanbul',
        ],
      ],
    },
  },
};
