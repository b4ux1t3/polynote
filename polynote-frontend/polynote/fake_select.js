import { UIEvent, UIEventTarget } from './ui_event.js'
import { button } from './tags.js'

export class SelectionChangedEvent extends UIEvent {
    constructor(changedFromEl, changedToEl, changedFromIndex, changedToIndex) {
        super('change', { changedFromEl: changedFromEl, changedToEl: changedToEl, changedFromIndex: changedFromIndex, changedToIndex: changedToIndex });
    }

    get newIndex() { return this.detail.changedToIndex }
    get oldIndex() { return this.detail.changedFromIndex }
    get newValue() { return this.detail.changedToEl.value }
    get oldValue() { return this.detail.changedFromEl.value }
}

export class FakeSelect extends UIEventTarget {
    constructor(element) {
        super();
        this.element = element;
        this.command = element.getAttribute('command');

        this.addEventListener('mousedown', evt => evt.preventDefault());

        Object.defineProperty(element, 'selectedIndex', {
            get: () => this.selectedIndex,
            set: value => this.selectedIndex = value
        });

        Object.defineProperty(element, 'options', {
            get: () => this.options
        });

        const marker = this.element.querySelector('.marker');
        if (marker) {
            marker.addEventListener('mousedown', evt => {
                if (!this.isOpen) {
                    this.opener = this.selectedElement;
                    this.moved = false;
                    this.expand();
                } else {
                    this.collapse();
                }
            });
        }

        this.updateOptions();
    }

    updateOptions() {
        this.options = [...this.element.getElementsByTagName("button")];
        for (const option of this.options) {
            if (option.classList.contains('selected')) {
                this.selectedElement = option;
            }

            this.setupOption(option);
        }

        if (!this.selectedElement) {
            this.selectedElement = this.options[0];
        }

        if (this.selectedElement) {
            this.value = this.selectedElement.value;
        }
    }

    addOption(text, value) {
        if (typeof(text) === "string")
            text = document.createTextNode(text);
        const b = button([], {type: 'button', value: value}, text);
        this.element.appendChild(b);
        this.options.push(b);
        this.setupOption(b);
    }

    removeOption(option) {
        const index = this.options.indexOf(option);

        if (index < 0) return;

        this.options.splice(index, 1);
        option.parentNode.removeChild(option);
    }

    setupOption(option) {
        option.addEventListener('mousedown', (evt) => {
            evt.preventDefault();
            evt.cancelBubble = true;

            if (!this.isOpen) {
                this.opener = evt.target;
                this.moved = false;
                this.expand();
            } else {
                this.moved = true;
            }
        });

        option.addEventListener('mousemove', (evt) => {
            if (evt.target !== this.opener && evt.target !== this.selectedElementCopy) {
                this.moved = true;
            }
        });

        option.addEventListener('mouseup', (evt) => {
            evt.preventDefault();
            evt.cancelBubble = true;

            if (evt.target !== this.selectedElementCopy || this.moved) {
                if (evt.target !== this.selectedElementCopy)
                    this.setSelectedElement(evt.target);
                this.collapse();
            }
        });
    }

    recomputeVisible() {
        this.element.querySelectorAll('.first-visible').forEach(el => el.classList.remove('first-visible'));
        this.element.querySelectorAll('.last-visible').forEach(el => el.classList.remove('last-visible'));
        let prevVisible = false;
        let lastVisible = false;
        this.options.forEach(opt => {
           if (!opt.disabled) {
               if (!prevVisible) {
                   prevVisible = true;
                   opt.classList.add('first-visible');
               }
               lastVisible = opt;
           }
        });

        if (lastVisible) {
            lastVisible.classList.add('last-visible');
        }
    }

    hideOption(valueOrIndex) {
        if (typeof(valueOrIndex) === "string") {
            const idx = this.options.findIndex(opt => opt.value === valueOrIndex);
            if (idx >= 0) {
                this.hideOption(idx);
            }
        } else {
            if (this.selectedIndex === valueOrIndex) {
                if (this.options.length > this.selectedIndex) {
                    this.selectedIndex = this.selectedIndex + 1;
                } else if (this.selectedIndex > 0) {
                    this.selectedIndex = this.selectedIndex - 1;
                }
            }
            const opt = this.options[valueOrIndex];
            if (opt) {
                opt.disabled = true;
            }

            this.recomputeVisible();
        }
    }

    showOption(valueOrIndex) {
        if (typeof(valueOrIndex) === "string") {
            const idx = this.options.findIndex(opt => opt.value === valueOrIndex);
            if (idx >= 0) {
                this.showOption(idx);
            }
        } else {
            const opt = this.options[valueOrIndex];
            if (opt) {
                opt.disabled = false;
            }
            this.recomputeVisible();
        }
    }

    showAllOptions() {
        this.options.forEach((opt, index) => this.showOption(index));
    }

    get selectedIndex() {
        return this.options.indexOf(this.selectedElement);
    }

    set selectedIndex(idx) {
        this.setSelectedElement(this.options[idx]);
    }

    setSelectedElement(el, noEvent) {
        const prevIndex = this.selectedIndex;
        const prevEl = this.selectedElement;

        if (el === this.selectedElementCopy) {
            return this.setSelectedElement(this.selectedElement);
        }


        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        this.selectedElement = el;
        this.selectedElement.classList.add('selected');

        if (this.value !== this.selectedElement.value) {
            this.value = this.selectedElement.value;
            const newIndex = this.options.indexOf(el);
            if (!noEvent) {
                let event = new SelectionChangedEvent(prevEl, el, prevIndex, newIndex);
                this.dispatchEvent(event);
            }
        }
    }

    expand() {
        if (this.selectedElement) {
            const selectedEl = this.selectedElement;
            this.selectedElementCopy = selectedEl.cloneNode(true);
            this.setupOption(this.selectedElementCopy);
            this.element.insertBefore(this.selectedElementCopy, this.options[0]);
        }
        this.element.classList.add('open');
    }

    collapse() {
        if (this.selectedElementCopy) {
            this.selectedElementCopy.parentNode.removeChild(this.selectedElementCopy);  // TODO: remove event listeners first?
            this.selectedElementCopy = null;
        }

        this.opener = null;
        this.moved = false;
        this.element.classList.remove('open');
    }

    toggle() {
        this.element.classList.toggle('open');
    }

    get isOpen() {
        return this.element.classList.contains('open');
    }

    setState(state) {
        if (state === '') {
            this.setSelectedElement(this.options[0], true);
        } else {
            for (const option of this.options) {
                if (option.value === state) {
                    this.setSelectedElement(option, true);
                    return;
                }
            }
        }
    }

}