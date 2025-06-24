import { vec2, type Vec2 } from 'wgpu-matrix';

type PointerState = {
  isLocked: boolean;
  deltaNext: Vec2;
  delta: Vec2;
};

type DoublePressState = {
  flagsNext: Record<string, boolean>;
  flags: Record<string, boolean>;
};

type KeyState = {
  pressed: boolean;
  // Timestamp when the key was last pressed. Updated
  // on new keydown events where `e.repeat = false`.
  lastPressed: number;
  lastReleased: number;
  pressCount: number;
};

function defaultPointerState(): PointerState {
  return {
    isLocked: false,
    deltaNext: vec2.create(),
    delta: vec2.create(),
  };
}

function defaultDoublePressState(): DoublePressState {
  return {
    flagsNext: {},
    flags: {},
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

// Maximum time between two key presses for the second one to be
// considered a double press.
const doublePressThresholdMs = 250;

class Input<T extends string> {
  readonly #canvas: HTMLCanvasElement;
  readonly #window: Window;
  readonly #pointer = defaultPointerState();
  readonly #keys = new Map<string, KeyState>(); // semi-dynamic -> map // todo check perf
  readonly #bindings: Record<T, string>; // keys are fixed -> record
  readonly #doublePresses = defaultDoublePressState();
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
        const now = performance.now();

        // detect double presses
        const lastPressedDelta = now - state.lastPressed;
        const isDouble =
          state.pressCount === 1 && lastPressedDelta <= doublePressThresholdMs;
        this.#doublePresses.flagsNext[e.code] = isDouble;
        state.pressCount = isDouble ? 0 : 1;

        state.lastPressed = now;
      }
    },
    onkeyup: (e: KeyboardEvent) => {
      const state = this.#keys.get(e.code) ?? this.#defaultKeyState(e.code);
      state.pressed = false;
      state.lastReleased = performance.now();
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
  isPressed(action: T) {
    return this.#keys.get(this.#bindings[action])?.pressed ?? false;
  }

  isDoublePressed(action: T) {
    const keyCode: string = this.#bindings[action];
    return this.#doublePresses.flags[keyCode] ?? false;
  }

  // justPressed(action: T, threshold = 250) {
  //   const state = this.#keys.get(this.#bindings[action]);
  //   if (!state) return false;
  //   return performance.now() - state.lastPressed <= threshold;
  // }

  getKeyState(action: T) {
    return this.#keys.get(this.#bindings[action]);
  }

  update() {
    vec2.clone(this.#pointer.deltaNext, this.#pointer.delta);
    vec2.zero(this.#pointer.deltaNext);

    for (const key in this.#doublePresses.flagsNext) {
      this.#doublePresses.flags[key] = this.#doublePresses.flagsNext[key];
      this.#doublePresses.flagsNext[key] = false;
    }
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
    const state: KeyState = {
      pressed: true,
      lastPressed: -Infinity,
      lastReleased: -Infinity,
      pressCount: 0,
    };
    this.#keys.set(code, state);
    return state;
  }
}

export { Input };
