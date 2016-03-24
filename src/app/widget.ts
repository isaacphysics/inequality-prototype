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

	contains(p: p5.Vector): boolean {
		return (p.x >= this.x) && (p.y >= this.y) && (p.x <= this.x+this.w) && (p.y <= this.y+this.h);
	}

	get center() {
		return new p5.Vector(this.x + this.w/2, this.y + this.h/2);
	}
}

/** A base class for anything visible, draggable, and dockable. */
export
class Widget {
	/** p5 instance, I guess? */
	protected p: any;
	/** Unique ID */
	id: number = -1;

	/** Scaling factor for this widget (affected by where a widget is docked, typically) */
	scale: number = 1.0;

	/** Position of this widget */
	position: p5.Vector;

	/** Points to which other widgets can dock */
	dockingPoints: Array<p5.Vector> = [];

	/** An array of scales that a certain docking point imposes to its subtree */
	dockingPointScales: Array<number> = [];

	/** An array of the types of this widget's docking point */
	dockingPointTypes: Array<string> = [];

	/** An array of the types of docking points that this widget can dock to */
	docksTo: Array<string> = [];

	/** Cosmetic parameter to highlight the docking point currently being hovered */
	highlightDockingPoint: number = -1;

	/** An array set by the currently moving symbol that tells us to only draw the docking point that it can dock to. */
	dockingPointsToDraw: Array<string> = [];

	/** Docker children (or null) */
	children: Array<Widget> = [];

	/** Convenience pointer to this widget's parent */
	parentWidget: Widget = null;

	constructor(p: any, protected s: any) {
		// Take a new unique id for this symbol
		this.id = ++wId;
		// This is weird but necessary: this.p will be the sketch function
		this.p = p;
		// Default position is [0, 0]
		this.position = p.createVector(0, 0);

		this.dockingPoints = _.map(_.range(0, 7), (n) => { return this.defaultDockingPointPositionForIndex(n); });
		this.dockingPointScales = _.range(0, 7).map(() => { return 1.0; });
		this.dockingPointTypes = _.range(0, 7).map(() => { return null; });
		this.docksTo = [];
		this.children = _.range(0, 7).map(() => { return null; });
	}

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
		var alpha = 255;
		if(this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
			alpha = 127;
		}

		// This has to be done twice
		_.each(this.children, (child, index) => {
			if(child == null) {
				// There is no child to paint, let's paint an empty docking point
				var type = this.dockingPointTypes[index];
				var point = this.dockingPoints[index];
				if(this.dockingPointsToDraw.indexOf(type) > -1 || window.location.hash === "#debug") {
					this.p.stroke(0, 127, 255, alpha * 0.5);
					if(index == this.highlightDockingPoint) {
						this.p.fill(127, 192, 255);
					} else {
						this.p.noFill();
					}
					this.p.ellipse(this.position.x + this.scale * point.x, this.position.y + this.scale * point.y, this.scale * 20, this.scale * 20);
				}
			}
		});
		// Curses, you painter's algorithm!
		_.each(this.children, child => {
			if(child != null) {
				// There is a child, so let's just draw it...
				child.draw();
			}
		});

		this.p.noFill();
		if(window.location.hash === "#debug") {
			var box = this.boundingBox();
			this.p.stroke(255, 0, 0, 64);
			// this.p.rect(box.x, box.y, box.w, box.h);

			var subtreeBox = this.subtreeBoundingBox();
			this.p.stroke(0, 0, 255, 64);
			this.p.rect(subtreeBox.x, subtreeBox.y, subtreeBox.w, subtreeBox.h);

			var dockingBox = this.dockingBoundingBox();
			this.p.stroke(0, 127, 0, 64);
			this.p.rect(dockingBox.x, dockingBox.y, dockingBox.w, dockingBox.h);
		}
	}

	/**
	 * Generates this widget's docking point positions.
	 *
	 * @param index The docking point's index
	 * @returns {p5.Vector} The position of the requested docking point
     */
	defaultDockingPointPositionForIndex(index: number): p5.Vector {
		// Yes, there is a minus sign over there, because the y-axis is flipped.
		// Thank you, analog TV.
		return this.p.createVector(Math.cos( (index/8) * 2*Math.PI), -Math.sin( (index/8) * 2*Math.PI)).mult(80);
	}

	/**
	 * Docks this widget to its parent's docking point. This method is called by the parent when asked to set one of its
	 * children.
	 *
	 * @param p The position of the parent's docking point, passed from the parent.
     */
	dock(p: p5.Vector) {
		var np = p5.Vector.add(this.position, p5.Vector.mult(p, this.scale));
		// FIXME Do the docking around the center of the bounding box instead of the basepoint (or something along those lines)
		this.moveBy(p5.Vector.sub(np, this.position));
	}

	/**
	 * This widget's tight bounding box. This is used for the cursor hit testing.
	 *
	 * @returns {Rect} The bounding box
     */
	boundingBox(): Rect {
		// These numbers are hardcoded, but I suppose that's OK for now...
		return new Rect(this.position.x-this.scale*50, this.position.y-this.scale*50, this.scale * 100, this.scale * 100);
	}

	/**
	 * This widget's bounding box expanded to include the docking points. This is used for the "external" hit testing
	 * involved in the docking process.
	 */
	dockingBoundingBox(): Rect {
		var box = this.boundingBox();
		var left = box.x, right = box.x + box.w, top = box.y, bottom = box.y + box.h;
		_.each(this.dockingPoints, (point) => {
			if(left > this.position.x + point.x - 10*this.scale) { left = this.position.x + this.scale*(point.x - 10); }
			if(top > this.position.y + point.y - 10*this.scale) { top = this.position.y + this.scale*(point.y - 10); }
			if(right < this.position.x + this.scale*(point.x + 10)) { right = this.position.x + this.scale*(point.x + 10); }
			if(bottom < this.position.y + this.scale*(point.y + 10)) { bottom = this.position.y + this.scale*(point.y + 10); }
		});
		return new Rect(left, top, right-left, bottom-top);
	}

	// ************ //

	/**
	 * The bounding box including this widget's whole subtree.
	 *
	 * @returns {Rect}
     */
	subtreeBoundingBox(): Rect {
		var [box, ...subtree] = _.map(this.getAllChildren(), (c) => { return c.boundingBox() });
		var left = box.x, right = box.x + box.w, top = box.y, bottom = box.y + box.h;
		_.each(subtree, (c) => {
			if(left > c.x) { left = c.x; }
			if(top > c.y) { top = c.y; }
			if(right < c.x + c.w) { right = c.x + c.w; }
			if(bottom < c.y + c.h) { bottom = c.y + c.h; }
		});
		return new Rect(left, top, right-left, bottom-top);
	}

	/** Removes this widget from its parent. Also, shakes it. */
	removeFromParent() {
		this.parentWidget.removeChild(this);
		this.shakeIt();
	}

	/**
	 * Convenience method for removeFromParent().
	 *
	 * @param child The child being removed, just in case you need it.
     */
	removeChild(child: Widget) {
		this.children = this.children.map( (e: Widget) => {
			if(e != null && child.id == e.id) {
				return null;
			} else {
				return e;
			}
		});
		child.parentWidget = null;

		this.shakeIt();
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
		_.some(this.children, child => {
			if(child != null) {
				w = child.hit(p);
				return w != null;
			}
		});
		if(w != null) {
			return w;
		} else if(this.boundingBox().contains(p)) {
			return this;
		} else {
			return null;
		}
	}

	/**
	 * External hit test. Detects whether a point is hitting the bounding box containing the docking points. This is
	 * used for reducing the amount of docking points to be hit-tested. May be going soon.
	 *
	 * @param p The hit point
	 * @returns {Widget} This widget, if hit; null if not.
     */
	externalHit(p: p5.Vector): Widget {
		var w: Widget = null;
		_.some(this.children, child => {
			if(child != null) {
				w = child.externalHit(p);
				return w != null;
			}
		});
		if(w != null) {
			return w;
		} else if(this.dockingBoundingBox().contains(p)) {
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
	dockingPointsHit(p: p5.Vector): number {
		// This highlight thing is incredibly fishy, and yet it works...
		this.highlightDockingPoint = -1;
		_.each(this.dockingPoints, (e, i) => {
			var dp = p5.Vector.add(p5.Vector.mult(e, this.scale), this.position);
			if(p5.Vector.dist(p, dp) < 10) {
				this.highlightDockingPoint = i;
			}
		});
		return this.highlightDockingPoint;
	}

	/** @returns {*[]} A flattened array of all this widget's children, including this widget as the first element. */
	getAllChildren(): Array<Widget> {
		var subtree: Array<Widget> = [];
		subtree.push(this);
		this.children.forEach( c => {
			if(c != null) {
				subtree = subtree.concat(c.getAllChildren());
			}
		});
		return _.flatten(subtree);
	}

	/**
	 * Moves this widget by a specified amount, and all its children along with it.
	 *
	 * @param d The distance to move by.
     */
	moveBy(d: p5.Vector) {
		this.position.add(d);
		this.children.forEach( child => {
			if(child != null) {
				child.moveBy(d);
			}
		});
	}

	/**
	 * Sets the types of docking points to be drawn while a widget is moving. Based on the currently moving widget's
	 * docksTo property.
	 *
	 * @param points An array of docking point types (strings).
     */
	setDockingPointsToDraw(points: Array<string>) {
		this.children.forEach( child => {
			if(child != null) {
				child.setDockingPointsToDraw(points);
			}
		});
		this.dockingPointsToDraw = points;
	}

	/** Resets the types of docking point types to be drawn. Typically called after the user drops a widget somewhere. */
	clearDockingPointsToDraw() {
		this.children.forEach( child => {
			if(child != null) {
				child.setDockingPointsToDraw([]);
			}
		});
		this.dockingPointsToDraw = [];
	}

	/**
	 * Set a child to this widget at the given docking point index.
	 *
	 * @param index The index of the docking point for this child.
	 * @param child The child widget to dock.
     */
	setChild(index: number, child: Widget) {
		// Add the child to this symbol,
		this.children[index] = child;
		// set this symbol as the child's parent
		child.parentWidget = this;
		// snap the child into position
		this.shakeIt();
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
	_shakeIt() {
		// Go through the children
		this.children.forEach((child: Widget, index: number) => {
			if(child != null) { // If the child is not null, move it around
				// Scale the child appropriately,
				child.scale = this.scale * this.dockingPointScales[index];
				// move the corresponding docking point somewhere nice,
				var thisBox = this.boundingBox();
				var childBox = child.boundingBox();
				var gap = (thisBox.x + thisBox.w) - (childBox.x);
				this.dockingPoints[index] = p5.Vector.add(this.defaultDockingPointPositionForIndex(index), this.p.createVector(gap, 0));
				// and move the child along with it.
				child.dock(p5.Vector.add(this.position, this.dockingPoints[index]));
				// Haters gonna hate.
				child._shakeIt();
			} else {
				// If the child is null, this is a docking point, thus restore it to its "natural" position
				this.dockingPoints[index] = this.defaultDockingPointPositionForIndex(index);
			}
		});
	}
}
