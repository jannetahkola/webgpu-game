[![CI Badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fjannetahkola%2Fd6da14282ba971e06fef7bdc92f0b53f%2Fraw%2Fci-badge.json)](https://github.com/jannetahkola/webgpu-game/actions/workflows/node.js.yml)
[![Coverage Badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2Fjannetahkola%2Fc143032e310b793540a6d52cc5f22cd7%2Fraw%2Fcoverage-badge.json)](https://github.com/jannetahkola/webgpu-game/actions/workflows/node.js.yml)

# WebGPU Demo

Trying out the new WebGPU specification in the browser. This is a 3D rendering demo made with the WebGPU TypeScript
definitions for communicating with the GPU, and [wgpu-matrix](https://www.npmjs.com/package/wgpu-matrix) for vector and
matrix math. Keeping runtime dependencies minimal for educational purposes.

> WebGPU is a JavaScript, C++, Rust, and C API that allows portably and efficiently utilizing a device's graphics
> processing unit (GPU). This is achieved with the underlying Vulkan, Metal, or Direct3D 12 system APIs.

More info:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Wikipedia](https://en.wikipedia.org/wiki/WebGPU#:~:text=WebGPU%20is%20a%20JavaScript%2C%20C,JavaScript%20environment%20such%20as%20node)

# Browser Compatibility

A fairly new browser version is required to run the app:

- Chrome/Edge 113+ (Released 2023-05-02)
- As of Safari 18.4, WebGPU needs to be enabled in `Experimental Features`
- Partial WebGPU support is available in Firefox Nightly builds

A more comprehensive WebGPU API browser compatibility list is available
in [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility).

# Development

`npm run dev`

## Testing

`npm run test`

Test files are next to implementations in `*.test.ts` files. The `tests` directory
contains test utilities.
