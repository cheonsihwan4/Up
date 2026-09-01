export interface PlanetData {
  id: string;
  nameKo: string;
  nameEn: string;
  symbol: string;
  color: string;
  secondaryColor: string;
  glowColor: string;
  orbitColor: string;
  
  // Real astronomical physical parameters
  realMassKg: number;           // Actual mass in kg (e.g. 5.972e24 for Earth)
  realDistanceAU: number;        // Semi-major axis in AU (e.g. 1.0)
  realDistanceKm: number;        // Distance in km (e.g. 149.6e6)
  realRadiusKm: number;          // Mean volumetric radius in km (e.g. 6371)
  realOrbitalPeriodDays: number; // Orbital period in Earth days (e.g. 365.25)
  realOrbitalVelocityKmS: number;// Average orbital velocity in km/s (e.g. 29.78)
  realSurfaceGravityMps2: number;// Surface gravity in m/s^2 (e.g. 9.807)
  realEscapeVelocityKmS: number; // Escape velocity in km/s (e.g. 11.186)
  realRotationHours: number;     // Rotation period in hours (e.g. 23.93)
  averageTempC: number;          // Average surface temperature in Celsius
  moonsCount: number;            // Number of known moons
  atmosphere: string;            // Primary atmospheric constituents
  eccentricity: number;          // Orbital eccentricity (0 = circular)

  // Simulation visuals
  baseVisualRadius: number;      // Visual pixel size base
  ring?: {
    innerRadiusRatio: number;
    outerRadiusRatio: number;
    color: string;
  };

  // Educational content
  description: string;
  gravityComparisonText: string;
  facts: string[];
  explorationHistory: string;
}

export interface PlanetState {
  id: string;
  massMultiplier: number;        // User-adjusted mass multiplier (1.0 = actual)
  distanceMultiplier: number;    // User-adjusted distance multiplier (1.0 = actual)
  currentAngleRad: number;       // Current orbital angle in radians
  currentDistanceAU: number;     // Effective distance in AU
  currentVelocityKmS: number;    // Calculated orbital speed in km/s
  currentGravityForceN: number;  // Gravitational force between Sun & Planet in Newtons
  currentOrbitalPeriodDays: number; // Calculated period with adjusted parameters
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export type ViewMode = '2d' | '3d_isometric' | 'gravity_grid';
export type ScaleMode = 'visual' | 'logarithmic' | 'true_scale';

export interface SimulationSettings {
  isPlaying: boolean;
  simulationSpeedDaysPerSec: number; // Time step speed
  sunMassMultiplier: number;         // 1.0 = actual Sun mass
  gravitationalConstantG: number;    // 6.67430e-11
  viewMode: ViewMode;
  scaleMode: ScaleMode;
  showOrbits: boolean;
  showLabels: boolean;
  showGravityVectors: boolean;
  showVelocityVectors: boolean;
  showTrails: boolean;
  showHabitableZone: boolean;
  showGrid: boolean;
  showDistanceRings: boolean;
  followSelected: boolean;
  trailLength: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  sunMassMultiplier: number;
  planetModifiers?: Record<string, { mass?: number; distance?: number }>;
  timeSpeed?: number;
  highlightPlanetId?: string;
  scientificInsight: string;
}
