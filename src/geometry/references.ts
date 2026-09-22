import * as THREE from 'three';
import { materials } from '../materials/library';
import { metresToUnits } from '../scene/spec';
import { markReference } from '../scene/hierarchy';

/**
 * Human scale proxy, 1750 mm tall (adult standing height), 450 mm shoulder width.
 * Review aid for the Scale & Realism Reviewer; never exported.
 */
export function createScaleFigure(): THREE.Object3D {
  const u = metresToUnits;
  const figure = new THREE.Group();
  figure.name = 'REF_ScaleFigure_1750mm';

  // Tapered column body (Three's CapsuleGeometry emits zero-area pole triangles, which QA rejects).
  const bodyTop = u(1.52);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(u(0.2), u(0.14), bodyTop, 20, 1), materials.referenceFigure());
  body.name = 'REF_ScaleFigure_Body';
  body.position.y = bodyTop / 2;
  body.scale.x = 0.225 / 0.2; // 450 mm shoulders, 280 mm depth

  const headRadius = u(0.115); // rests on the body: 1520 mm + 230 mm = 1750 mm
  const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 20, 14), materials.referenceFigure());
  head.name = 'REF_ScaleFigure_Head';
  head.position.y = u(1.75) - headRadius;

  for (const part of [body, head]) {
    part.castShadow = true;
    part.receiveShadow = true;
    figure.add(part);
  }
  return markReference(figure);
}

/** 1 m calibration cube resting on the ground plane. */
export function createCalibrationCube(): THREE.Object3D {
  const size = metresToUnits(1);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), materials.referenceCube());
  cube.name = 'REF_CalibrationCube_1m';
  cube.position.y = size / 2;
  cube.castShadow = true;
  cube.receiveShadow = true;
  return markReference(cube);
}
