import { Widget, Rect } from './widget.ts';
import { Symbol } from './symbol.ts';

export
class Fraction extends Widget {
    bounds: Rect = null;

    // TODO the dockingPoint thing

    constructor(p: any, protected s: any) {
        super(p, s);

        this.dockingPoints = _.map(_.range(0, 1, 2), (n) => { return this.defaultDockingPointPositionForIndex(n); });
        this.dockingPointScales = [1.0];
        this.dockingPointTypes = ['symbol'];
        this.docksTo = ['operator'];
        this.children = [null];
    }

    /**
     * Generates the expression corresponding to this widget and its subtree.
     *
     * The `subscript` format is a special one for generating symbols that will work with the sympy checker. It squashes
     * everything together, ignoring operations and all that jazz.
     *
     * @param format A string to specify the output format. Supports: latex, python, subscript.
     * @returns {string} The expression in the specified format.
     */
    getExpression(format: string): string {
        var expression = "";
        if(format == "latex") {
            if (this.children[0] != null) {
                expression += "\frac{" + this.children[1].getExpression(format) + "}{" + this.children[2].getExpression(format) + "} " + this.children[0].getExpression(format);
            }
        } else if(format == "python") {
            if (this.children[0] != null) {
                expression += "((" + this.children[1].getExpression(format) + ")/(" + this.children[2].getExpression(format) + ")) * (" + this.children[0].getExpression(format) + ")";
            }
        } else if(format == "subscript") {
            if (this.children[0] != null) {
                expression += "[NOPE:" + this.id + "]";
            }
        }
        return expression;
    }

    /** Paints the widget on the canvas. */
    draw() {
        super.draw();

        /*
        this.p.fill(0).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize*0.8 * this.scale)
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
        */
    }

    /**
     * Generates this widget's docking point positions. A Fraction has three docking point:
     *
     * - 0: Symbol
     * - 1: Symbol (numerator)
     * - 2: Symbol (denominator)
     *
     * @param index The docking point's index
     * @returns {p5.Vector} The position of the requested docking point
     */
    defaultDockingPointPositionForIndex(index: number): p5.Vector {
        var box = this.boundingBox();
        switch(index) {
            case 0:
                return this.p.createVector(box.w/2 + this.s.mBox.w/4, -this.s.xBox.h/2);
            case 1:
                return;
            case 2:
                return;
        }
    }

    /**
     * Docks this widget to its parent's docking point. This method is called by the parent when asked to set one of its
     * children.
     *
     * @param p The position of the parent's docking point, passed from the parent.
     */
    dock(p: p5.Vector) {
        // TODO This might actually end up being the one that needs the index
        if(this.parentWidget instanceof Symbol) {
            var np: p5.Vector = p5.Vector.sub(p, this.dockingPoint);
            this.moveBy(np);
        } else {
            var np: p5.Vector = p5.Vector.sub(p, this.dockingPoint);
            this.moveBy(np);
        }
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        var box = this.s.font_up.textBounds(this.operation || "+", 0, 1000, this.scale * this.s.baseFontSize*0.8);
        this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
        return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
    }

    /**
     * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
     * overridden by children of this class.
     *
     * @private
     */
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
}