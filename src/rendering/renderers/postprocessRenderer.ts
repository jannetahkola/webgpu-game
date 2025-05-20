import postprocessBlitPipeline from '../pipelines/postprocessBlitPipeline.ts';

export default class PostProcessRenderer {
  #blitAspectScaleArray?: Float32Array;
  #blitAspectScaleUniformBuffer?: GPUBuffer;
  #blitSampler?: GPUSampler;
  #blitBindGroup?: GPUBindGroup;

  render(_pass: GPURenderPassEncoder) {}

  toCanvas(
    device: GPUDevice,
    encoder: GPUCommandEncoder,
    src: GPUTexture,
    dst: GPUTexture
  ) {
    this.#blitAspectScaleUniformBuffer ??= device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#blitSampler ??= device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: dst.createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: [0, 0, 0, 1],
        },
      ],
    });

    const pipeline = postprocessBlitPipeline(device, dst.format);

    this.#blitBindGroup ??= device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.#blitAspectScaleUniformBuffer,
          },
        },
        {
          binding: 1,
          resource: src.createView(),
        },
        {
          binding: 2,
          resource: this.#blitSampler,
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, this.#blitBindGroup);
    pass.draw(3);
    pass.end();
  }

  onAspectScaleChange(
    device: GPUDevice,
    aspectScale: { x: number; y: number }
  ) {
    this.#blitAspectScaleArray ??= new Float32Array(2);
    this.#blitAspectScaleArray[0] = aspectScale.x;
    this.#blitAspectScaleArray[1] = aspectScale.y;

    if (this.#blitAspectScaleUniformBuffer) {
      device.queue.writeBuffer(
        this.#blitAspectScaleUniformBuffer,
        0,
        this.#blitAspectScaleArray.buffer
      );
    }
  }

  onTexturesDestroyed() {
    this.#blitBindGroup = undefined;
  }
}
