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

import { iRange, saneRound } from './utils.ts'
import { Widget } from './widget.ts'
import { Symbol } from './symbol.ts'

// This is where the fun starts


// This is the "main" app with the update/render loop and all that jazz.
export
class MySketch {
	symbols: Array<Widget>;
	movingSymbol: Widget = null;
	ptouch: p5.Vector = null;

	constructor(private p) {
		this.p.setup = this.setup;
		this.p.draw = this.draw;
		this.p.touchStarted = this.touchStarted;
		this.p.touchMoved = this.touchMoved;
		this.p.touchEnded = this.touchEnded;
	}

	setup = () => {
		this.symbols = [];
		this.p.createCanvas(800, 600);
		var a = new Symbol(this.p, this);
		a.position.x = this.p.width/2;
		a.position.y = this.p.height/2;
		this.symbols.push(a);
		var b = new Symbol(this.p, this);
		b.position.x = a.dockingPoints[1].x + a.position.x;
		b.position.y = a.dockingPoints[1].y + a.position.y;
		a.setChild(1, b);
		var c = new Symbol(this.p, this);
		c.position.x = b.dockingPoints[1].x + b.position.x;
		c.position.y = b.dockingPoints[1].y + b.position.y;
		b.setChild(1, c);

		var tree = a.getSubtree();

		this.ptouch = this.p.createVector(0,0);
	};

	draw = () => {
		this.p.background(255);
		this.symbols.forEach(symbol => {
			symbol.display(1.0);
		});
	};

	// Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
	// Native ptouchX and ptouchY are not accurate because they are based on the "previous frame".
	touchStarted = () => {
		this.movingSymbol = null;
		var index = -1;
		var movingSymbolDocksTo: Array<string> = [];
		this.symbols.some( (symbol, i) => {
			var hitSymbol = symbol.hit(this.p.createVector(this.p.touchX, this.p.touchY));
			if(hitSymbol != null) {
				// If we hit that symbol, then mark it as moving
				this.movingSymbol = hitSymbol;
				index = i;
				this.ptouch = this.p.createVector(this.p.touchX, this.p.touchY);

				// Remove symbol from the hierarchy, place it back with the roots.
				if(hitSymbol.parentWidget != null) {
					this.symbols.push(hitSymbol);
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
		
		// TODO Tell the other symbols to show only these points. Achievement unlocked: Usability!
		this.symbols.forEach( (symbol) => {
			symbol.setDockingPointsToDraw(movingSymbolDocksTo);
		});
	};

	touchMoved = () => {
		if(this.movingSymbol != null) {
			var d = this.p.createVector(this.p.touchX - this.ptouch.x, this.p.touchY - this.ptouch.y);
			this.movingSymbol.moveBy(d);
			this.ptouch.x = this.p.touchX;
			this.ptouch.y = this.p.touchY;
			
			// Check if we are moving close to a docking point, and highlight it even more.
			this.symbols.some( (symbol) => {
				// FIXME This is truly awful.
				symbol.highlightDockingPoint = -1;
				// This is the point where the mouse/touch is.
				var hitPoint = this.p.createVector(this.p.touchX, this.p.touchY);
				// Let's find a symbol that is close enough for us to be close to its docking points
				var hitSymbol = symbol.externalHit(hitPoint);
				if(hitSymbol != null && hitSymbol.id != this.movingSymbol.id) {
					// If we found a viable candidate, let's get its docking points and see if we're over any of them
					var dockingPoints = hitSymbol.dockingPoints;
					dockingPoints.some( (point, j) => {
						var dp = p5.Vector.add(point, hitSymbol.position);
						if(p5.Vector.dist(dp, hitPoint) < 10) {
							// If we are, let's highlight it!
							hitSymbol.highlightDockingPoint = j;
							return true;
						}
					});
					return true;
				}
			});
		}
	};

	touchEnded = () => {
		if(this.movingSymbol != null) {
			// When touches end, unmark the symbol as moving.
			var formerlyMovingSymbol = this.movingSymbol;
			this.movingSymbol = null;
			this.ptouch = null;
		
			var shouldRemoveFromRoots = false;
		
			// I don't like having to do this again, but hey...
			this.symbols.some( (symbol) => {
				// This is the point where the mouse/touch is.
				var hitPoint = this.p.createVector(this.p.touchX, this.p.touchY);
				// Let's find a symbol that is close enough for us to be close to its docking points
				var hitSymbol = symbol.externalHit(hitPoint);
				if(hitSymbol != null && hitSymbol.id != formerlyMovingSymbol.id) {
					// If we found a viable candidate, let's get its docking points and see if we dropped on top of any of them
					var dockingPoints = hitSymbol.dockingPoints;
					dockingPoints.some( (point, j) => {
						var dp = p5.Vector.add(point, hitSymbol.position);
						if(p5.Vector.dist(dp, hitPoint) < 10) {
							// Reasonably assuming that the hitSymbol is the one with the dirty highlighter, so let's clear it
							hitSymbol.highlightDockingPoint = -1;
							// Actually dock the moving symbol that we just dropped
							hitSymbol.setChild(j, formerlyMovingSymbol);
							// Some animation would be nice here...
							formerlyMovingSymbol.position = dp;
							// The symbol we've been moving had been put with the roots, so if we did dock it,
							// we might also want to remove it from the roots, as it's not a root anymore.
							shouldRemoveFromRoots = true;
							return true;
						}
					});
					return true;
				}
			});

			// Doing the remove-from-roots thing here to avoid messing up the array of roots.
			if(shouldRemoveFromRoots) {
				this.symbols = this.symbols.filter( (e) => {
					return e.id != formerlyMovingSymbol.id;
				});
			}
			
			// Reset rendering of docking points
			this.symbols.forEach( (symbol) => {
				symbol.clearDockingPointsToDraw();
			});
		}
	};
}

var p = new p5( (p) => new MySketch(p) );
var docBody = $('body');
p.resizeCanvas(docBody.width(), docBody.height());
