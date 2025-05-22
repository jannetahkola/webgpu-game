import { expect } from 'vitest';

expect.extend({
  toBeFloat32ArrayCloseTo(a: Float32Array, b: Float32Array, numDigits = 4) {
    if (a.length !== b.length) {
      return {
        pass: false,
        message: () => `Length mismatch: ${a.length} vs ${b.length}`,
      };
    }

    for (let i = 0; i < a.length; i++) {
      const pass = Math.abs(a[i] - b[i]) < Math.pow(10, -numDigits);
      if (!pass) {
        return {
          pass: false,
          message: () =>
            `Element at index ${i} differs: ${a[i]} vs ${b[i]}, diff: ${a[i] - b[i]}`,
          actual: String(a),
          expected: String(b),
        };
      }
    }

    return {
      pass: true,
      message: () => 'Arrays are close enough',
    };
  },
});
