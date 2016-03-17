import { Widget, Rect } from './widget.ts'

export
class BinaryOperation extends Widget {
    bounds: Rect = null;

    get dockingPoint(): p5.Vector {
        var box = this.s.font.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        var p = this.p.createVector(this.position.x, this.position.y - box.h/2);
        return p;
    }

    constructor(p: any, private s: any, private operation: string) {
        super(p, s);

        this.dockingPoints = _.map(_.range(0, 1), (n) => { return this.defaultDockingPointPositionForIndex(n); });
        this.dockingPointScales = [1.0];
        this.dockingPointTypes = ['symbol'];
        this.docksTo = ['operator'];
        this.children = [null];
    }

    getExpression(format: string): string {
        var expression = "";
        if(format == "latex") {
            if (this.children[0] != null) {
                expression += this.operation + "" + this.children[0].getExpression(format);
            }
        } else if(format == "python") {
            if (this.children[0] != null) {
                expression += this.operation + "" + this.children[0].getExpression(format);
            }
        } else if(format == "subscript") {
            if (this.children[0] != null) {
                expression += this.operation + "" + this.children[0].getExpression(format);
            }
        }
        return expression;
    }

    defaultDockingPointPositionForIndex(index: number): p5.Vector {
        var box = this.boundingBox();
        switch(index) {
            case 0:
                return this.p.createVector(box.w/2 + this.s.mBox.w/4, -this.s.xBox.h/2);
        }
    }

    dock(p: p5.Vector) {
        // INFO: http://tinyurl.com/o39ju6e
        if(this.parentWidget instanceof Symbol) {
            var np: p5.Vector = p5.Vector.sub(p, this.position);
            this.moveBy(np);
        } else {
            var np: p5.Vector = p5.Vector.sub(p, this.dockingPoint);
            this.moveBy(np);
        }
    }

    _shakeIt() {
        if(this.children[0] != null) {
            var child = this.children[0];
            child.scale = this.scale * this.dockingPointScales[0];
            var newPosition = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPoints[0], this.scale));
            child.dock(newPosition);
            child._shakeIt();
        }

        // Haters gonna hate, hate, hate, hate, hate...
        if(this.children[0] != null) {
            this.children[0]._shakeIt();
        }
    }


    boundingBox(): Rect {
        var box = this.s.font.textBounds(this.operation || "+", 0, 1000, this.scale * this.s.baseFontSize);
        this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
        return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
    }

    draw() {
        super.draw();

        this.p.fill(0).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.operation, this.position.x, this.position.y);
        this.p.strokeWeight(1);

        if(window.location.hash === "#debug") {
            this.p.stroke(255, 0, 0).noFill();
            this.p.ellipse(this.position.x, this.position.y, 10, 10);
            this.p.ellipse(this.position.x, this.position.y, 5, 5);

            this.p.stroke(0, 0, 255).noFill();
            this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 10, 10);
            this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 5, 5);
        }
    }
}