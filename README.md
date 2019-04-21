# pug-dep-loader

loader loading dependencies of pug templates, and packaging all pug templates into one.
## Install

```
npm install --save-dev pug-dep-loader
```

## Manageable Dependencies

### pug template

    include ../path/to/index.pug
    extends ../path/to/index.pug
    
    block [blockname]
    block append [blockname]
    block prepend [blockname]
    append [blockname]
    prepend [blockname]

pug inheritance refers to: https://pugjs.org/language/inheritance.html

### attributes

    img(src="../path/to/name.ext")
    img(src='../path/to/name.ext')

as long as you config the pug-dep-loader like this:

```
module.exports = {
  module: {
    rules: [{
      test: /\.pug$/,
      use: {
        loader: 'pug-dep-loader',
        options: {
          attrs: [
            'img:src',
          ],
        },
      },
    }],
  },
};
```

Actually, by default `options.attrs` is [ 'img:src' ]. You can add custom `<tag>:<attribute>` like `img:data-src`, or combination without `<tag>` like `:data-src`.

If you don't need to process any relative path, just pass in `attrs=false`.

## Usage

> **Below configuration is for webpack 4**

```
module.exports = {
  module: {
    rules: [{
      test: /\.pug$/,
      use: {
        loader: 'pug-dep-loader',
        options: {
          attrs: [
            // set your custom combinations
          ],
        },
      },
    }],
  },
};
```

You might be interested in [file-loader](https://www.npmjs.com/package/file-loader), if you are handling image dependencies.

```
module.exports = {
  module: {
    rules: [{
      test: /\.(png|jpg|gif)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:10].[ext]',
          },
        },
      ],
    }],
  },
};
```
