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

		this.dockingPoints = [
			p.createVector(box.w*0.75, 0),
			p.createVector(box.w - 20, -box.h/2 - 20),
			p.createVector(box.w - 20,  box.h/2 + 20)
		];
		this.dockingPointScales = [1.0, 0.6, 0.6];
		this.dockingPointTypes = ['operator', 'exponent', 'subscript'];
		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
		this.children = [null, null, null];
	}

	boundingBox(): Rect {
		var offset = 100;
		var box = this.s.font.textBounds(this.letter, offset, offset, this.scale * 120);
		this.bounds = new Rect( box.x-(offset + box.w/2), box.y-(offset - box.h/2), box.w, box.h);
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
