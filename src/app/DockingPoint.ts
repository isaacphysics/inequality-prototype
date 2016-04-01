import { Widget } from './widget.ts';
export class DockingPoint {

    private _child: Widget = null;

    public constructor(public widget: Widget, public position: p5.Vector, public scale: number, public type: string) {

    }

    set child(child) {
        this._child = child;
        if (child) {
            this._child.parentWidget = this.widget;
            this._child.shakeIt();
        }
    }

    get child() {
        return this._child;
    }
}