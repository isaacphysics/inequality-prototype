import { Widget } from './widget.ts'

export
class Symbol extends Widget {
	constructor(p: any, private s: any) {
		super(p, s);

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

	draw() {
		super.draw();

		this.p.fill(0).strokeWeight(0);
		this.p.textFont("Georgia")
			.textStyle(this.p.ITALIC)
			.textSize(120 * this.scale)
			.textAlign(this.p.CENTER, this.p.CENTER)
			.text("e", this.position.x, this.position.y);
		this.p.strokeWeight(1);
	}
}
