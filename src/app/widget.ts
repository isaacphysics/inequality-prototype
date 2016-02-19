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
}

export
class Widget {
	protected p: any;
	protected radius = 50;

	scale: number = 1.0;

	id: number = -1;
	position: p5.Vector;

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

		this.dockingPoints = _.range(0, 7).map( n => {
			// Yes, there is a minus sign over there, because the y-axis is flipped.
			// Thank you, analog TV.
			// FIXME 80 is hardcoded (look further down too!)
			return p.createVector(Math.cos( (n/8) * 2*Math.PI), -Math.sin( (n/8) * 2*Math.PI)).mult(80);
		});
		this.dockingPointScales = _.range(0,7).map(() => { return 1.0; });
		this.dockingPointTypes = _.range(0,7).map(() => { return null; });
		this.docksTo = [];
		this.children = _.range(0,7).map(() => { return null; });
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
				if(this.dockingPointsToDraw.indexOf(type) > -1) {
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

		//this.p.stroke(63, 127, 192, alpha);
		//this.p.fill(255, 255, 255, alpha);
		//this.p.ellipse(this.position.x, this.position.y, this.scale * 2 * this.radius, this.scale * 2 * this.radius);

		var bigBox = this.subtreeBoundingBox();

		this.p.fill(127, 192, 255, 15);
		this.p.stroke(255, 0, 127, 63);
		this.p.rect(bigBox.x, bigBox.y, bigBox.w, bigBox.h);
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
		// snap the child into position,
		var np = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPoints[index], this.scale));
		child.moveBy(p5.Vector.sub(np, child.position));
		// and scale it appropriately.
		child.scale = this.scale * this.dockingPointScales[index];
		// Well done!
	}

	removeFromParent() {
		this.parentWidget.removeChild(this);
		this.parentWidget = null;
	}

	removeChild(child: Widget) {
		this.children = this.children.map( (e: Widget) => {
			if(e != null && child.id == e.id) {
				return null;
			} else {
				return e;
			}
		});
	}

	hit(p: p5.Vector): Widget {
		var w = null;
		this.children.some( child => {
			if(child != null) {
				w = child.hit(p);
				if(w != null) {
					return true;
				}
			}
		});
		if(w != null) {
			return w;
		}
		if(p5.Vector.dist(p, this.position) < this.scale * this.radius) {
			return this;
		}
		return null;
	}

	externalHit(p: p5.Vector): Widget {
		var w = null;
		this.children.some( child => {
			if(child != null) {
				w = child.hit(p);
				if(w != null) {
					return true;
				}
			}
		});
		if(w != null) {
			return w;
		}
		// FIXME 80 is hardcoded
		if(p5.Vector.dist(p, this.position) < this.scale*(this.radius + 80/2)) {
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

	boundingBox(): Rect {
		// These numbers are hardcoded, but I suppose that's OK for now...
		return new Rect(this.position.x-this.scale*50, this.position.y-this.scale*50, this.scale * 100, this.scale * 100);
	}

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
}
