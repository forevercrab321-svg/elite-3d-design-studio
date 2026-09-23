/**
 * Size classes (design §07). An object is absorbable when player power (diameter, m)
 * ≥ its requiredPower, which defaults to its class threshold.
 */
export interface SizeClass {
  id: number;
  label: string;
  requiredPower: number;
}

export const SIZE_CLASSES: readonly SizeClass[] = [
  { id: 0, label: 'Dust & scrap', requiredPower: 0 },
  { id: 1, label: 'Cans & bricks', requiredPower: 0.3 },
  { id: 2, label: 'Boxes & bags', requiredPower: 0.6 },
  { id: 3, label: 'Bins & street furniture', requiredPower: 0.9 },
  { id: 4, label: 'Dumpsters & machines', requiredPower: 1.5 },
  { id: 5, label: 'Vehicles', requiredPower: 3.0 },
  { id: 6, label: 'Trucks & containers', requiredPower: 5.0 },
  { id: 7, label: 'Walls & garages', requiredPower: 8.0 },
  { id: 8, label: 'Buildings', requiredPower: 14 },
  { id: 9, label: 'Large buildings', requiredPower: 25 },
  { id: 10, label: 'City blocks', requiredPower: 50 },
];
