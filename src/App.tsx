import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanetData, PlanetState, SimulationSettings, PresetScenario } from './types';
import { PLANETS, SUN_DATA, PRESET_SCENARIOS } from './data/planets';
import {
  calculateGravitationalForce,
  calculateOrbitalVelocityKmS,
  calculateOrbitalPeriodDays,
  AU_IN_METERS,
} from './physics/gravityEngine';
import { Navbar } from './components/Navbar';
import { PlanetSelectorBar } from './components/PlanetSelectorBar';
import { SimulatorCanvas } from './components/SimulatorCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { PlanetInspector } from './components/PlanetInspector';
import { ComparisonModal } from './components/ComparisonModal';
import { GuideModal } from './components/GuideModal';

export default function App() {
  // Initial Planet States Map
  const [planetStates, setPlanetStates] = useState<Record<string, PlanetState>>(() => {
    const initial: Record<string, PlanetState> = {};
    PLANETS.forEach((planet, index) => {
      // Distribute initial angles nicely
      const initialAngle = (index * (Math.PI * 2)) / PLANETS.length;
      const initialDistMeters = planet.realDistanceAU * AU_IN_METERS;
      const initialForce = calculateGravitationalForce(
        SUN_DATA.realMassKg,
        planet.realMassKg,
        initialDistMeters
      );
      const initialVelocity = calculateOrbitalVelocityKmS(
        SUN_DATA.realMassKg,
        initialDistMeters
      );
      const initialPeriod = calculateOrbitalPeriodDays(
        SUN_DATA.realMassKg,
        initialDistMeters
      );

      initial[planet.id] = {
        id: planet.id,
        massMultiplier: 1.0,
        distanceMultiplier: 1.0,
        currentAngleRad: initialAngle,
        currentDistanceAU: planet.realDistanceAU,
        currentVelocityKmS: initialVelocity,
        currentGravityForceN: initialForce,
        currentOrbitalPeriodDays: initialPeriod,
        trail: [],
      };
    });
    return initial;
  });

  // Global Simulation Settings
  const [settings, setSettings] = useState<SimulationSettings>({
    isPlaying: true,
    simulationSpeedDaysPerSec: 30, // 30 days per real second (smooth standard)
    sunMassMultiplier: 1.0,
    gravitationalConstantG: 6.6743e-11,
    viewMode: '2d',
    scaleMode: 'visual',
    showOrbits: true,
    showLabels: true,
    showGravityVectors: true,
    showVelocityVectors: true,
    showTrails: true,
    showHabitableZone: true,
    showGrid: false,
    showDistanceRings: true,
    followSelected: false,
    trailLength: 50,
  });

  const [elapsedDays, setElapsedDays] = useState<number>(0);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>('earth');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('standard');
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Physics animation loop ref
  const lastTimeRef = useRef<number | null>(null);

  // Helper to update individual planet state
  const handleUpdatePlanetState = useCallback(
    (planetId: string, updates: Partial<PlanetState>) => {
      setPlanetStates((prev) => {
        const current = prev[planetId];
        if (!current) return prev;
        const planet = PLANETS.find((p) => p.id === planetId);
        if (!planet) return prev;

        const newMassMult = updates.massMultiplier ?? current.massMultiplier;
        const newDistMult = updates.distanceMultiplier ?? current.distanceMultiplier;

        const effMass = planet.realMassKg * newMassMult;
        const effDistAU = planet.realDistanceAU * newDistMult;
        const effDistMeters = effDistAU * AU_IN_METERS;
        const sunMass = SUN_DATA.realMassKg * settings.sunMassMultiplier;

        const newForce = calculateGravitationalForce(sunMass, effMass, effDistMeters);
        const newVelocity = calculateOrbitalVelocityKmS(sunMass, effDistMeters);
        const newPeriod = calculateOrbitalPeriodDays(sunMass, effDistMeters);

        return {
          ...prev,
          [planetId]: {
            ...current,
            ...updates,
            massMultiplier: newMassMult,
            distanceMultiplier: newDistMult,
            currentDistanceAU: effDistAU,
            currentVelocityKmS: newVelocity,
            currentGravityForceN: newForce,
            currentOrbitalPeriodDays: newPeriod,
          },
        };
      });
    },
    [settings.sunMassMultiplier]
  );

  // Helper to reset a specific planet to standard astronomy values
  const handleResetPlanetState = useCallback((planetId: string) => {
    handleUpdatePlanetState(planetId, {
      massMultiplier: 1.0,
      distanceMultiplier: 1.0,
    });
  }, [handleUpdatePlanetState]);

  // Update Sun Mass multiplier
  const handleUpdateSunMass = useCallback((multiplier: number) => {
    setSettings((prev) => ({ ...prev, sunMassMultiplier: multiplier }));
    // Recalculate all planets forces and velocities
    setPlanetStates((prev) => {
      const next: Record<string, PlanetState> = {};
      const sunMass = SUN_DATA.realMassKg * multiplier;

      (Object.entries(prev) as [string, PlanetState][]).forEach(([id, st]) => {
        const planet = PLANETS.find((p) => p.id === id);
        if (!planet) return;
        const effMass = planet.realMassKg * st.massMultiplier;
        const effDistMeters = planet.realDistanceAU * st.distanceMultiplier * AU_IN_METERS;

        next[id] = {
          ...st,
          currentVelocityKmS: calculateOrbitalVelocityKmS(sunMass, effDistMeters),
          currentGravityForceN: calculateGravitationalForce(sunMass, effMass, effDistMeters),
          currentOrbitalPeriodDays: calculateOrbitalPeriodDays(sunMass, effDistMeters),
        };
      });
      return next;
    });
  }, []);

  // Global Scenario Selection
  const handleSelectScenario = useCallback((scenario: PresetScenario) => {
    setActiveScenarioId(scenario.id);
    handleUpdateSunMass(scenario.sunMassMultiplier);

    if (scenario.timeSpeed) {
      setSettings((prev) => ({ ...prev, simulationSpeedDaysPerSec: scenario.timeSpeed || 30 }));
    }

    if (scenario.highlightPlanetId) {
      setSelectedPlanetId(scenario.highlightPlanetId);
    }

    // Reset or apply specific modifiers
    setPlanetStates((prev) => {
      const next = { ...prev };
      PLANETS.forEach((planet) => {
        const mod = scenario.planetModifiers?.[planet.id];
        const massMult = mod?.mass ?? 1.0;
        const distMult = mod?.distance ?? 1.0;

        const effMass = planet.realMassKg * massMult;
        const effDistAU = planet.realDistanceAU * distMult;
        const effDistMeters = effDistAU * AU_IN_METERS;
        const sunMass = SUN_DATA.realMassKg * scenario.sunMassMultiplier;

        next[planet.id] = {
          ...next[planet.id],
          massMultiplier: massMult,
          distanceMultiplier: distMult,
          currentDistanceAU: effDistAU,
          currentVelocityKmS: calculateOrbitalVelocityKmS(sunMass, effDistMeters),
          currentGravityForceN: calculateGravitationalForce(sunMass, effMass, effDistMeters),
          currentOrbitalPeriodDays: calculateOrbitalPeriodDays(sunMass, effDistMeters),
        };
      });
      return next;
    });
  }, [handleUpdateSunMass]);

  // Global Reset All
  const handleResetAll = useCallback(() => {
    const defaultScenario = PRESET_SCENARIOS[0];
    handleSelectScenario(defaultScenario);
    setElapsedDays(0);
  }, [handleSelectScenario]);

  // Step simulation time manually
  const handleStepTime = useCallback((deltaDays: number) => {
    setElapsedDays((prev) => Math.max(0, prev + deltaDays));
    setPlanetStates((prev) => {
      const next = { ...prev };
      const sunMass = SUN_DATA.realMassKg * settings.sunMassMultiplier;

      PLANETS.forEach((planet) => {
        const st = next[planet.id];
        if (!st) return;
        const effDistMeters = planet.realDistanceAU * st.distanceMultiplier * AU_IN_METERS;
        const periodDays = calculateOrbitalPeriodDays(sunMass, effDistMeters);
        if (periodDays <= 0) return;

        const angularSpeed = (2 * Math.PI) / periodDays;
        const newAngle = (st.currentAngleRad + angularSpeed * deltaDays) % (Math.PI * 2);

        next[planet.id] = {
          ...st,
          currentAngleRad: newAngle,
        };
      });
      return next;
    });
  }, [settings.sunMassMultiplier]);

  // Main Physics Simulation Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaTimeMs = Math.min(64, timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      if (settings.isPlaying && deltaTimeMs > 0) {
        const deltaSeconds = deltaTimeMs / 1000;
        const simDeltaDays = deltaSeconds * settings.simulationSpeedDaysPerSec;

        setElapsedDays((prev) => prev + simDeltaDays);

        setPlanetStates((prev) => {
          const next: Record<string, PlanetState> = {};
          const sunMass = SUN_DATA.realMassKg * settings.sunMassMultiplier;

          PLANETS.forEach((planet) => {
            const current = prev[planet.id];
            if (!current) return;

            const effDistAU = planet.realDistanceAU * current.distanceMultiplier;
            const effDistMeters = effDistAU * AU_IN_METERS;
            const effMass = planet.realMassKg * current.massMultiplier;

            // Kepler 3rd Law orbital period
            const periodDays = calculateOrbitalPeriodDays(sunMass, effDistMeters);
            const angularVelocityRadPerDay = periodDays > 0 ? (2 * Math.PI) / periodDays : 0;
            const newAngle = (current.currentAngleRad + angularVelocityRadPerDay * simDeltaDays) % (Math.PI * 2);

            // Screen visual radius for trail recording
            const rPx = 45 + Math.pow(effDistAU, 0.58) * 115;
            const posX = rPx * Math.cos(newAngle);
            const posY = rPx * Math.sin(newAngle);

            const newTrail = [...current.trail, { x: posX, y: posY, alpha: 1.0 }];
            if (newTrail.length > settings.trailLength) {
              newTrail.shift();
            }

            next[planet.id] = {
              ...current,
              currentAngleRad: newAngle,
              currentDistanceAU: effDistAU,
              currentVelocityKmS: calculateOrbitalVelocityKmS(sunMass, effDistMeters),
              currentGravityForceN: calculateGravitationalForce(sunMass, effMass, effDistMeters),
              currentOrbitalPeriodDays: periodDays,
              trail: settings.showTrails ? newTrail : [],
            };
          });

          return next;
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    settings.isPlaying,
    settings.simulationSpeedDaysPerSec,
    settings.sunMassMultiplier,
    settings.showTrails,
    settings.trailLength,
  ]);

  // Keyboard Shortcuts (Space to play/pause, Esc to close, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      } else if (e.key === 'Escape') {
        setSelectedPlanetId(null);
        setIsComparisonOpen(false);
        setIsGuideOpen(false);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsComparisonOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGuideOpen((prev) => !prev);
      } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (PLANETS[index]) {
          setSelectedPlanetId(PLANETS[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedPlanet = PLANETS.find((p) => p.id === selectedPlanetId) ?? null;
  const isSunSelected = selectedPlanetId === 'sun';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020204] text-slate-200 overflow-hidden select-none font-sans">
      {/* 1. Header Navbar */}
      <Navbar
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenComparisonModal={() => setIsComparisonOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        onResetAll={handleResetAll}
      />

      {/* 2. Top Celestial Quick Selector Bar */}
      <PlanetSelectorBar
        planets={PLANETS}
        selectedPlanetId={selectedPlanetId}
        onSelectPlanet={(id) => setSelectedPlanetId(id)}
      />

      {/* 3. Main Workspace (Canvas + Inspector Drawer) */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Canvas viewport */}
        <div className="flex-1 relative h-full">
          <SimulatorCanvas
            planets={PLANETS}
            planetStates={planetStates}
            settings={settings}
            selectedPlanetId={selectedPlanetId}
            onSelectPlanet={(id) => setSelectedPlanetId(id)}
            onUpdateSettings={setSettings}
          />
        </div>

        {/* Selected Planet Inspector Drawer */}
        {(selectedPlanet || isSunSelected) && (
          <aside className="relative h-full flex-shrink-0">
            <PlanetInspector
              planet={selectedPlanet}
              state={selectedPlanet ? planetStates[selectedPlanet.id] : undefined}
              sunMassMultiplier={settings.sunMassMultiplier}
              onClose={() => setSelectedPlanetId(null)}
              onUpdatePlanetState={handleUpdatePlanetState}
              onResetPlanetState={handleResetPlanetState}
              onUpdateSunMass={handleUpdateSunMass}
            />
          </aside>
        )}
      </main>

      {/* 4. Bottom Playback & Simulation Speed Bar */}
      <PlaybackControls
        settings={settings}
        elapsedDays={elapsedDays}
        onUpdateSettings={setSettings}
        onResetTime={() => setElapsedDays(0)}
        onStepTime={handleStepTime}
      />

      {/* 5. Modals */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        planets={PLANETS}
        planetStates={planetStates}
        sunMassMultiplier={settings.sunMassMultiplier}
        onSelectPlanet={(id) => setSelectedPlanetId(id)}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
