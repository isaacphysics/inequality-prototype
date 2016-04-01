import { DockingPoint } from './DockingPoint.ts';
import Dictionary = _.Dictionary;

// This is meant to be a static global thingie for uniquely identifying widgets/symbols
// This may very well be a relic of my C++ multi-threaded past, but it served me well so far...
export var wId = 0;

export
class Rect {
	x: number;
	y: number;
	w: number;
	h: number;

	constructor(x: number, y: number, w: number, h: number) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

    setOrigin(newOrigin: p5.Vector) {
        this.x = this.x - newOrigin.x;
        this.y = this.y - newOrigin.y;
        return this;
    }

	contains(p: p5.Vector): boolean {
		return (p.x >= this.x) && (p.y >= this.y) && (p.x <= this.x+this.w) && (p.y <= this.y+this.h);
	}

	get center() {
		return new p5.Vector(this.x + this.w/2, this.y + this.h/2);
	}


}

/** A base class for anything visible, draggable, and dockable. */
export
abstract class Widget {
	/** p5 instance, I guess? */
	protected p: any;
	/** Unique ID */
	id: number = -1;

	/** Scaling factor for this widget (affected by where a widget is docked, typically) */
	scale: number = 1.0;

	/** Position of this widget */
	position: p5.Vector;

	/** Points to which other widgets can dock */
	dockingPoints: {[key:string]: DockingPoint; } = {};

	/** An array of the types of docking points that this widget can dock to */
	docksTo: Array<string> = [];

	/** Convenience pointer to this widget's parent */
	parentWidget: Widget = null;

	constructor(p: any, protected s: any) {
		// Take a new unique id for this symbol
		this.id = ++wId;
		// This is weird but necessary: this.p will be the sketch function
		this.p = p;
		// Default position is [0, 0]
		this.position = p.createVector(0, 0);

		this.generateDockingPoints();
	}

    generateDockingPoints() {};

	/**
	 * Generates the expression corresponding to this widget and its subtree. **This function is a stub and will not
	 * traverse the subtree.**
	 *
	 * @param format A string to specify the output format. Supports: latex, python.
	 * @returns {string} The expression in the specified format.
     */
	getExpression(format: string): string {
		return "";
	}

	/** Paints the widget on the canvas. */
	draw() {

        this.p.translate(this.position.x, this.position.y);
		var alpha = 255;
		if(this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
			alpha = 127;
		}

        _.each(this.dockingPoints, (dockingPoint, key) => {
            if (dockingPoint.child) {
                dockingPoint.child.draw();
            } else {
                // There is no child to paint, let's paint an empty docking point

                var drawThisOne = this.s.visibleDockingPointTypes.indexOf(dockingPoint.type) > -1;
                var highlightThisOne = this.s.activeDockingPoint == dockingPoint;

                if (drawThisOne || window.location.hash === "#debug") {
                    this.p.stroke(0, 127, 255, alpha * 0.5);
                    this.p.strokeWeight(1);
                    if(highlightThisOne) {
                        this.p.fill(127, 192, 255);
                    } else {
                        this.p.noFill();
                    }
                    this.p.ellipse(this.scale * dockingPoint.position.x, this.scale * dockingPoint.position.y, this.scale * 20, this.scale * 20);
                }
            }
        });

		this.p.noFill();
		if(window.location.hash === "#debug") {
			var box = this.boundingBox();
			this.p.stroke(255, 0, 0, 64);
			//this.p.rect(box.x, box.y, box.w, box.h);

			var subtreeBox = this.subtreeBoundingBox();
			this.p.stroke(0, 0, 255, 64);
			this.p.rect(subtreeBox.x, subtreeBox.y, subtreeBox.w, subtreeBox.h);
		}

        this._draw();
        this.p.translate(-this.position.x, -this.position.y);
	}

    abstract _draw();

	/**
	 * Docks this widget to its parent's docking point. This method is called by the parent when asked to set one of its
	 * children.
	 *
	 * @param p The position of the parent's docking point, passed from the parent.
     */
	//abstract dock(p: p5.Vector);

	/**
	 * This widget's tight bounding box. This is used for the cursor hit testing.
	 *
	 * @returns {Rect} The bounding box
     */
	abstract boundingBox(): Rect;

	// ************ //

	/**
	 * The bounding box including this widget's whole subtree.
	 *
	 * @returns {Rect}
     */
	subtreeBoundingBox(): Rect {

        var box = this.boundingBox();
		var subtree = _.map(this.getChildren(), c => {
            var b = c.subtreeBoundingBox();
            b.x += c.position.x;
            b.y += c.position.y;
            return b;
        });

		var left = box.x;
        var right = box.x + box.w;
        var top = box.y;
        var bottom = box.y + box.h;

		_.each(subtree, c => {
			if(left > c.x) { left = c.x; }
			if(top > c.y) { top = c.y; }
			if(right < c.x + c.w) { right = c.x + c.w; }
			if(bottom < c.y + c.h) { bottom = c.y + c.h; }
		});

		return new Rect(left, top, right-left, bottom-top);
	}

	/** Removes this widget from its parent. Also, shakes it. */
	removeFromParent() {
        var oldParent = this.parentWidget;
        _.each(this.parentWidget.dockingPoints, (dockingPoint) => {
            if (dockingPoint.child == this) {
                dockingPoint.child = null;
                this.parentWidget = null;
            }
        });
        this.shakeIt(); // Our size may have changed. Shake.
        oldParent.shakeIt(); // Our old parent should update. Shake.
	}

	/**
	 * Hit test. Detects whether a point is hitting the tight bounding box of this widget. This is used for dragging.
	 * Propagates down to children.
	 *
	 * @param p The hit point
	 * @returns {Widget} This widget, if hit; null if not.
     */
	hit(p: p5.Vector): Widget {
		var w: Widget = null;
		_.some(this.dockingPoints, dockingPoint => {
			if(dockingPoint.child != null) {
				w = dockingPoint.child.hit(p5.Vector.sub(p, this.position));
				return w != null;
			}
		});
		if(w != null) {
			return w;
		} else if(this.boundingBox().contains(p5.Vector.sub(p, this.position))) {
			return this;
		} else {
			return null;
		}
	}

	/**
	 * Hit test for this widget's docking points.
	 *
	 * @param p The hit point
	 * @returns {number} The hit docking point's index, or -1 if no docking point was hit.
     */
	dockingPointsHit(p: p5.Vector): DockingPoint {
        var q = p5.Vector.sub(p, this.position);

        var hitPoint:DockingPoint = null;
        _.some(this.getChildren(), child => {
            hitPoint = child.dockingPointsHit(q);
            return hitPoint != null;
        });

        if (!hitPoint) {
            // This highlight thing is incredibly fishy, and yet it works...
            _.each(this.dockingPoints, (point, name) => {
                var dp = p5.Vector.mult(point.position, this.scale);
                if(p5.Vector.dist(q, dp) < 10) {
                    hitPoint = point;
                }
            });
        }
		return hitPoint;
	}

    getChildren(): Array<Widget> {
        return _.compact(_.pluck(_.values(this.dockingPoints), "child"));
    }

    getAbsolutePosition(): p5.Vector {
        if (this.parentWidget) {
            return p5.Vector.add(this.parentWidget.getAbsolutePosition(), this.position);
        } else {
            return this.position;
        }
    }

	/**
	 * Shakes up the subtree to make everything look nicer.
	 * (*The only way this could be better is if I was writing this in Swift.*)
	 */
	shakeIt() {
		if(this.parentWidget == null) {
			this._shakeIt();
		} else {
			this.parentWidget.shakeIt();
		}
	}

	/**
	 * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
	 * overridden by children of this class.
	 *
	 * @private
     */
	abstract _shakeIt();
}
