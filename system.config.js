// Configure the SystemJS framework.
// Note that this config is used for on-the-fly compilation in the browser
// and also for building production bundles with build.js



System.config({

	// Configure default extensions so we can use old-style imports.
	packages: {
		app: {
			defaultExtension: 'coffee'
		},
	},

	// Allow us to refer to some packages with short aliases.
	// Some of these are essential - angular2 often imports 'rxjs/...' for example.
	map: {
		'system-coffee-script': 'node_modules/system-coffee/coffee-script.js',
		app: 'src/app',
		jquery: 'node_modules/jquery/dist/jquery.min.js',
		bootstrap: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
		p5: 'node_modules/p5/lib/p5.min.js'
	},

	// Define any dependencies of legacy libraries, and make sure some are imported globally.
	meta: {
		'p5': {
			format: 'global'
		},
		'bootstrap': {
			deps: ['tether', 'jquery'],
		},
		'app/*': {
			deps: ['jquery', 'p5'],
			loader: 'coffee-loader.js'
		}
	}
});
