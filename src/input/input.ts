import { vec2, type Vec2 } from 'wgpu-matrix';

type PointerState = {
  isLocked: boolean;
  deltaNext: Vec2;
  delta: Vec2;
};

type KeyState = {
  pressed: boolean;
  // Timestamp when the key was last pressed. Updated
  // on new keydown events where `e.repeat = false`.
  lastPressed: number;
};

function defaultPointerState(): PointerState {
  return {
    isLocked: false,
    deltaNext: vec2.create(),
    delta: vec2.create(),
  };
}

// prettier-ignore
const suppressedKeys = [
  'Tab',          // moves focus between elements
  'Enter',        // submits forms, might activate focused elements
  'Space',        // scrolls the page down
  'ArrowUp',      // scrolls the page up
  'ArrowDown',    // scrolls the page down
  'ArrowLeft',    // might trigger history back or scroll
  'ArrowRight',   // same as ArrowLeft
  // 'Escape' unlocks the pointer, but this cannot be suppressed
] as readonly string[];

class Input<T extends string> {
  readonly #canvas: HTMLCanvasElement;
  readonly #window: Window;
  readonly #pointer: PointerState = defaultPointerState();
  readonly #keys: Map<string, KeyState> = new Map(); // semi-dynamic -> map
  readonly #bindings: Record<T, string>; // keys are fixed -> record
  readonly #listeners = {
    onpointerlockchange: (_e: Event) => {
      const document = this.#window.document;
      this.#pointer.isLocked = document.pointerLockElement === this.#canvas;
      if (this.#pointer.isLocked) {
        this.enableInput(document);
      } else {
        this.disableInput(document);
      }
    },
    onpointerlockerror: (e: Event) => console.error('pointer lock error', e),
    oncanvasclick: () => void this.#canvas.requestPointerLock().catch(() => {}),
    onmousemove: (e: MouseEvent) => {
      this.#pointer.deltaNext[0] = e.movementX;
      this.#pointer.deltaNext[1] = e.movementY;
    },
    onkeydown: (e: KeyboardEvent) => {
      if (suppressedKeys.includes(e.code)) {
        e.preventDefault();
      }

      const state = this.#keys.get(e.code) ?? this.#defaultKeyState(e.code);
      state.pressed = true;

      if (!e.repeat) {
        state.lastPressed = performance.now();
      }
    },
    onkeyup: (e: KeyboardEvent) => {
      const state = this.#keys.get(e.code) ?? this.#defaultKeyState(e.code);
      state.pressed = false;
      state.lastPressed = 0;
    },
  };

  constructor({
    canvas,
    window,
    initialBindings,
  }: {
    canvas: HTMLCanvasElement;
    window: Window;
    initialBindings: Record<T, string>;
  }) {
    this.#canvas = canvas;
    this.#window = window;
    this.#bindings = { ...initialBindings };
  }

  getPointerDeltaX() {
    return this.#pointer.delta[0];
  }

  getPointerDeltaY() {
    return this.#pointer.delta[1];
  }

  // Returns `true` if the action is currently active. Prefer
  // using a constant from {@link Actions} instead of string
  // literals.
  isActive(action: T) {
    return this.#keys.get(this.#bindings[action])?.pressed ?? false;
  }

  update() {
    vec2.clone(this.#pointer.deltaNext, this.#pointer.delta);
    vec2.zero(this.#pointer.deltaNext);
  }

  observe() {
    this.#window.document.addEventListener(
      'pointerlockchange',
      this.#listeners.onpointerlockchange
    );
    this.#window.document.addEventListener(
      'pointerlockerror',
      this.#listeners.onpointerlockerror
    );
    this.#canvas.addEventListener('click', this.#listeners.oncanvasclick);
  }

  enableInput(document: Document) {
    document.addEventListener('mousemove', this.#listeners.onmousemove);
    document.addEventListener('keydown', this.#listeners.onkeydown);
    document.addEventListener('keyup', this.#listeners.onkeyup);
  }

  disableInput(document: Document) {
    document.removeEventListener('mousemove', this.#listeners.onmousemove);
    document.removeEventListener('keydown', this.#listeners.onkeydown);
    document.removeEventListener('keyup', this.#listeners.onkeyup);
  }

  destroy() {}

  #defaultKeyState(code: string): KeyState {
    const state = {
      pressed: true,
      lastPressed: performance.now(),
    };
    this.#keys.set(code, state);
    return state;
  }
}

export { Input };
