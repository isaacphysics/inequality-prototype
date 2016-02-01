Range = function(from: number, to: number, includeLast: boolean = true) {
    var a = [];
    var j: number = includeLast ? to+1 : to;
    for(var i = from; i < j; ++i) {
        a.push(i);
    }
    return a;
}

saneRound = function(n: number, dp: number = 0) {
    return
}

class Symbol {
    graphicsObject: Phaser.Graphics;
    dockingPoints: Array;

    constructor(game: Phaser.Game, x: number, y: number, symbol: string = "e") {
        graphicsObject = game.add.graphics(x, y);
        graphicsObject.beginFill(0xff0000, 1);
        graphicsObject.anchor = new Phaser.Point(0.5, 0.5);
        graphicsObject.drawCircle(0, 0, 50);
        graphicsObject.undefProp = symbol;
        graphicsObject.inputEnabled = true;
        graphicsObject.input.enableDrag(true);

        var coords = Range(0, 7).map(function(n) {
            return [Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI)];
        });

        dockingPoints = coords.map(function(n) {
            return n.map(function(m) {
                return Math.round(100*m*50)/100;
            });
        });
    }
}

class Inequality {

    game: Phaser.Game;
    points: Array;

    constructor() {
        this.game = new Phaser.Game(750, 600, Phaser.AUTO, 'content', { create: this.create, update: this.update });
    }

    create() {
        this.points = [];
        for(var i = 0; i < 12; ++i) {
            var circle = new Symbol(this.game, 150 + 150*(i%4), 150 + 150*(Math.floor(i/4)), "f");
            this.points.push(circle.graphicsObject);
        }
    }

    update() {
        /*
        for(var i = 0; i < 12; ++i) {
            this.points[i].x += 2*(Math.random()-0.5);
            this.points[i].y += 2*(Math.random()-0.5);
        }
        */
    }
}

var inequality = new Inequality();
