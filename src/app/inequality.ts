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

        children: Array<Widget> = [];

        constructor(p: any, private s: any) {
            // Take a new unique id for this symbol
            this.id = ++wId;
            // This is weird but necessary: this.s will be the sketch function
            this.p = p;
            // Default position is [0, 0]
            this.position = p.createVector(0, 0);

            this.dockingPoints = iRange(0, 7).map( n => {
                return p.createVector(Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI)).mult(40);
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
            this.children.forEach( (child, index) => {
                if(child == null) {
                    // There is no child to paint, let's paint an empty docking point
                    var point = this.dockingPoints[index];
                    this.p.stroke(0, 127, 255, alpha * 0.5);
                    this.p.noFill();
                    this.p.ellipse(this.position.x + scale*point.x, this.position.y + scale*point.y, scale*20, scale*20);
                } else {
                    // There is a child, so let's just draw it...
                    child.display(this.dockingPointScales[index]);
                }
            });

            this.p.stroke(0, 63, 127, alpha);
            this.p.fill(255, 255, 255, alpha);
            this.p.ellipse(this.position.x, this.position.y, scale*2*this.radius, scale*2*this.radius);
        }

        hit(p: p5.Vector): Widget {
            var w = null;
			// TODO Check whether some or anything else is OK, but this works for now.
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
                return p.createVector(Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI)).mult(80);
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
            b.position.x = this.p.width/2 + 300;
            b.position.y = this.p.height/2;
            a.children[1] = b;

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
            this.symbols.some((symbol, i) => {
                var hitSymbol = symbol.hit(this.p.createVector(this.p.touchX, this.p.touchY));
                if(hitSymbol != null) {
                    // If we hit that symbol, then mark it as moving
                    this.movingSymbol = hitSymbol;
                    index = i;
                    this.ptouch = this.p.createVector(this.p.touchX, this.p.touchY);
					
					// Array.some requires this to break out of the loop.
					return true;
                }
            });
            if(index > -1) {
                var e = this.symbols.splice(index, 1)[0];
                this.symbols.push(e);
                index = -1;
            }
        };

        touchMoved = () => {
            if(this.movingSymbol != null) {
                var d = this.p.createVector(this.p.touchX - this.ptouch.x, this.p.touchY - this.ptouch.y);
                this.movingSymbol.moveBy(d);
                this.ptouch.x = this.p.touchX;
                this.ptouch.y = this.p.touchY;
            }
        }

        touchEnded = () => {
            // When touches end, unmark the symbol as moving.
            this.movingSymbol = null;
            this.ptouch = null;
        }
    }
}

var p = new p5( (p) => new Inequality.MySketch(p) );
p.resizeCanvas($('body').width(), $('body').height());
