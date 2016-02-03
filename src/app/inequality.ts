///// <reference path="../../Typings/p5.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

module Inequality {
    'use strict';

    class Symbol {
        private s: any;

        position: p5.Vector;

        black: boolean;

        constructor(s: any) {
            this.s = s;

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

    export var sketch = function (s: any): void {

        var symbols: Array<Symbol>;

        s.setup = () => {
            symbols = []
            s.createCanvas(800, 600);
            for(var i = 0; i < 12; ++i) {
                var symbol = new Symbol(s);
                symbol.position.x = 100 + 100*(i%4);
                symbol.position.y = 100 + 100*(Math.floor(i/4));
                symbols.push(symbol);
            }
            s.background(255);
        };

        s.draw = () => {
            s.clear();
            symbols.forEach(symbol => {
                symbol.display();
            });
        };

        s.touchStarted = () => {
            symbols.forEach(symbol => {
                if(p5.Vector.dist(symbol.position, s.createVector(s.touchX, s.touchY)) < 25) {
                    symbol.black = true;
                } else {
                    symbol.black = false;
                }
            });
        };

        s.touchEnded = () => {
            symbols.forEach(symbol => {
                symbol.black = false;
            });
        }
    };

}

var myp5 = new p5(Inequality.sketch);
