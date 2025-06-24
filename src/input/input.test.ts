import { Input } from './input';
import { type Action, Actions, defaultBindings } from './actions.ts';
import { GlobalWindow } from 'happy-dom';

/// @vitest-environment happy-dom

describe('Input', () => {
  let window: Window;
  let canvas: HTMLCanvasElement;
  let input: Input<Action>;

  const simulatePointerLockChange = (canvas?: HTMLCanvasElement) => {
    Object.defineProperty(window.document, 'pointerLockElement', {
      configurable: true,
      get: () => canvas,
    });
    window.document.dispatchEvent(new Event('pointerlockchange'));
  };

  const simulateKeyDown = (code: string) => {
    window.document.dispatchEvent(new KeyboardEvent('keydown', { code }));
  };

  const simulateKeyUp = (code: string) => {
    window.document.dispatchEvent(new KeyboardEvent('keyup', { code }));
  };

  beforeEach(() => {
    window = new GlobalWindow() as unknown as Window;
    canvas = window.document.createElement(
      'canvas'
    ) as unknown as HTMLCanvasElement;
    input = new Input<Action>({
      canvas,
      window,
      initialBindings: defaultBindings(),
    });
  });

  it('registers event listeners when observe() called', () => {
    const addEventListenerToWindowSpy = vi.spyOn(
      window.document,
      'addEventListener'
    );
    const addEventListenerToCanvasSpy = vi.spyOn(canvas, 'addEventListener');

    expect(addEventListenerToWindowSpy).not.toHaveBeenCalled();
    expect(addEventListenerToCanvasSpy).not.toHaveBeenCalled();

    input.observe();

    expect(addEventListenerToWindowSpy).toHaveBeenCalledWith(
      'pointerlockchange',
      expect.any(Function)
    );
    expect(addEventListenerToWindowSpy).toHaveBeenCalledWith(
      'pointerlockerror',
      expect.any(Function)
    );
    expect(addEventListenerToCanvasSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    );
  });

  it('toggles input on `pointerlockchange` events', () => {
    const enableInputSpy = vi.spyOn(input, 'enableInput');
    const disableInputSpy = vi.spyOn(input, 'disableInput');

    input.observe();
    simulatePointerLockChange(canvas);

    expect(enableInputSpy).toHaveBeenCalledOnce();

    simulatePointerLockChange();

    expect(disableInputSpy).toHaveBeenCalledOnce();
  });

  it('updates pointer delta on `mousemove` events', () => {
    input.observe();
    simulatePointerLockChange(canvas);
    window.document.dispatchEvent(
      new MouseEvent('mousemove', { movementX: 10, movementY: 20 })
    );
    input.update();

    expect(input.getPointerDeltaX()).toBe(10);
    expect(input.getPointerDeltaY()).toBe(20);

    input.update();

    expect(input.getPointerDeltaX()).toBe(0);
    expect(input.getPointerDeltaY()).toBe(0);
  });

  it('updates press state on `keydown` and `keyup` events', () => {
    input.observe();
    simulatePointerLockChange(canvas);

    expect(input.isPressed(Actions.moveLeft)).toBe(false);
    expect(input.isPressed(Actions.moveBackward)).toBe(false);

    simulateKeyDown('KeyA');
    simulateKeyDown('KeyS');

    expect(input.isPressed(Actions.moveLeft)).toBe(true);
    expect(input.isPressed(Actions.moveBackward)).toBe(true);
    expect(input.isPressed(Actions.moveForward)).toBe(false);
    expect(input.isPressed(Actions.moveRight)).toBe(false);

    simulateKeyUp('KeyA');
    simulateKeyUp('KeyS');
    simulateKeyDown('KeyW');
    simulateKeyDown('KeyD');

    expect(input.isPressed(Actions.moveLeft)).toBe(false);
    expect(input.isPressed(Actions.moveBackward)).toBe(false);
    expect(input.isPressed(Actions.moveForward)).toBe(true);
    expect(input.isPressed(Actions.moveRight)).toBe(true);
  });

  it('updates double press state on `keydown` events', () => {
    input.observe();
    simulatePointerLockChange(canvas);

    simulateKeyDown('KeyA');
    input.update();

    expect(input.isDoublePressed(Actions.moveLeft)).toBe(false);

    simulateKeyDown('KeyA');
    input.update();

    expect(input.isDoublePressed(Actions.moveLeft)).toBe(true);

    input.update(); // should clean up for next frame

    expect(input.isDoublePressed(Actions.moveLeft)).toBe(false);
  });
});
