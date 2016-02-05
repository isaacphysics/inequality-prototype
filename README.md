# Inequality
Isaac Equation Editor, Mark II

### Install dependencies
Dependencies are managed by `npm`. Once you cloned the repository, simply do

    cd /path/to/inequality
	npm install

### Run the application
The application is purely client-side, and the files can be served by any plain HTTP file server, such as

    python -m SimpleHTTPServer 8000

Now browse to Inequality at [localhost:8000](http://localhost:8000/)

### SASS Compilation
This may or may not happen in the future.

## Deployment

The `app` directory contains everything necessary to deploy Inequality. To create a solid build, run

    node build.js

This creates a `dist` directory from which the application will be loaded in the browser form now on. If you intend to work on the source code, don't forget ti delete the `dist` directory.

## Testing
There will be some. I promise.