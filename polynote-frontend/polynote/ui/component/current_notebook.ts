import {UIEventTarget, UIEvent} from "../util/ui_event";
import {NotebookUI} from "./notebook";


/**
 * CurrentNotebook keeps track of the currently selected notebook and provides a central point for other components to
 * coordinate to generate, and react to, modifications of the current notebook.
 */
export class CurrentNotebook extends UIEventTarget {
    private static inst: NotebookUI;

    static get get() {
        return this.inst
    }

    static set get(nb: NotebookUI) {
        this.inst = nb
    }
}

export class NotebookSelected extends UIEvent<{current: NotebookUI, prev: NotebookUI}> {
    constructor(current: NotebookUI, prev: NotebookUI) {
        super('NotebookSelected', {current, prev})
    }
}