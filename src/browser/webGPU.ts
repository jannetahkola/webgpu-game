export default async function requestWebGPU(
  window: Window,
  canvas: HTMLCanvasElement
) {
  if (!('gpu' in window.navigator)) {
    throw new Error('WebGPU API not available - `navigator.gpu` = undefined');
  }

  const adapter = await window.navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    throw new Error('WebGPU API not available - `device` = undefined');
  }

  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('WebGPU API not available - `context` = undefined');
  }

  context.configure({
    device,
    format: window.navigator.gpu.getPreferredCanvasFormat(),
  });

  return { device, context };
}
