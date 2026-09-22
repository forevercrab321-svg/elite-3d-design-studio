import { parse } from 'yaml';
import specSource from '../../model-spec.yaml?raw';

/** A named, lockable camera. Lens and sensor in millimetres, positions in scene units. */
export interface ViewSpec {
  position: [number, number, number];
  target: [number, number, number];
  lens: number;
  sensor?: number;
  locked?: boolean;
}

export interface ModelSpec {
  project: {
    name: string | null;
    type: string | null;
    units: 'meters' | 'centimeters' | 'millimeters';
    up_axis: 'Y';
  };
  delivery: {
    targets: string[];
    performance: {
      max_triangles: number | null;
      max_draw_calls: number | null;
      max_texture_size: number;
    };
  };
  site: { ground_size: number };
  references: { scale_figure: boolean; calibration_cube: boolean };
  render: { resolution: [number, number]; exposure: number };
  camera: { views: Record<string, ViewSpec> };
  lighting: { sun_azimuth_deg: number; sun_elevation_deg: number; sun_intensity: number; sky_intensity: number };
  systems: Record<string, Record<string, unknown>>;
}

export const spec = parse(specSource) as ModelSpec;

/** Metres per scene unit, so real-world reference objects stay correct in any unit system. */
export function metresToUnits(m: number): number {
  switch (spec.project.units) {
    case 'millimeters':
      return m * 1000;
    case 'centimeters':
      return m * 100;
    default:
      return m;
  }
}
