/// <reference path="../../node_modules/phaser/typescript/phaser.d.ts"/>
/// <reference path="../../typings/jquery.d.ts"/>

var MyRange = function(from: number, to: number, includeLast: boolean = true) {
    var a = [];
    var j: number = includeLast ? to+1 : to;
    for(var i = from; i < j; ++i) {
        a.push(i);
    }
    return a;
}

var saneRound = function(n: number, dp: number = 0) {
    return
}

class Symbol {
    graphicsObject: Phaser.Graphics;
    dockingPoints: Array<any>;

    constructor(game: Phaser.Game, x: number, y: number, symbol: string = "e") {
        this.graphicsObject = game.add.graphics(x, y);
        this.graphicsObject.beginFill(0xff0000, 1);
        //this.graphicsObject.anchor = new Phaser.Point(0.5, 0.5);
        this.graphicsObject.drawCircle(0, 0, 50);
        //this.graphicsObject.undefProp = symbol;
        this.graphicsObject.inputEnabled = true;
        this.graphicsObject.input.enableDrag(true);

        var coords = MyRange(0, 7).map(function(n) {
            return [Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI)];
        });

        this.dockingPoints = coords.map(function(n) {
            return n.map(function(m) {
                return Math.round(100*m*50)/100;
            });
        });
    }
}

class Inequality {

    game: Phaser.Game;
    points: Array<any>;

    constructor() {
        this.game = new Phaser.Game(750, 600, Phaser.AUTO, 'content', { create: this.create, update: this.update });
        this.points = [];
    }

    create = () => {
        for(var i = 0; i < 12; ++i) {
            var circle = new Symbol(this.game, 150 + 150*(i%4), 150 + 150*(Math.floor(i/4)), "f");
            this.points.push(circle.graphicsObject);
        }
    }

    update = () => {
        for(var i = 0; i < 12; ++i) {
            this.points[i].x += 2*(Math.random()-0.5);
            this.points[i].y += 2*(Math.random()-0.5);
        }
    }
}

var inequality = new Inequality();
