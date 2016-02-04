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

    class Symbol {
        private s: any;

        id: number = -1;
        position: p5.Vector;
        isMoving: boolean = false;

        dockingPoints: Array<p5.Vector> = [];

        constructor(s: any) {
            // Take a new unique id for this symbol
            this.id = ++wId;
            // This is weird but necessary: this.s will be the sketch function
            this.s = s;
            // Default position is [0, 0]
            this.position = s.createVector(0, 0);

            this.dockingPoints = iRange(0, 7).map((n) => {
                return s.createVector(Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI));
            });
        }

        display = () => {
            var alpha = 255;
            if(this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
                alpha = 127;
            }
            this.s.stroke(0,0,0,alpha);
            this.s.fill(255,255,255,alpha);
            this.s.ellipse(this.position.x, this.position.y, 50, 50);

            this.dockingPoints.forEach(point => {
                this.s.fill(255,0,0,alpha);
                this.s.noStroke();
                this.s.ellipse(this.position.x + 30*point.x, this.position.y + 30*point.y, 10, 10);
            });
        }
    }

    export class MySketch {
        symbols: Array<Symbol>;
        movingSymbol = null;
        ptouch: p5.Vector = null;
        myp5 = null;

        constructor(myp5) {
            this.myp5 = myp5;
            debugger;
        }

        setup = () => {
            this.symbols = []
            this.myp5.createCanvas(800, 600);
            for(var i = 0; i < 12; ++i) {
                var symbol = new Symbol(s);
                symbol.position.x = 100 + 100*(i%4);
                symbol.position.y = 100 + 100*(Math.floor(i/4));
                this.symbols.push(symbol);
            }
            this.ptouch = this.myp5.createVector(0,0);
        };

        draw = () => {
            this.myp5.background(255*0.95);
            this.symbols.forEach(symbol => {
                symbol.display();
            });
        };
    }

    // This is the "main" app with the update/render loop and all that jazz.
    export var sketch = function (s: any): void {

        var symbols: Array<Symbol>;
        s.movingSymbol = null;

        var ptouch: p5.Vector = null;

        s.setup = () => {
            symbols = []
            s.createCanvas(800, 600);
            for(var i = 0; i < 12; ++i) {
                var symbol = new Symbol(s);
                symbol.position.x = 100 + 100*(i%4);
                symbol.position.y = 100 + 100*(Math.floor(i/4));
                symbols.push(symbol);
            }
            ptouch = s.createVector(0,0);
        };

        s.draw = () => {
            s.background(255*0.95);
            symbols.forEach(symbol => {
                symbol.display();
            });
        };

        // Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
        // Native ptouchX and ptouchY are not accurate because they are based on the "previous frame".
        s.touchStarted = () => {
            symbols.forEach(symbol => {
                if(p5.Vector.dist(symbol.position, s.createVector(s.touchX, s.touchY)) < 25) {
                    // If we hit that symbol, then mark it as moving
                    s.movingSymbol = symbol;
                    // movingSymbol.isMoving = true;
                    ptouch = s.createVector(s.touchX, s.touchY);
                    return;
                }
            });
        };

        s.touchMoved = () => {
            if(s.movingSymbol != null) {
                var d = s.createVector(s.touchX - ptouch.x, s.touchY - ptouch.y);
                s.movingSymbol.position.add(d);
                ptouch.x = s.touchX;
                ptouch.y = s.touchY;
            }
        }

        s.touchEnded = () => {
            // When touches end, unmark the symbol as moving.
            s.movingSymbol = null;
            ptouch = null;
            // symbols.forEach(symbol => {
            //     symbol.isMoving = false;
            // });
        }
    };
}

var myp5 = new p5( (p) => new Inequality.MySketch(p) );
myp5.resizeCanvas($('body').width(), $('body').height());
