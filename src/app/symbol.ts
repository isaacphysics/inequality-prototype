import { Widget, Rect } from './widget.ts'

export
class Symbol extends Widget {
	letter = "NULL";
	bounds: Rect = null;

	constructor(p: any, private s: any, letter: string) {
		super(p, s);
		this.letter = letter;

		// WHY THE OFFSET?!
		var offset = 100;
		var box = s.font.textBounds(letter, offset, offset, this.scale * 120);
		this.bounds = new Rect( box.x-(offset + box.w/2), box.y-(offset - box.h/2), box.w, box.h);

		this.dockingPoints = _.map([0, 1, 5], n => {
			// Mind the minus sign.
			// FIXME 80 is hardcoded
			return p.createVector(Math.cos( (n/6) * 2*Math.PI), -Math.sin( (n/6) * 2*Math.PI)).mult(80);
		});
		this.dockingPointScales = [1.0, 0.6, 0.6];
		this.dockingPointTypes = ['operator', 'exponent', 'subscript'];
		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
		this.children = [null, null, null];
	}

	boundingBox(): Rect {
		// These numbers are hardcoded, but I suppose that's OK for now...
		return new Rect(this.position.x + this.bounds.x, this.position.y + this.bounds.y, this.bounds.w, this.bounds.h);
	}

	draw() {
		super.draw();

		this.p.fill(0).strokeWeight(0);
		this.p.textFont(this.s.font)
			.textSize(120 * this.scale)
			.textAlign(this.p.CENTER, this.p.CENTER)
			.text(this.letter, this.position.x, this.position.y);
		this.p.strokeWeight(1);
	}
}
