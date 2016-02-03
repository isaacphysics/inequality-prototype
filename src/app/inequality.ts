///// <reference path="../../Typings/p5.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

module Inequality {
    'use strict';

    class Symbol {
        private s: any;

        private x: number;
        private y: number;

        constructor(s: any) {
            this.s = s;

            this.x = this.s.width / 2;
            this.y = this.s.height / 2;
        }

        display(): void {
            this.s.stroke(0);
            this.s.point(this.x, this.y);
        }

        step(): void {
            var stepx: number = this.s.random(-1, 1);
            var stepy: number = this.s.random(-1, 1);
            this.x += stepx;
            this.y += stepy;

            this.x = this.s.constrain(this.x, 0, this.s.width - 1);
            this.y = this.s.constrain(this.y, 0, this.s.height - 1);
        }
    }

    export var sketch = function (s: any): void {

        var symbols: Array<Symbol>;

        s.setup = () => {
            symbols = []
            s.createCanvas(640, 360);
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            symbols.push(new Symbol(s));
            s.background(255);
        };

        s.draw = () => {
            symbols.forEach(symbol => {
                symbol.step();
                symbol.display();
            });
        };
    };

}

var myp5 = new p5(Inequality.sketch);
