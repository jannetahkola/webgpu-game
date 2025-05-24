import requestUserAgentClientHints from './browser/userAgentClientHints.ts';
import requestWebGPU from './browser/webGPU.ts';
import { Viewport, ViewportEvents } from './viewport/viewport.ts';
import MainRenderer from './rendering/renderers/mainRenderer.ts';
import RendererFactory from './rendering/renderers/rendererFactory.ts';
import { defaultBindings, GameInput } from './input/actions.ts';
import PrefabSceneLoader from './scenes/prefabSceneLoader.ts';
import mainScenePrefab from './scenes/prefabs/mainScenePrefab.ts';
import ComponentRegistry from './ecs/components/componentRegistry.ts';
import ResourceManager from './resources/resourceManager.ts';
import ResourceManagerFactory from './resources/resourceManagerFactory.ts';

async function main() {
  const canvas = window.document.createElement('canvas');
  window.document.body.appendChild(canvas);

  const { device, context } = await requestWebGPU(window, canvas);
  await requestUserAgentClientHints(window).then(console.log);

  const initialResolution = { w: 1280, h: 720 };
  const viewport = new Viewport({ device, context, initialResolution });

  const initialBindings = defaultBindings();
  const input = new GameInput({
    canvas: viewport.getCanvas(),
    window,
    initialBindings,
  });

  const resourceManager = new ResourceManager(new ResourceManagerFactory());

  const rendererFactory = new RendererFactory();
  const rendererOptions = { clearValue: [0.1, 0.1, 0.1, 1], multisampling: 4 };
  const renderer = new MainRenderer({
    device,
    viewport,
    rendererFactory,
    resourceManager,
    options: rendererOptions,
  });

  ComponentRegistry.registerComponents(
    import.meta.glob('./ecs/components/*Component.ts', {
      eager: true,
    })
  );

  const scene = await new PrefabSceneLoader(resourceManager).load(
    device,
    mainScenePrefab,
    input
  );

  const onAspectScaleChange = () => {
    console.log('aspect scale change', performance.now());
    renderer.queueAspectScaleChange();
  };

  const onResolutionChange = () => {
    console.log('resolution change', performance.now());
    renderer.queueResolutionChange();
  };

  viewport.on(ViewportEvents.aspectScaleChange, onAspectScaleChange);
  viewport.on(ViewportEvents.resolutionChange, onResolutionChange);

  viewport.observe(window);
  input.observe();

  Object.assign(window, {
    setResolution(w: number, h: number) {
      viewport.setResolution(w, h);
    },
    setMultisamplingSampleCount(count: number) {
      renderer.setMultisamplingSampleCount(count);
    },
  });

  let last = performance.now();

  const update = (ts: DOMHighResTimeStamp) => {
    const dt = (ts - last) * 0.001;
    last = ts;

    viewport.update();
    input.update();
    scene.update(dt);
    renderer.render(scene.em);

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

void main().catch(console.error);
