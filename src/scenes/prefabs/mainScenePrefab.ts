import type { Prefab } from './prefab.ts';

const mainScenePrefab = {
  name: 'MainScene',
  em: {
    next: 2,
    entities: [0],
    singletonEntities: [{ tag: 'Player', entity: 1 }],
    components: [
      {
        entity: 0,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/rubik_cube/rubik_cube.glb',
        },
      },
      {
        entity: 0,
        type: 'TransformComponent',
        data: {
          transform: {
            position: [0, 0, -2],
          },
        },
      },
      {
        entity: 1,
        type: 'PlayerControllerComponent',
        data: {},
      },
      {
        entity: 1,
        type: 'CameraComponent',
        data: {
          cameraType: 'FirstPersonCamera',
        },
      },
      {
        entity: 1,
        type: 'TransformComponent',
        data: {},
      },
    ],
  },
} satisfies Prefab;

export default mainScenePrefab;
