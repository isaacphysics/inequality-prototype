import { Widget, Rect } from './widget.ts'

export
class Symbol extends Widget {
	bounds: Rect = null;

	get dockingPoint(): p5.Vector {
		var box = this.s.font.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
		var p = this.p.createVector(this.position.x, this.position.y - box.h/2);
		return p;
	}

	constructor(p: any, private s: any, private letter: string) {
		super(p, s);

		this.dockingPoints = _.map(_.range(0, 3), (n) => { return this.defaultDockingPointPositionForIndex(n); });
		this.dockingPointScales = [1.0, 0.6, 0.6];
		this.dockingPointTypes = ['operator', 'exponent', 'subscript'];
		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
		this.children = [null, null, null];
	}

	defaultDockingPointPositionForIndex(index: number): p5.Vector {
		var box = this.boundingBox();
		var descent = this.position.y - (box.y+box.h);
		switch(index) {
			case 0:
				return this.p.createVector(box.w/2 + this.s.mBox.w/4, -this.s.xBox.h/2);
			case 1:
				return this.p.createVector(box.w/2 + this.scale*20, -(box.h + descent + this.scale*20));
			case 2:
				return this.p.createVector(box.w/2 + this.scale*20, this.scale*20);
		}
	}

	dock(p: p5.Vector) {
		if(this.parentWidget instanceof Symbol) {
			var np = p5.Vector.sub(p, this.dockingPoint);
			this.moveBy(np);
		} else {
			var np: p5.Vector = p5.Vector.sub(p, this.position);
			this.moveBy(np);
		}
	}

	// This may eventually make sense, or not...
	_shakeIt() {
		// Go through the children, first the (sub|super)scripts...
		var right = this.position.x + this.scale * (this.defaultDockingPointPositionForIndex(0).x + 10);
		var rightChanged = false;
		_.each([1,2], (index) => {
			if(this.children[index] != null) {
				var child = this.children[index];
				child.scale = this.scale * this.dockingPointScales[index];
				var newPosition = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPoints[index], this.scale));
				child.dock(newPosition);
				child._shakeIt();

				var box = child.subtreeBoundingBox();
				var boxRight = box.x + box.w;
				if(boxRight > right) {
					rightChanged = true;
					right = boxRight + this.scale*10;
				}
			} else {
				this.dockingPoints[index] = this.defaultDockingPointPositionForIndex(index);
			}
		});
		if(rightChanged) {
			this.dockingPoints[0] = this.p.createVector(right - this.position.x - this.scale * 10, this.dockingPoints[0].y);
		} else {
			this.dockingPoints[0] = this.defaultDockingPointPositionForIndex(0);
		}
		if(this.children[0] != null) {
			var child = this.children[0];
			child.scale = this.scale * this.dockingPointScales[0];
			var newPosition = p5.Vector.add(this.position, p5.Vector.mult(this.dockingPoints[0], this.scale));
			child.dock(newPosition);
			child._shakeIt();
		}

		_.each([1,2,0], (index) => {
			// Haters gonna hate, hate, hate, hate, hate...
			if(this.children[index] != null) {
				this.children[index]._shakeIt();
			}
		});
	}


	boundingBox(): Rect {
		var box = this.s.font.textBounds(this.letter || "e", 0, 1000, this.scale * this.s.baseFontSize);
		this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
		return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
	}

	draw() {
		super.draw();

		this.p.fill(0).strokeWeight(0).noStroke();

		this.p.textFont(this.s.font)
			.textSize(this.s.baseFontSize * this.scale)
			.textAlign(this.p.CENTER, this.p.BASELINE)
			.text(this.letter, this.position.x, this.position.y);
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
