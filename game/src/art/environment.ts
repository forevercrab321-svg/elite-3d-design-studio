import * as THREE from 'three';

/**
 * Late-afternoon sky (design §28): gradient dome with sun disc and halo, plus an
 * environment map baked FROM that sky so every metal, glass and clearcoat surface
 * reflects the same light the scene is lit by.
 */
export const SUN_DIRECTION = new THREE.Vector3(-0.55, 0.42, 0.72).normalize(); // from the south-west, ~25° up

const SKY = {
  top: new THREE.Color(0x4f7fb8),
  mid: new THREE.Color(0xa9c3dc),
  horizon: new THREE.Color(0xf1d9b8),
  ground: new THREE.Color(0x6f675c),
  sun: new THREE.Color(0xfff0d0),
};

export const FOG_COLOR = new THREE.Color(0xdcd3c4);

export function createSkyDome(radius = 900): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    name: 'MAT_SkyDome',
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: SKY.top },
      uMid: { value: SKY.mid },
      uHorizon: { value: SKY.horizon },
      uGround: { value: SKY.ground },
      uSun: { value: SKY.sun },
      uSunDir: { value: SUN_DIRECTION },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHorizon, uGround, uSun, uSunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = h > 0.0
          ? mix(mix(uHorizon, uMid, smoothstep(0.0, 0.18, h)), uTop, smoothstep(0.15, 0.85, h))
          : mix(uHorizon, uGround, smoothstep(0.0, 0.08, -h));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSun * (pow(s, 1200.0) * 6.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.12);
        // warm haze band toward the sun side of the horizon
        col += vec3(0.25, 0.14, 0.05) * pow(s, 2.0) * (1.0 - smoothstep(0.0, 0.3, abs(h)));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat);
  dome.name = 'ENV_SkyDome';
  dome.frustumCulled = false;
  dome.renderOrder = -1000;
  return dome;
}

/** Bake a PMREM environment from the sky (plus a dark ground disc so reflections have a horizon). */
export function bakeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const envScene = new THREE.Scene();
  envScene.add(createSkyDome(50));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(49, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3e3b37 }));
  ground.position.y = -0.5;
  envScene.add(ground);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();
  return rt.texture;
}
