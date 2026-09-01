// Physical Constants (SI Units)
export const G_CONSTANT = 6.67430e-11; // N m^2 / kg^2
export const SUN_MASS_KG = 1.98847e30; // kg
export const AU_IN_METERS = 1.495978707e11; // meters
export const AU_IN_KM = 1.495978707e8; // km
export const SECONDS_PER_DAY = 86400; // seconds

/**
 * Calculate gravitational force between two masses at distance r
 * F = G * (m1 * m2) / r^2
 * @param mass1Kg Central body mass in kg
 * @param mass2Kg Orbiting body mass in kg
 * @param distanceMeters Distance between centers of mass in meters
 * @returns Force in Newtons (N)
 */
export function calculateGravitationalForce(
  mass1Kg: number,
  mass2Kg: number,
  distanceMeters: number
): number {
  if (distanceMeters <= 0) return 0;
  return (G_CONSTANT * mass1Kg * mass2Kg) / (distanceMeters * distanceMeters);
}

/**
 * Calculate stable circular orbital velocity
 * v = sqrt( (G * M_central) / r )
 * @param centralMassKg Mass of the central star in kg
 * @param distanceMeters Orbital radius in meters
 * @returns Orbital speed in km/s
 */
export function calculateOrbitalVelocityKmS(
  centralMassKg: number,
  distanceMeters: number
): number {
  if (distanceMeters <= 0) return 0;
  const velocityMps = Math.sqrt((G_CONSTANT * centralMassKg) / distanceMeters);
  return velocityMps / 1000;
}

/**
 * Calculate orbital period using Kepler's Third Law
 * T = 2 * PI * sqrt( r^3 / (G * M_central) )
 * @param centralMassKg Central star mass in kg
 * @param distanceMeters Orbital radius in meters
 * @returns Period in Earth days
 */
export function calculateOrbitalPeriodDays(
  centralMassKg: number,
  distanceMeters: number
): number {
  if (distanceMeters <= 0 || centralMassKg <= 0) return 0;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(distanceMeters, 3) / (G_CONSTANT * centralMassKg));
  return periodSeconds / SECONDS_PER_DAY;
}

/**
 * Calculate surface gravity on a planetary body
 * g = G * M / R^2
 * @param massKg Planet mass in kg
 * @param radiusKm Planet radius in km
 * @returns Surface acceleration in m/s^2
 */
export function calculateSurfaceGravity(massKg: number, radiusKm: number): number {
  if (radiusKm <= 0) return 0;
  const radiusMeters = radiusKm * 1000;
  return (G_CONSTANT * massKg) / (radiusMeters * radiusMeters);
}

/**
 * Calculate escape velocity from planet surface
 * v_esc = sqrt( 2 * G * M / R )
 * @param massKg Planet mass in kg
 * @param radiusKm Planet radius in km
 * @returns Escape velocity in km/s
 */
export function calculateEscapeVelocityKmS(massKg: number, radiusKm: number): number {
  if (radiusKm <= 0) return 0;
  const radiusMeters = radiusKm * 1000;
  const vMps = Math.sqrt((2 * G_CONSTANT * massKg) / radiusMeters);
  return vMps / 1000;
}

/**
 * Generate curve data points for Gravity vs Distance (F vs r)
 * For visualizing the Inverse-Square Law (1/r^2)
 */
export function generateDistanceForceCurve(
  centralMassKg: number,
  planetMassKg: number,
  currentDistanceAU: number,
  pointsCount = 60
): Array<{ distanceAU: number; forceN: number; relativeForce: number }> {
  const minAU = Math.max(0.1, currentDistanceAU * 0.2);
  const maxAU = currentDistanceAU * 3.5;
  const step = (maxAU - minAU) / (pointsCount - 1);
  
  const currentForce = calculateGravitationalForce(
    centralMassKg,
    planetMassKg,
    currentDistanceAU * AU_IN_METERS
  );

  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const distAU = minAU + i * step;
    const force = calculateGravitationalForce(
      centralMassKg,
      planetMassKg,
      distAU * AU_IN_METERS
    );
    points.push({
      distanceAU: Number(distAU.toFixed(2)),
      forceN: force,
      relativeForce: currentForce > 0 ? force / currentForce : 1,
    });
  }

  return points;
}

/**
 * Generate curve data points for Gravity vs Planet Mass (F vs m)
 * For visualizing the Linear Proportional Law (F ~ m)
 */
export function generateMassForceCurve(
  centralMassKg: number,
  realPlanetMassKg: number,
  currentMultiplier: number,
  distanceAU: number,
  pointsCount = 50
): Array<{ multiplier: number; massKg: number; forceN: number }> {
  const minMult = 0.1;
  const maxMult = Math.max(5.0, currentMultiplier * 2);
  const step = (maxMult - minMult) / (pointsCount - 1);
  const distanceMeters = distanceAU * AU_IN_METERS;

  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const mult = minMult + i * step;
    const mass = realPlanetMassKg * mult;
    const force = calculateGravitationalForce(centralMassKg, mass, distanceMeters);
    points.push({
      multiplier: Number(mult.toFixed(2)),
      massKg: mass,
      forceN: force,
    });
  }

  return points;
}

/**
 * Format large numbers in readable scientific notation with Korean unit help
 */
export function formatScientific(value: number, decimals = 2): { mantissa: string; exponent: number; formatted: string } {
  if (value === 0) return { mantissa: '0', exponent: 0, formatted: '0' };
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const man = value / Math.pow(10, exp);
  return {
    mantissa: man.toFixed(decimals),
    exponent: exp,
    formatted: `${man.toFixed(decimals)} × 10^${exp}`,
  };
}

/**
 * Format Newtons into human readable scale (e.g. 10^22 N)
 */
export function formatForceKorean(forceN: number): string {
  if (forceN >= 1e24) {
    return `${(forceN / 1e24).toFixed(3)} × 10²⁴ N (요타뉴턴)`;
  }
  if (forceN >= 1e21) {
    return `${(forceN / 1e22).toFixed(3)} × 10²² N (섹스틸리언)`;
  }
  if (forceN >= 1e18) {
    return `${(forceN / 1e18).toFixed(3)} × 10¹⁸ N (엑사뉴턴)`;
  }
  return `${forceN.toExponential(3)} N`;
}
