# Inequality
Isaac Equation Editor, Mark II

### Install dependencies
Dependencies are managed by `npm`. Once you cloned the repository, simply do

    cd /path/to/inequality
	npm install

### Run the application
The application is purely client-side, and the files can be served by any plain
HTTP file server, such as

    python -m SimpleHTTPServer 8000

Now browse to Inequality at [localhost:8000](http://localhost:8000/)

### SASS Compilation
This may or may not happen in the future.

## Deployment

The `app` directory contains everything necessary to deploy Inequality. To
create a solid build, run

    node build.js

This creates a `dist` directory from which the application will be loaded in the
browser form now on. If you intend to work on the source code, don't forget to
delete the `dist` directory.

## Testing
There will be some. I promise.

# Status

**[09.02.2016]** Docking sort of works, but in a weird way. It could be a lot
more sophisticated. For example

- Symbols docked on binary operation docking points should really be treated
  as siblings rather than parents-children. This would complicate the design a
  bit but would probably improve the creation of the expression tree.
- Docking on binary operation docking points should enable/disable the
  correspondingly opposite docking points on the two symbols involved in the
  operation. This might improve with a sibling-like design.
- Docking logic currently only examines the position of the mouse/touch when
  dragging ends, thus clicking/tapping on a docked symbol away from a docking
  point undocks the symbol. A more comprehensive hit test (i.e., overlap) might
  be nice.

**[Addendum to 09.02.2016]** Nope, not going to deal with siblings and binary
operation docking points.