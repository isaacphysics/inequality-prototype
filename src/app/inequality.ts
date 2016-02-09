///// <reference path="../../Typings/p5.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

///////// UTILS.TS

function iRange(from: number, to: number, includeLast: boolean = true) {
    var a = [];
    var j: number = includeLast ? to+1 : to;
    return Array.apply(null, Array(j - from)).map(function(_, i) { return i; });
}

function saneRound(n: number, dp: number = 0) {
    var p = Math.pow(10, dp);
    return Math.round(n * p) / p;
}

//////// THEREST.TS

// This is meant to be a static global thingie for uniquely identifying widgets/symbols
// This may very well be a relic of my C++ multi-threaded past, but it served me well so far...
export var wId = 0;

// This is where the fun starts
module Inequality {
    'use strict';

    class Widget {
        private p: any;
        private radius = 50;

        id: number = -1;
        position: p5.Vector;
        isMoving: boolean = false;

        dockingPoints: Array<p5.Vector> = [];
        dockingPointScales: Array<number> = [];
        dockingPointTypes: Array<string> = [];
        docksTo: Array<string> = [];
		highlightDockingPoint: number = -1;

        children: Array<Widget> = [];
		parentWidget: Widget = null;

        constructor(p: any, private s: any) {
            // Take a new unique id for this symbol
            this.id = ++wId;
            // This is weird but necessary: this.p will be the sketch function
            this.p = p;
            // Default position is [0, 0]
            this.position = p.createVector(0, 0);

            this.dockingPoints = iRange(0, 7).map( n => {
				// Yes, there is a minus sign over there, because the y-axis is flipped.
				// Thank you, analog TV.
				// FIXME 80 is hardcoded (look further down too!)
                return p.createVector(Math.cos( (n/8) * 2*Math.PI), -Math.sin( (n/8) * 2*Math.PI)).mult(80);
            });
            this.dockingPointScales = iRange(0,7).map( n => {
                return 1.0;
            });
            this.dockingPointTypes = iRange(0,7).map( n => {
                return null;
            });
            this.docksTo = [];
            this.children = iRange(0,7).map( n => {
                return null;
            });
        }

        display(scale: number) {
            var alpha = 255;
            if(this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
                alpha = 127;
            }
			
			// This has to be done twice
			this.children.forEach( (child, index) => {
				if(child == null) {
	                // There is no child to paint, let's paint an empty docking point
	                var point = this.dockingPoints[index];
	                this.p.stroke(0, 127, 255, alpha * 0.5);
					if(index == this.highlightDockingPoint) {
						this.p.fill(0);
					} else {
						this.p.noFill();
					}
	                this.p.ellipse(this.position.x + scale*point.x, this.position.y + scale*point.y, scale*20, scale*20);
				}
			});
			// Curses, you painter's algorithm!
            this.children.forEach( (child, index) => {
                if(child != null) {
                    // There is a child, so let's just draw it...
                    child.display(this.dockingPointScales[index]);
                }
            });

            this.p.stroke(0, 63, 127, alpha);
            this.p.fill(255, 255, 255, alpha);
            this.p.ellipse(this.position.x, this.position.y, scale*2*this.radius, scale*2*this.radius);
        }
		
		setChild(dockingPointIndex: number, child: Widget) {
			this.children[dockingPointIndex] = child;
			child.parentWidget = this;
		}
		
		removeFromParent() {
			this.parentWidget.removeChild(this);
			this.parentWidget = null;
		}
		
		removeChild(child: Widget) {
			this.children = this.children.map( (e: Widget) => {
				if(e != null && child.id == e.id) {
					return null;
				} else {
					return e;
				}
			});
		}

        hit(p: p5.Vector): Widget {
            var w = null;
            this.children.some( child => {
                if(child != null) {
                    w = child.hit(p);
                    if(w != null) {
                        return true;
                    }
                }
            });
            if(w != null) {
                return w;
            }
            if(p5.Vector.dist(p, this.position) < this.radius) {
                return this;
            }
            return null;
        }
		
		externalHit(p: p5.Vector): Widget {
            var w = null;
            this.children.some( child => {
                if(child != null) {
                    w = child.hit(p);
                    if(w != null) {
                        return true;
                    }
                }
            });
            if(w != null) {
                return w;
            }
			// FIXME 80 is hardcoded
            if(p5.Vector.dist(p, this.position) < (this.radius + 80/2)) {
                return this;
            }
            return null;
		}

        moveBy(d: p5.Vector) {
            this.position.add(d);
            this.children.forEach( child => {
                if(child != null) {
                    child.moveBy(d);
                }
            });
        }
    }

    // Symbol may not be the best name, after all.
    class Symbol extends Widget {
        constructor(p: any, private s: any) {
            super(p, s);

            this.dockingPoints = [0, 1, 4, 7].map((n) => {
				// Mind the minus sign.
				// FIXME 80 is hardcoded
				var v = p.createVector(Math.cos( (n/8) * 2*Math.PI), -Math.sin( (n/8) * 2*Math.PI)).mult(80);
                return v;
            });
            this.dockingPointScales = [1.0, 0.6, 1.0, 0.6];
            this.dockingPointTypes = ['operator', 'exponent', 'operator', 'subscript'];
            this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
            this.children = [null, null, null, null];
        }

        display(scale: number = 1.0) {
            super.display(scale);
        }
    }

    // This is the "main" app with the update/render loop and all that jazz.
    export class MySketch {
        symbols: Array<Widget>;
        movingSymbol = null;
        ptouch: p5.Vector = null;

        constructor(private p) {
            this.p.setup = this.setup;
            this.p.draw = this.draw;
            this.p.touchStarted = this.touchStarted;
            this.p.touchMoved = this.touchMoved;
            this.p.touchEnded = this.touchEnded;
        }

        setup = () => {
            this.symbols = []
            this.p.createCanvas(800, 600);
            var a = new Symbol(this.p, this);
            a.position.x = this.p.width/2;
            a.position.y = this.p.height/2;
            this.symbols.push(a);
            var b = new Symbol(this.p, this);
            b.position.x = a.dockingPoints[1].x + a.position.x;
            b.position.y = a.dockingPoints[1].y + a.position.y;
			a.setChild(1, b);

            this.ptouch = this.p.createVector(0,0);
        };

        draw = () => {
            this.p.background(255);
            this.symbols.forEach(symbol => {
                symbol.display();
            });
        };

        // Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
        // Native ptouchX and ptouchY are not accurate because they are based on the "previous frame".
        touchStarted = () => {
            this.movingSymbol = null;
            var index = -1;
			var movingSymbolDocksTo: Array<string> = [];
            this.symbols.some((symbol, i) => {
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
        };

        touchMoved = () => {
            if(this.movingSymbol != null) {
                var d = this.p.createVector(this.p.touchX - this.ptouch.x, this.p.touchY - this.ptouch.y);
                this.movingSymbol.moveBy(d);
                this.ptouch.x = this.p.touchX;
                this.ptouch.y = this.p.touchY;
				
				// Check if we are moving close to a docking point, and highlight it even more.
	            this.symbols.some( (symbol, i) => {
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
							if(dp.dist(hitPoint) < 10) {
								// If we are, let's highlight it!
								hitSymbol.highlightDockingPoint = j;
								return true;
							}
						});
						return true;
					}
				}
            }
        }

        touchEnded = () => {
			if(this.movingSymbol != null) {
	            // When touches end, unmark the symbol as moving.
				var formerlyMovingSymbol = this.movingSymbol;
	            this.movingSymbol = null;
	            this.ptouch = null;
			
				var shouldRemoveFromRoots = false;
			
				// I don't like having to do this again, but hey...
	            this.symbols.some( (symbol, i) => {
					// This is the point where the mouse/touch is.
					var hitPoint = this.p.createVector(this.p.touchX, this.p.touchY);
					// Let's find a symbol that is close enough for us to be close to its docking points
	                var hitSymbol = symbol.externalHit(hitPoint);
	                if(hitSymbol != null && hitSymbol.id != formerlyMovingSymbol.id) {
						// If we found a viable candidate, let's get its docking points and see if we dropped on top of any of them
						var dockingPoints = hitSymbol.dockingPoints;
						dockingPoints.some( (point, j) => {
							var dp = p5.Vector.add(point, hitSymbol.position);
							if(dp.dist(hitPoint) < 10) {
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
				}
				// Doing the remove-from-roots thing here to avoid messing up the array of roots.
				if(shouldRemoveFromRoots) {
					this.symbols = this.symbols.filter( (e) => {
						return e.id != formerlyMovingSymbol.id;
					});
				}
	        }
		}
    }
}

var p = new p5( (p) => new Inequality.MySketch(p) );
p.resizeCanvas($('body').width(), $('body').height());
