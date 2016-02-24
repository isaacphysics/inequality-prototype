import { Widget, Rect } from './widget.ts'

export
class Symbol extends Widget {
	letter = "NULL";
	bounds: Rect = null;

	constructor(p: any, private s: any, letter: string) {
		super(p, s);
		this.letter = letter;

		var box = this.boundingBox();

		this.dockingPoints = [
			p.createVector(box.w, -box.h/2),
			p.createVector(box.w * 3/4, -box.h * 5/4),
			p.createVector(box.w * 3/4,  box.h * 1/4)
		];
		this.dockingPointScales = [1.0, 0.6, 0.6];
		this.dockingPointTypes = ['operator', 'exponent', 'subscript'];
		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
		this.children = [null, null, null];
	}

	boundingBox(): Rect {
		var box = this.s.font.textBounds(this.letter, 0, 1000, this.scale * 120);
		this.bounds = new Rect(-box.w/2, box.y-1000, box.w, box.h);
		return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
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
		}
	}
}
