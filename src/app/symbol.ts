import { Widget } from './widget.ts'

export
class Symbol extends Widget {
	constructor(p: any, private s: any) {
		super(p, s);

		this.dockingPoints = [0, 1, /*3,*/ 5].map((n) => {
			// Mind the minus sign.
			// FIXME 80 is hardcoded
			return p.createVector(Math.cos( (n/6) * 2*Math.PI), -Math.sin( (n/6) * 2*Math.PI)).mult(80);
		});
		this.dockingPointScales = [1.0, 0.6, /*1.0,*/ 0.6];
		this.dockingPointTypes = ['operator', 'exponent', /*'operator',*/ 'subscript'];
		this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
		this.children = [null, null, /*null,*/ null];
	}

	display(scale: number = 1.0) {
		super.display(scale);
	}
}
