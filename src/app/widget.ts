import { iRange, saneRound } from './utils.ts'

// This is meant to be a static global thingie for uniquely identifying widgets/symbols
// This may very well be a relic of my C++ multi-threaded past, but it served me well so far...
export var wId = 0;


export
class Widget {
	private p: any;
	private radius = 50;

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

	display(scale: number) {
		var alpha = 255;
		if(this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
			alpha = 127;
		}
		
		// This has to be done twice
		this.children.forEach( (child, index) => {
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
					this.p.ellipse(this.position.x + scale*point.x, this.position.y + scale*point.y, scale*20, scale*20);
				}
			}
		});
		// Curses, you painter's algorithm!
		this.children.forEach( (child, index) => {
			if(child != null) {
				// There is a child, so let's just draw it...
				child.display(this.dockingPointScales[index]);
			}
		});

		this.p.stroke(0, 63, 127, alpha);
		this.p.fill(255, 255, 255, alpha);
		this.p.ellipse(this.position.x, this.position.y, scale*2*this.radius, scale*2*this.radius);
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
	
	setChild(dockingPointIndex: number, child: Widget) {
		this.children[dockingPointIndex] = child;
		child.parentWidget = this;
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
		if(p5.Vector.dist(p, this.position) < this.radius) {
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
		if(p5.Vector.dist(p, this.position) < (this.radius + 80/2)) {
			return this;
		}
		return null;
	}

	getSubtree(): Array<Widget> {
		var subtree: Array<Widget> = [];
		//subtree.push(this);
		//this.children.forEach( c => {
		//	subtree = subtree.concat(c.getSubtree());
		//});
		return subtree;
	}

	moveBy(d: p5.Vector) {
		this.position.add(d);
		this.children.forEach( child => {
			if(child != null) {
				child.moveBy(d);
			}
		});
	}
}