


/// <reference path="../../node_modules/phaser/typescript/phaser.d.ts"/>
/// <reference path="../../typings/jquery.d.ts"/>

///////// UTILS.TS

function integerRange(from: number, to: number, includeLast: boolean = true) {
    var a = [];
    var j: number = includeLast ? to+1 : to;
    return Array.apply(null, Array(j - from)).map(function(_, i) { return i; });
}

function saneRound(n: number, dp: number = 0) {
    var p = Math.pow(10, dp);
    return Math.round(n * p) / p;
}

//////// LITEEVENT.TS -- http://stackoverflow.com/questions/12881212/does-typescript-support-events-on-classes

interface ILiteEvent<T> {
    on(handler: { (data?: T): void });
    off(handler: { (data?: T): void });
}

class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }) {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach(h => h(data));
    }
}

//////// SYMBOL.TS

interface ISymbol {

}

class Symbol implements ISymbol {
    graphicsObject: Phaser.Graphics;
    dockingPoints: Array<any>;

    private draggingEvent = new LiteEvent<Symbol>();

    public get dragging(): ILiteEvent<Symbol> { return this.draggingEvent; }

    constructor(game: Phaser.Game, x: number, y: number, symbol: string = "e") {
        this.graphicsObject = game.add.graphics(x, y);
        this.graphicsObject.beginFill(0xff0000, 1);
        this.graphicsObject.drawCircle(0, 0, 50);
        this.graphicsObject.inputEnabled = true;
        this.graphicsObject.input.enableDrag(true);

        this.graphicsObject.events.onDragUpdate.add(this.doThing);

        var coords = integerRange(0, 7).map(function(n) {
            return [Math.cos((n/4) * Math.PI), Math.sin((n/4) * Math.PI)];
        });

        this.dockingPoints = coords.map(function(n) {
            return n.map(function(m) {
                return saneRound(m*50, 2);
            });
        });

        this.dockingPoints.forEach(function(e, i, a) {

        });
    }

    doThing = (sender) => {
        this.draggingEvent.trigger(this);
    }
}

//////// INEQUALITY.TS

class Inequality {

    game: Phaser.Game;
    symbols: Array<ISymbol>;

    constructor() {
        this.game = new Phaser.Game(750, 600, Phaser.AUTO, 'content', { create: this.create, update: this.update });
        this.symbols = [];
    }

    create = () => {
        for(var i = 0; i < 12; ++i) {
            var circle = new Symbol(this.game, 150 + 150*(i%4), 150 + 150*(Math.floor(i/4)), "f");

            circle.dragging.on( this.checkProximity );

            this.symbols.push(circle);
        }
    }

    update = () => {
        // for(var i = 0; i < 12; ++i) {
        //     this.points[i].x += 2*(Math.random()-0.5);
        //     this.points[i].y += 2*(Math.random()-0.5);
        // }
    }

    checkProximity = (sender: Symbol) => {
        // debugger;
        this.symbols.forEach(function(symbol: Symbol, index, array) {
            if(sender != symbol && sender.graphicsObject.position.distance(symbol.graphicsObject.position) < 50) {
                sender.graphicsObject.scale.x = 0.5;
                sender.graphicsObject.scale.y = 0.5;
            } else {
                sender.graphicsObject.scale.x = 1.0;
                sender.graphicsObject.scale.y = 1.0;
            }
            sender.graphicsObject.update();
        });
    }

}

//////// BOOT.TS

var inequality = new Inequality();
