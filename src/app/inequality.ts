///// <reference path="../../Typings/p5.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

// This is meant to be a static global thingie for uniquely identifying widgets/symbols
// This may very well be a relic of my C++ multi-threaded past, but it served me well so far...
export var wId = 0;

// This is where the fun starts
module Inequality {
    'use strict';

    class Symbol {
        private s: any;

        id: number;
        position: p5.Vector;

        black: bool;

        constructor(s: any) {
            // Take a new unique id for this symbol
            this.id = ++wId;
            // This is weird but necessary: this.s will be the sketch function
            this.s = s;
            // Default position is [0, 0]
            this.position = s.createVector(0, 0);
        }

        display(): void {
            this.s.stroke(0);
            if(this.black) {
                this.s.fill(0);
            } else {
                this.s.fill(255);
            }
            this.s.ellipse(this.position.x, this.position.y, 50, 50);
        }
    }

    // This is the "main" app with the update/render loop and all that jazz.
    export var sketch = function (s: any): void {

        var symbols: Array<Symbol>;
        var movingSymbol: Symbol = null;

        s.setup = () => {
            symbols = []
            s.createCanvas(800, 600);
            for(var i = 0; i < 12; ++i) {
                var symbol = new Symbol(s);
                symbol.position.x = 100 + 100*(i%4);
                symbol.position.y = 100 + 100*(Math.floor(i/4));
                symbols.push(symbol);
            }
        };

        s.draw = () => {
            s.background(255*0.95);
            symbols.forEach(symbol => {
                symbol.display();
            });
        };

        // Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
        // The geometry is not super accurate, might be worth investigating if mouse info comes through on touches as well.
        s.touchStarted = () => {
            symbols.forEach(symbol => {
                if(p5.Vector.dist(symbol.position, s.createVector(s.touchX, s.touchY)) < 25) {
                    // If we hit that symbol, then mark it as moving
                    movingSymbol = symbol;
                }
            });
        };

        s.touchMoved = () => {
            if(movingSymbol != null) {
                var d = s.createVector(s.touchX - s.ptouchX, s.touchY - s.ptouchY);
                console.log(d);
                movingSymbol.position.add(d.div(2));
            }
        }

        s.touchEnded = () => {
            // When touches end, unmark the symbol as moving.
            movingSymbol = null;
        }
    };

}

var myp5 = new p5(Inequality.sketch);
myp5.resizeCanvas($('body').width(), $('body').height());
