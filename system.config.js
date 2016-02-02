// Configure the SystemJS framework.
// Note that this config is used for on-the-fly compilation in the browser
// and also for building production bundles with build.js

System.config({

  // This section configures the TypeScript compiler.
  transpiler: 'typescript',

  typescriptOptions: {
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "removeComments": false,
    "noImplicitAny": false,
    "moduleResolution": "node",
  },

  // Configure default extensions so we can use old-style imports.
  packages: {
    app: {
      defaultExtension: 'ts'
    },
  },

  // Allow us to refer to some packages with short aliases.
  // Some of these are essential - angular2 often imports 'rxjs/...' for example.
  map: {
    app: 'src/app',
    typescript: 'node_modules/typescript/lib/typescript.js',
    jquery: 'node_modules/jquery/dist/jquery.min.js',
    bootstrap: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
    reflect: 'node_modules/reflect-metadata/Reflect.js',
    phaser: 'node_modules/phaser/dist/phaser.min.js',
    "sketch-js": 'node_modules/sketch-js/js/sketch.min.js',
  },

  // Define any dependencies of legacy libraries, and make sure some are imported globally.
  meta: {
    'typescript': {
      deps: ['reflect'],
    },
    'reflect': {
      format: "global",
    },
    'bootstrap': {
      deps: ['tether', 'jquery'],
    },
    'app/*': {
      deps: ['jquery', 'phaser'],
      format: "es6"
    }
  }
});
