const path = require('path');
const AssetTrash = require('../AssetTrash');

/** @typedef {import('webpack').Compilation} Compilation */
/** @typedef {import('webpack').sources.ConcatSource} ConcatSource */

/**
 * The plugin module to extract the CSS and source map from asset.
 *
 * @note If webpack mode is `production`, then `scss-loader` minifies the CSS self.
 *  If webpack is in `development` mode, then CSS is pretty formatted.
 */

class CssExtractModule {
  /** @type {Compilation} */
  static compilation;

  /**
   * @param {Compilation} compilation
   */
  static init(compilation) {
    this.compilation = compilation;
  }

  /**
   * Extract CSS and source map from the result of the css-loader.
   *
   * @note The @import handling in CSS is not supported, e.g.: @import 'assets/css/style.css'.
   * Disable @import at-rules handling in `css-loader`:
   * {
   *   test: /\.css$/i,
   *   use: [
   *     {
   *       loader: 'css-loader'
   *       options: {
   *         import: false, // disable @import at-rules handling
   *       },
   *     },
   *   ],
   * },
   *
   * @param {Array<[]>} data The data generated by `css-loader`.
   * @param {Function?} update The callback to replace in url() the raw request with the output filename.
   * @returns {ConcatSource}
   */
  static apply(data, update) {
    const { compiler } = this.compilation;
    const { ConcatSource, SourceMapSource } = compiler.webpack.sources;
    const source = new ConcatSource();
    const hasUpdate = typeof update === 'function';

    for (const item of data) {
      if (!Array.isArray(item)) continue;

      let [sourceFile, content, media, sourceMap, supports, layer] = item;

      // when in SCSS is used import of CSS file, like `@import url('./style.css');`
      // then `sourceFile` is null and `content` contains the output CSS filename
      if (sourceFile == null && content.endsWith('.css')) {
        source.add(`@import url(${content});`);
        continue;
      }

      if (hasUpdate) {
        content = update(content);
      }

      if (sourceMap) {
        source.add(new SourceMapSource(content, sourceFile, JSON.stringify(sourceMap)));
      } else {
        source.add(content);
      }
    }

    return source;
  }

  /**
   * @param {string} assetFile The asset filename.
   * @returns {string}
   */
  static getInlineSource(assetFile) {
    const sources = this.compilation.assets;
    const assetMapFile = assetFile + '.map';
    const mapFilename = path.basename(assetMapFile);
    const sourceMap = sources[assetMapFile]?.source();
    let source = sources[assetFile].source();

    if (sourceMap) {
      const base64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64');
      const inlineSourceMap = 'data:application/json;charset=utf-8;base64,' + base64;
      source = source.replace(mapFilename, inlineSourceMap);
    }

    // don't generate css file for inlined styles
    AssetTrash.add(assetFile);

    return source;
  }
}

module.exports = CssExtractModule;
