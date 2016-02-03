var path = require("path");
var Builder = require('systemjs-builder');

// Bundle just our app into a single file, app.js. Do not include dependencies.
var src = '[./src/**/*.ts]';
var dest = './dist/js/app.js';
var opts = {
  minify: true,
  sourceMaps: true
};

// optional constructor options
// sets the baseURL and loads the configuration file
var builder = new Builder('.', 'system.config.js');

builder
.bundle(src, dest, opts)
.then(function() {
  console.log('Build complete');
})
.catch(function(err) {
  console.log('Build error');
  console.error(err);
});
