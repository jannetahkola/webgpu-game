import type { Prefab } from './prefab.ts';
import { mat3, quat, vec3 } from 'wgpu-matrix';

const mainScenePrefab = {
  name: 'MainScene',
  em: {
    entities: [0, 2, 3, 5, 6],
    singletonEntities: [
      { tag: 'Player', entity: 1 },
      { tag: 'Lighting', entity: 4 },
      { tag: 'Skybox', entity: 7 },
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
            position: vec3.fromValues(-1, 0.4, -2),
            rotation: quat.fromAxisAngle(
              vec3.fromValues(0, 1, 0),
              -Math.PI / 1.1
            ), // todo must not be typed arrays
          },
        },
      },
      {
        entity: 0,
        type: 'ColliderComponent',
        data: {
          collider: {
            type: 'box',
            size: [1, 1, 1],
            center: [0, 0, 0],
            orientation: mat3.identity(),
          },
        },
      },
      {
        entity: 2,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/rubik_cube/rubik_cube.glb',
        },
      },
      {
        entity: 2,
        type: 'TransformComponent',
        data: {
          transform: {
            position: [0.5, 0.4, -2],
            rotation: quat.fromAxisAngle(vec3.fromValues(0, 1, 0), Math.PI / 3),
          },
        },
      },
      {
        entity: 2,
        type: 'ColliderComponent',
        data: {
          collider: {
            type: 'box',
            size: [1, 1, 1],
            center: [0, 0, 0],
            orientation: mat3.identity(),
          },
        },
      },
      {
        entity: 3,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/rubik_cube/rubik_cube.glb',
        },
      },
      {
        entity: 3,
        type: 'TransformComponent',
        data: {
          transform: {
            position: [-1.1, 1.22, -1.9],
            rotation: quat.fromAxisAngle(
              vec3.fromValues(0, 1, 0),
              Math.PI / 3.3
            ),
          },
        },
      },
      {
        entity: 3,
        type: 'ColliderComponent',
        data: {
          collider: {
            type: 'box',
            size: [1, 1, 1],
            center: [0, 0, 0],
            orientation: mat3.identity(),
          },
        },
      },
      {
        entity: 5,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/ground/ground2.glb',
        },
      },
      {
        entity: 5,
        type: 'TransformComponent',
        data: {},
      },
      {
        entity: 5,
        type: 'ColliderComponent',
        data: {
          collider: {
            type: 'mesh',
            ref: './assets/gltf/ground/ground2_collider.glb',
          },
        },
      },
      {
        entity: 6,
        type: 'ModelComponent',
        data: {
          ref: './assets/gltf/banana_crate/banana_crate.glb',
        },
      },
      {
        entity: 6,
        type: 'TransformComponent',
        data: {
          transform: {
            position: vec3.fromValues(0, -0.15, 0),
          },
        },
      },

      // -- SINGLETONS

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
        data: {
          transform: {
            position: vec3.fromValues(0, 1, 0),
          },
        },
      },
      {
        entity: 1,
        type: 'ColliderComponent',
        data: {
          collider: {
            type: 'box',
            size: [1, 1, 1],
            center: [0, 0, 0],
            orientation: mat3.identity(),
          },
        },
      },
      {
        entity: 1,
        type: 'RigidBodyComponent',
        data: {}
      },
      // todo could make default required components somewhere instead of having to define them here
      {
        entity: 4,
        type: 'LightingComponent',
        data: {},
      },
      {
        entity: 4,
        type: 'ShadowComponent',
        data: {
          shadowMapSize: 1024,
        },
      },
      {
        entity: 4,
        type: 'TransformComponent',
        data: {
          transform: {
            position: vec3.fromValues(5, 10, 5),
          },
        },
      },
      {
        entity: 7,
        type: 'SkyboxComponent',
        data: {},
      },
      {
        entity: 7,
        type: 'CubeMapComponent',
        data: {
          ref: './assets/cubemaps/skybox',
        },
      },
    ],
  },
} satisfies Prefab;

export default mainScenePrefab;
