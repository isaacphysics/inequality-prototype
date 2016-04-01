import { Widget, Rect } from './widget.ts'
import {BinaryOperation} from "./binaryoperation";
import { DockingPoint } from "./DockingPoint.ts";

export
class Symbol extends Widget {

    protected s: any;
    private letter: string;

	/**
	 * There's a thing with the baseline and all that... this sort-of fixes it.
	 *
	 * @returns {Vector} The position to which a Symbol is meant to be docked from.
	 */
	get dockingPoint(): p5.Vector {
		var box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
		var p = this.p.createVector(0, - box.h / 2);
		return p;
	}

	constructor(p:any, s:any, letter:string) {
        this.letter = letter;
        this.s = s;
		super(p, s);

		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
	}

    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "operator");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.75, "exponent");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, this.scale * 20), 0.75, "subscript");
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
		var expression = "";/*
		if (format == "latex") {
			expression = this.letter;
			if (this.children[1] != null) {
				expression += "^{" + this.children[1].getExpression(format) + "}";
			}
			if (this.children[2] != null) {
				expression += "_{" + this.children[2].getExpression(format) + "}";
			}
			if (this.children[0] != null) {
				if (this.children[0] instanceof BinaryOperation) {
					expression += this.children[0].getExpression(format);
				} else {
					// WARNING This assumes it's a Symbol, hence produces a multiplication
					expression += " " + this.children[0].getExpression(format);
				}
			}
		} else if (format == "python") {
			expression = "" + this.letter;
			if (this.children[2] != null) {
				expression += this.children[2].getExpression("subscript");
			}
			if (this.children[1] != null) {
				expression += "**(" + this.children[1].getExpression(format) + ")";
			}
			if (this.children[0] != null) {
				if (this.children[0] instanceof BinaryOperation) {
					expression += this.children[0].getExpression(format);
				} else {
					// WARNING This assumes it's a Symbol, hence produces a multiplication
					expression += "*" + this.children[0].getExpression(format);
				}
			}
		} else if (format == "subscript") {
			expression = "" + this.letter;
			if (this.children[2] != null) {
				expression += this.children[2].getExpression(format);
			}
			if (this.children[1] != null) {
				expression += this.children[1].getExpression(format);
			}
			if (this.children[0] != null) {
				expression += this.children[0].getExpression(format);
			}
		}*/
		return expression;
	}

	/** Paints the widget on the canvas. */
	_draw() {

		this.p.fill(0).strokeWeight(0).noStroke();

		this.p.textFont(this.s.font_it)
			.textSize(this.s.baseFontSize * this.scale)
			.textAlign(this.p.CENTER, this.p.BASELINE)
			.text(this.letter, 0, 0);
		this.p.strokeWeight(1);

		if (window.location.hash === "#debug") {
			this.p.stroke(255, 0, 0).noFill();
			this.p.ellipse(0, 0, 10, 10);
			this.p.ellipse(0, 0, 5, 5);

			this.p.stroke(0, 0, 255).noFill();
			this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 10, 10);
			this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 5, 5);
		}
	}

	/**
	 * Docks this widget to its parent's docking point. This method is called by the parent when asked to set one of its
	 * children. This may or may not behave differently depending on the parent.
	 *
	 * @param p The position of the parent's docking point, passed from the parent.
	 *//*
	dock(p: p5.Vector) {
		var np:p5.Vector = p5.Vector.sub(p, this.dockingPoint);
		this.moveBy(np);
	}*/

	/**
	 * This widget's tight bounding box. This is used for the cursor hit testing.
	 *
	 * @returns {Rect} The bounding box
	 */
	boundingBox(): Rect {
		var box = this.s.font_it.textBounds(this.letter || "x", 0, 1000, this.scale * this.s.baseFontSize);
		return new Rect(-box.w / 2, box.y - 1000, box.w, box.h);
	}

	/**
	 * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
	 * overridden by children of this class.
	 *
	 * @private
	 */
	_shakeIt() {


        // Work out the size of all our children
        var boxes: {[key:string]: Rect} = {};

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
            }
        });

        // Calculate our own geometry

        // Nothing to do for Symbol

        // Set position of all our children.

        var box = this.boundingBox();
        var descent = (box.y + box.h);

        var widestSuperOrSubScript = 0;

        if ("superscript" in boxes) {
            var p = this.dockingPoints["superscript"].child.position;
            var w = boxes["superscript"].w;
            widestSuperOrSubScript = this.scale * this.s.mBox.w / 12 + w;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 12 + w/2;
            p.y = -(box.h - descent - this.scale * this.s.mBox.w / 6);
        }

        if ("subscript" in boxes) {
            var p = this.dockingPoints["subscript"].child.position;
            var w = boxes["subscript"].w;
            widestSuperOrSubScript = Math.max(this.scale * this.s.mBox.w / 12 + w, widestSuperOrSubScript);
            p.x = box.w / 2 + w/2;
            p.y = this.scale * this.s.mBox.w / 4;
        }

        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.y = 0;
            p.x = box.w / 2 + boxes["right"].w / 2 + widestSuperOrSubScript; // TODO: Tweak this with kerning.
        }


        // TODO: Recalculate positions of docking points.
/*
		// Go through the children, first the (sub|super)scripts...
		var right = this.position.x + this.scale * (this.defaultDockingPointPositionForIndex(0).x + 10);
		var rightChanged = false;
		_.each([1, 2], (index) => {
			if (this.children[index] != null) {
				var child = this.children[index];
				child.scale = this.scale * this.dockingPointScales[index];
				var newPosition = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPointPositions[index], this.scale));
				child.dock(newPosition);
				child._shakeIt();

				var box = child.subtreeBoundingBox();
				var boxRight = box.x + box.w;
				if (boxRight > right) {
					rightChanged = true;
					right = boxRight + this.scale * 10;
				}
			} else {
				this.dockingPointPositions[index] = this.defaultDockingPointPositionForIndex(index);
			}
		});
		if (rightChanged) {
			this.dockingPointPositions[0] = this.p.createVector(right - this.position.x - this.scale * 10, this.dockingPointPositions[0].y);
		} else {
			this.dockingPointPositions[0] = this.defaultDockingPointPositionForIndex(0);
		}
		if (this.children[0] != null) {
			var child = this.children[0];
			child.scale = this.scale * this.dockingPointScales[0];
			var newPosition = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPointPositions[0], this.scale));
			child.dock(newPosition);
			child._shakeIt();
		}

		_.each([1, 2, 0], (index) => {
			// Haters gonna hate, hate, hate, hate, hate...
			if (this.children[index] != null) {
				this.children[index]._shakeIt();
			}
		});*/
	}
}