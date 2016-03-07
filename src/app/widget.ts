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

export
class Widget {
	protected p: any;

	scale: number = 1.0;

	id: number = -1;
	position: p5.Vector;

	//get dockingPoint(): p5.Vector {
	//	return this.position;
	//}

	dockingPoints: Array<p5.Vector> = [];
	dockingPointScales: Array<number> = [];
	dockingPointTypes: Array<string> = [];
	docksTo: Array<string> = [];
	highlightDockingPoint: number = -1;
	dockingPointsToDraw: Array<string> = [];

	children: Array<Widget> = [];
	parentWidget: Widget = null;

	constructor(p: any, private s: any) {
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
			this.p.stroke(255, 0, 0);
			this.p.rect(box.x, box.y, box.w, box.h);

			var subtreeBox = this.subtreeBoundingBox();
			this.p.stroke(0, 0, 255);
			this.p.rect(subtreeBox.x, subtreeBox.y, subtreeBox.w, subtreeBox.h);

			var dockingBox = this.dockingBoundingBox();
			this.p.stroke(0, 127, 0);
			this.p.rect(dockingBox.x, dockingBox.y, dockingBox.w, dockingBox.h);
		}
	}

	// It's the widget's responsibility to generate its own docking points
	defaultDockingPointPositionForIndex(index: number): p5.Vector {
		// Yes, there is a minus sign over there, because the y-axis is flipped.
		// Thank you, analog TV.
		return this.p.createVector(Math.cos( (index/8) * 2*Math.PI), -Math.sin( (index/8) * 2*Math.PI)).mult(80);
	}

	// It'll be the widget's responsibility to position itself relative to its parent's docking point
	dock(p: p5.Vector) {
		var np = p5.Vector.add(this.position, p5.Vector.mult(p, this.scale));
		// FIXME Do the docking around the center of the bounding box instead of the basepoint (or something along those lines)
		this.moveBy(p5.Vector.sub(np, this.position));
	}

	// The RED one with the PURPLE-ish border
	boundingBox(): Rect {
		// These numbers are hardcoded, but I suppose that's OK for now...
		return new Rect(this.position.x-this.scale*50, this.position.y-this.scale*50, this.scale * 100, this.scale * 100);
	}

	// The GREEN one
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

	// The BLUE one
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

	removeFromParent() {
		this.parentWidget.removeChild(this);
		this.parentWidget = null;

		this.shakeIt();
	}

	removeChild(child: Widget) {
		this.children = this.children.map( (e: Widget) => {
			if(e != null && child.id == e.id) {
				return null;
			} else {
				return e;
			}
		});

		this.shakeIt();
	}

	hit(p: p5.Vector): Widget {
		var w = null;
		_.each(this.children, child => {
			if(child != null) {
				w = child.hit(p);
			}
		});
		if(w != null) {
			return w;
		}
		if(this.boundingBox().contains(p)) {
			return this;
		}
		return null;
	}

	externalHit(p: p5.Vector): Widget {
		var w = null;
		_.each(this.children, child => {
			if(child != null) {
				w = child.externalHit(p);
			}
		});
		if(w != null) {
			return w;
		}
		if(this.dockingBoundingBox().contains(p)) {
			return this;
		}
		return null;
	}

	dockingPointsHit(p: p5.Vector): number {
		// This highlight thing is incredibly fishy, and yet it works...
		this.highlightDockingPoint = -1;
		this.dockingPoints.some( (e, i) => {
			var dp = p5.Vector.add(p5.Vector.mult(e, this.scale), this.position);
			if(p5.Vector.dist(p, dp) < 10) {
				this.highlightDockingPoint = i;
				return true;
			}
		});
		return this.highlightDockingPoint;
	}

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

	moveBy(d: p5.Vector) {
		this.position.add(d);
		this.children.forEach( child => {
			if(child != null) {
				child.moveBy(d);
			}
		});
	}

	setDockingPointsToDraw(points: Array<string>) {
		this.children.forEach( child => {
			if(child != null) {
				child.setDockingPointsToDraw(points);
			}
		});
		this.dockingPointsToDraw = points;
	}

	clearDockingPointsToDraw() {
		this.children.forEach( child => {
			if(child != null) {
				child.setDockingPointsToDraw([]);
			}
		});
		this.dockingPointsToDraw = [];
	}

	setChild(index: number, child: Widget) {
		// Add the child to this symbol,
		this.children[index] = child;
		// set the child's parent to this symbol,
		child.parentWidget = this;
		// snap the child into position
		this.shakeIt();
	}

	// Shakes up the subtree to make everything look nicer.
	//   (the only way this could be better is if I was writing this in Swift)
	shakeIt() {
		// Go through the children
		this.children.forEach((child: Widget, index: number) => {
			if(child != null) { // If the child is not null, move it around
				// Scale the child appropriately,
				child.scale = this.scale * this.dockingPointScales[index];
				// move the corresponding docking point somewhere nice,
				var thisbox = this.boundingBox();
				var childbox = child.boundingBox();
				var gap = (thisbox.x+thisbox.w) - (childbox.x);
				this.dockingPoints[index] = p5.Vector.add(this.defaultDockingPointPositionForIndex(index), this.p.createVector(gap, 0));
				// and move the child along with it.
				child.dock(p5.Vector.add(this.position, this.dockingPoints[index]));
				// Haters gonna hate.
				child.shakeIt();
			} else {
				// If the child is null, this is a docking point, thus restore it to its "natural" position
				this.dockingPoints[index] = this.defaultDockingPointPositionForIndex(index);
			}
		});
	}
}
