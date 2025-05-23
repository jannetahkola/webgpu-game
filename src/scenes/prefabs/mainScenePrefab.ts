import type { Prefab } from './prefab.ts';
import { quat, vec3 } from 'wgpu-matrix';

const mainScenePrefab = {
  name: 'MainScene',
  em: {
    entities: [0, 2, 3],
    singletonEntities: [
      { tag: 'Player', entity: 1 },
      { tag: 'Lighting', entity: 4 },
    ],
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
            position: vec3.fromValues(0, 1, -2),
            rotation: quat.fromAxisAngle(
              vec3.fromValues(0, 1, 0),
              -Math.PI / 1.1
            ), // todo must not be typed arrays
          },
        },
      },
      // todo why not visible - fix
      // {
      //   entity: 2,
      //   type: 'ModelComponent',
      //   data: {
      //     ref: './assets/gltf/rubik_cube/rubik_cube.glb',
      //   },
      // },
      // {
      //   entity: 2,
      //   type: 'TransformComponent',
      //   data: {
      //     transform: {
      //       position: [1, 0, -3],
      //       rotation: quat.fromAxisAngle(vec3.fromValues(0, 1, 0), Math.PI / 3),
      //     },
      //   },
      // },
      {
        entity: 2,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/ground/ground2.glb',
        },
      },
      {
        entity: 2,
        type: 'TransformComponent',
        data: {},
      },
      {
        entity: 1,
        type: 'PlayerControllerComponent',
        data: {},
      },

      // -- SINGLETONS

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
        data: {
          transform: {
            position: vec3.fromValues(0, 1, 0),
          },
        },
      },
      {
        entity: 4,
        type: 'LightingComponent',
        data: {},
      },
    ],
  },
} satisfies Prefab;

export default mainScenePrefab;
