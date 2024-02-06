const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

const render = (content, data) => {
  for (const key in data) {
    const search = new RegExp(`{{ *${key} *}}`, 'g');
    const value = data[key];

    content = content.replace(search, value);
  }

  return content;
};

module.exports = {
  mode: 'production',
  stats: 'minimal',

  output: {
    path: path.join(__dirname, 'dist/'),
    clean: true,
  },

  plugins: [
    new HtmlBundlerPlugin({
      verbose: true,

      entry: {
        index: {
          import: 'src/views/index.html',
          // pass static data into template, Webpack must be reloaded after changes in the data
          data: {
            teaser: 'This is the string variable passed from Webpack configuration.',
          },
        },

        'www/index': {
          import: 'src/views/index.html',
          // pass data into template
          data: {
            teaser: 'The generated page under the "www" route.',
          },
        },

        contact: {
          import: 'src/views/template.html',
          // pass diff data into same template
          data: {
            title: 'Contact',
            header: 'Contact page',
          },
        },

        about: {
          import: 'src/views/template.html',
          // pass dynamic data as a file, it takes effect after changes in the file
          data: 'src/data/about.json',
        },
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(html)$/,
        loader: HtmlBundlerPlugin.loader,
        options: {
          preprocessor: (content, { resource, data }) => {
            //console.log('>>  preprocessor: ', { resource, data });
            return render(content, data);
          },
        },
      },

      {
        test: /\.(css|sass|scss)$/,
        use: ['css-loader', 'sass-loader'],
      },

      {
        test: /\.(png|jpe?g|ico|svg)/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/img/[name].[hash:8][ext][query]',
        },
      },
    ],
  },

  // enable live reload
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    watchFiles: {
      paths: ['src/**/*.*'],
      options: {
        usePolling: true,
      },
    },
  },
};
