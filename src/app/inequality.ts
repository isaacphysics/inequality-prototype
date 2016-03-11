/*
Copyright 2016 Andrea Franceschini <andrea.franceschini@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


///// <reference path="../../Typings/p5.d.ts" />
///// <reference path="../../Typings/underscore.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './widget.ts'
import { Symbol } from './symbol.ts'

// This is where the fun starts


// This is the "main" app with the update/render loop and all that jazz.
export
class MySketch {
	symbols: Array<Widget>;
	movingSymbol: Widget = null;
	prevTouch: p5.Vector = null;

	xBox: Rect = null;
	mBox: Rect = null;

	baseFontSize = 120;
	font: p5.Font = null;

	constructor(private p) {
		this.p.preload = this.preload;
		this.p.setup = this.setup;
		this.p.draw = this.draw;
		this.p.touchStarted = this.touchStarted;
		this.p.touchMoved = this.touchMoved;
		this.p.touchEnded = this.touchEnded;
	}

	preload = () => {
		this.font = this.p.loadFont("/assets/STIXGeneralItalic.otf");
	};

	setup = () => {
		this.xBox = this.font.textBounds("x", 0, 1000, this.baseFontSize);
		this.mBox = this.font.textBounds("M", 0, 1000, this.baseFontSize);

		this.symbols = [];
		this.p.createCanvas(800, 600);

		this.symbols = _.map([[100, 400, "M"], [300, 200, "x"], [500, 150, "i"], [700, 250, "j"]], (p) => {
			var s = new Symbol(this.p, this, p[2]);
			s.position = this.p.createVector(p[0], p[1]);
			return s;
		});

		this.prevTouch = this.p.createVector(0,0);
	};

	draw = () => {
		this.p.background(255);
		_.each(this.symbols, symbol => {
			symbol.draw();
		});
	};

	// Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
	// Native ptouchX and ptouchY are not accurate because they are based on the "previous frame".
	touchStarted = () => {
		this.movingSymbol = null;
		var index = -1;
		var movingSymbolDocksTo: Array<string> = [];
		_.some(this.symbols, (symbol, i) => {
			// .hit() propagates down the hierarchy
			var hitSymbol = symbol.hit(this.p.createVector(this.p.touchX, this.p.touchY));
			if(hitSymbol != null) {
				// If we hit that symbol, then mark it as moving
				this.movingSymbol = hitSymbol;
				index = i;
				this.prevTouch = this.p.createVector(this.p.touchX, this.p.touchY);

				// Remove symbol from the hierarchy, place it back with the roots.
				if(hitSymbol.parentWidget != null) {
					this.symbols.push(hitSymbol);
					hitSymbol.scale = 1.0;
					hitSymbol.removeFromParent();
				}

				// Get the points it docks to, we'll use them later
				movingSymbolDocksTo = this.movingSymbol.docksTo;

				// Array.some requires this to break out of the loop.
				return true;
			}
		});

		// Put the moving symbol on top (bottom?) of the list (this only works with roots,
		// and may not be necessary at all, but eye candy, right?)
		if(index > -1) {
			var e = this.symbols.splice(index, 1)[0];
			this.symbols.push(e);
			index = -1;
		}

		// Tell the other symbols to show only these points. Achievement unlocked: Usability!
		_.each(this.symbols, symbol => {
			symbol.setDockingPointsToDraw(movingSymbolDocksTo);
		});
	};

	touchMoved = () => {
		if(this.movingSymbol != null) {
			var d = this.p.createVector(this.p.touchX - this.prevTouch.x, this.p.touchY - this.prevTouch.y);
			this.movingSymbol.moveBy(d);
			this.prevTouch.x = this.p.touchX;
			this.prevTouch.y = this.p.touchY;

			// Check if we are moving close to a docking point, and highlight it even more.
			_.each(_.flatten(_.map(this.symbols, symbol => {
				return symbol.getAllChildren();
			})), (symbol: Widget) => {
				symbol.highlightDockingPoint = -1;
				// This is the point where the mouse/touch is.
				var touchPoint = this.p.createVector(this.p.touchX, this.p.touchY);
				// Let's find a symbol that is close enough for us to be close to its docking points
				var hitSymbol = symbol.externalHit(touchPoint);
				if(hitSymbol != null && hitSymbol.id != this.movingSymbol.id) {
					// If we found a viable candidate, let's see if we hit any of its docking points
					hitSymbol.dockingPointsHit(touchPoint);
				}
			});
		}
	};

	touchEnded = () => {
		if(this.movingSymbol != null) {
			// When touches end, mark the symbol as not moving.
			var formerlyMovingSymbol = this.movingSymbol;
			this.movingSymbol = null;
			this.prevTouch = null;

			var shouldRemoveFromRoots = false;

			// I don't like having to do this again, but hey...
			_.each(_.flatten(_.map(this.symbols, symbol => {
				return symbol.getAllChildren();
			})), (symbol: Widget) => {
				// This is the point where the mouse/touch is.
				var hitPoint = this.p.createVector(this.p.touchX, this.p.touchY);
				// Let's find a symbol that is close enough for us to be close to its docking points
				var hitSymbol = symbol.externalHit(hitPoint);
				if(hitSymbol != null && hitSymbol.id != formerlyMovingSymbol.id) {
					var index = hitSymbol.dockingPointsHit(hitPoint);
					if(index > -1) {
						// Clear highlighted docking points
						hitSymbol.highlightDockingPoint = -1;
						// Actually dock the symbol
						hitSymbol.setChild(index, formerlyMovingSymbol);
						// Finally, this symbol was among the roots while moving, so if we docked it somewhere,
						// let's remove it from the roots.
						shouldRemoveFromRoots = true;
						//return true;
					}
				}
			});

			// Doing the remove-from-roots thing here to avoid messing up the array of roots.
			if(shouldRemoveFromRoots) {
				this.symbols = _.reject(this.symbols, (e) => {
					return e.id == formerlyMovingSymbol.id;
				});
			}

			// Reset rendering of docking points
			_.each(this.symbols, symbol => {
				symbol.clearDockingPointsToDraw();
			});
		}
		_.each(this.symbols, symbol => {
			console.log(symbol.id + " -> " + symbol.getExpression("latex"));
		});
	};
}

var p = new p5( (p) => new MySketch(p) );
