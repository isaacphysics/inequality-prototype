import { Widget, Rect } from './widget.ts'

export
class Symbol extends Widget {
	bounds: Rect = null;

	get dockingPoint(): p5.Vector {
		var box = this.s.font.textBounds("x", 0, 1000, this.scale * 120);
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
		var box = this._fakeBoundingBox();
		switch(index) {
			case 0:
				return this.p.createVector(box.w, -box.h/2);
			case 1:
				return this.p.createVector(box.w * 3/4, -box.h * 5/4);
			case 2:
				return this.p.createVector(box.w * 3/4,  box.h * 1/4);
		}
	}

	dock(p: p5.Vector) {
		if(this.parentWidget instanceof Symbol) {
			var np: p5.Vector = p5.Vector.sub(p, this.dockingPoint);
			this.moveBy(np);
		} else {
			var np: p5.Vector = p5.Vector.sub(p, this.boundingBox().center);
			this.moveBy(np);
		}
	}

	boundingBox(): Rect {
		var box = this.s.font.textBounds(this.letter || "e", 0, 1000, this.scale * 120);
		this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
		return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
	}

	_fakeBoundingBox(): Rect {
		// This whole function sucks. Sue me.
		if(this.letter >= 'A' && this.letter <= 'Z') {
			var box = this.s.font.textBounds('x', 0, 1000, this.scale * 120);
			this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
			return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
		} else if(this.letter >= 'a' && this.letter <= 'z') {
			var box = this.s.font.textBounds('x', 0, 1000, this.scale * 120);
			this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
			return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
		} else {
			return new Rect(0,0,0,0);
		}
		// Ok, and what if it's a number?!
	}

	draw() {
		super.draw();

		this.p.fill(0).strokeWeight(0).noStroke();

		this.p.textFont(this.s.font)
			.textSize(120 * this.scale)
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
