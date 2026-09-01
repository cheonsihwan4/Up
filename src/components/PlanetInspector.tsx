import React, { useState } from 'react';
import { PlanetData, PlanetState } from '../types';
import { SUN_DATA } from '../data/planets';
import {
  calculateGravitationalForce,
  calculateOrbitalVelocityKmS,
  calculateOrbitalPeriodDays,
  calculateSurfaceGravity,
  calculateEscapeVelocityKmS,
  generateDistanceForceCurve,
  generateMassForceCurve,
  AU_IN_METERS,
  formatForceKorean,
} from '../physics/gravityEngine';
import {
  X,
  RotateCcw,
  Activity,
  Flame,
  Globe2,
  Orbit,
  Scale,
  Zap,
  HelpCircle,
  TrendingUp,
  Info,
  Layers,
} from 'lucide-react';

interface PlanetInspectorProps {
  planet: PlanetData | null;
  state?: PlanetState;
  sunMassMultiplier: number;
  onClose: () => void;
  onUpdatePlanetState: (planetId: string, updates: Partial<PlanetState>) => void;
  onResetPlanetState: (planetId: string) => void;
  onUpdateSunMass: (multiplier: number) => void;
}

export const PlanetInspector: React.FC<PlanetInspectorProps> = ({
  planet,
  state,
  sunMassMultiplier,
  onClose,
  onUpdatePlanetState,
  onResetPlanetState,
  onUpdateSunMass,
}) => {
  const [activeTab, setActiveTab] = useState<'gravity' | 'profile' | 'experiment'>('gravity');
  const [graphMode, setGraphMode] = useState<'distance' | 'mass'>('distance');
  const [userWeightKg, setUserWeightKg] = useState<number>(70);

  if (!planet) {
    // If Sun is selected
    return (
      <div
        id="sun-inspector-panel"
        className="w-full md:w-96 bg-[#030306] border-l border-white/5 h-full flex flex-col z-40 shadow-2xl overflow-y-auto"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#050508]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center font-bold text-black text-sm">
              ☉
            </span>
            <div>
              <h2 className="text-base font-light tracking-tight text-white">
                태양 <span className="font-bold text-orange-400 font-serif italic">(Sol)</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                G2V Main-Sequence Star
              </p>
            </div>
          </div>
          <button
            id="btn-close-sun-inspector"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Sun Mass Controller Slider */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5 text-orange-400" />
                Mass (M☉)
              </label>
              <span className="text-xs font-mono font-bold text-orange-300">
                {sunMassMultiplier.toFixed(2)} M☉
              </span>
            </div>
            <input
              id="sun-mass-slider"
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={sunMassMultiplier}
              onChange={(e) => onUpdateSunMass(Number(e.target.value))}
              className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.2x</span>
              <span>1.0x (Standard)</span>
              <span>3.0x</span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => onUpdateSunMass(0.5)}
                className="px-2 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5"
              >
                0.5x
              </button>
              <button
                onClick={() => onUpdateSunMass(1.0)}
                className="px-2 py-1 text-[11px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded"
              >
                1.0x (Default)
              </button>
              <button
                onClick={() => onUpdateSunMass(2.0)}
                className="px-2 py-1 text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5"
              >
                2.0x
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300 bg-white/5 p-3.5 rounded-lg border border-white/5">
            <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest font-mono">
              Physical Properties
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-black/40 rounded border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-mono">Mass</p>
                <p className="font-mono text-xs text-orange-200">1.989 × 10³⁰ kg</p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-mono">Surface Gravity</p>
                <p className="font-mono text-xs text-orange-200">274 m/s² (28 G)</p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-mono">Surface Temp</p>
                <p className="font-mono text-xs text-slate-200">5,505 °C</p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-mono">Core Temp</p>
                <p className="font-mono text-xs text-orange-200">1.5 × 10⁷ °C</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400 bg-white/5 p-3.5 rounded-lg border border-white/5">
            <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest font-mono flex items-center gap-1">
              <Info className="w-3 h-3 text-orange-400" /> Scientific Facts
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-400 leading-relaxed text-[11px]">
              {SUN_DATA.facts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Active Planet Calculations
  const massMultiplier = state?.massMultiplier ?? 1.0;
  const distanceMultiplier = state?.distanceMultiplier ?? 1.0;

  const currentMassKg = planet.realMassKg * massMultiplier;
  const currentDistanceAU = planet.realDistanceAU * distanceMultiplier;
  const currentDistanceMeters = currentDistanceAU * AU_IN_METERS;
  const centralSunMassKg = SUN_DATA.realMassKg * sunMassMultiplier;

  // Real-time calculated dynamic metrics
  const calculatedForceN = calculateGravitationalForce(
    centralSunMassKg,
    currentMassKg,
    currentDistanceMeters
  );
  const calculatedVelocityKmS = calculateOrbitalVelocityKmS(
    centralSunMassKg,
    currentDistanceMeters
  );
  const calculatedPeriodDays = calculateOrbitalPeriodDays(
    centralSunMassKg,
    currentDistanceMeters
  );
  const calculatedSurfaceGravity = calculateSurfaceGravity(
    currentMassKg,
    planet.realRadiusKm
  );
  const calculatedEscapeVelocity = calculateEscapeVelocityKmS(
    currentMassKg,
    planet.realRadiusKm
  );

  // Ratio relative to standard Earth
  const earthStandardForce = 3.542e22;
  const forceVsEarth = calculatedForceN / earthStandardForce;
  const gravityVsEarth = calculatedSurfaceGravity / 9.807;
  const userWeightOnPlanet = userWeightKg * (calculatedSurfaceGravity / 9.807);

  // Curve data points for interactive graph
  const distanceCurvePoints = generateDistanceForceCurve(
    centralSunMassKg,
    currentMassKg,
    currentDistanceAU,
    50
  );
  const massCurvePoints = generateMassForceCurve(
    centralSunMassKg,
    planet.realMassKg,
    massMultiplier,
    currentDistanceAU,
    40
  );

  // Latin body names
  const latinNames: Record<string, string> = {
    mercury: 'Planeta Mercurius',
    venus: 'Planeta Veneris',
    earth: 'Terra Mater',
    mars: 'Planeta Ruber',
    jupiter: 'Iuppiter Optimus',
    saturn: 'Saturnus',
    uranus: 'Caelus',
    neptune: 'Neptunus',
  };

  return (
    <div
      id={`planet-inspector-${planet.id}`}
      className="w-full md:w-[400px] bg-[#030306] border-l border-white/5 h-full flex flex-col z-40 shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#050508] sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-md text-xs flex-shrink-0"
            style={{
              backgroundColor: planet.color,
              boxShadow: `0 0 12px ${planet.color}`,
            }}
          >
            {planet.symbol}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 font-mono">Target: {planet.nameEn}</p>
            </div>
            <p className="text-lg font-serif italic text-white leading-tight">
              {planet.nameKo} <span className="text-xs font-mono font-normal text-slate-400 not-italic">({latinNames[planet.id] || planet.nameEn})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-reset-planet"
            onClick={() => onResetPlanetState(planet.id)}
            title="실제 물리값으로 초기화"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-close-planet-inspector"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#020204] p-1 gap-1">
        <button
          onClick={() => setActiveTab('gravity')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'gravity'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3 h-3 text-orange-400" />
          중력 시뮬레이션
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe2 className="w-3 h-3 text-blue-400" />
          천체 과학 정보
        </button>
        <button
          onClick={() => setActiveTab('experiment')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'experiment'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 text-amber-400" />
          사고 실험
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-4 flex-1">
        {activeTab === 'gravity' && (
          <div className="space-y-4">
            {/* Interactive Physics Controls Card */}
            <div>
              <h2 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 font-mono">
                Gravity Parameters
              </h2>
              <div className="space-y-4">
                {/* 1. Distance Slider (r) */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-slate-400">Distance (r)</span>
                    <span className="text-white font-mono">
                      {currentDistanceAU.toFixed(3)} AU
                      <span className="text-slate-500 ml-1">({distanceMultiplier.toFixed(2)}x)</span>
                    </span>
                  </div>
                  <input
                    id={`distance-slider-${planet.id}`}
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.02"
                    value={distanceMultiplier}
                    onChange={(e) =>
                      onUpdatePlanetState(planet.id, {
                        distanceMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 2. Mass Slider (m) */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-slate-400">Mass (m₁)</span>
                    <span className="text-white font-mono">
                      {massMultiplier.toFixed(2)} M⊕
                      <span className="text-slate-500 ml-1">({(currentMassKg / 5.972e24).toFixed(2)}x)</span>
                    </span>
                  </div>
                  <input
                    id={`mass-slider-${planet.id}`}
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={massMultiplier}
                    onChange={(e) =>
                      onUpdatePlanetState(planet.id, {
                        massMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                  <button
                    onClick={() => onUpdatePlanetState(planet.id, { distanceMultiplier: 0.5 })}
                    className="px-2 py-0.5 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5"
                  >
                    r ÷ 2
                  </button>
                  <button
                    onClick={() => onUpdatePlanetState(planet.id, { massMultiplier: 2.0 })}
                    className="px-2 py-0.5 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5"
                  >
                    m × 2
                  </button>
                  <button
                    onClick={() => onUpdatePlanetState(planet.id, { massMultiplier: 5.0 })}
                    className="px-2 py-0.5 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5"
                  >
                    Super 5x
                  </button>
                </div>
              </div>
            </div>

            {/* Force Calculation Card */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1 font-mono tracking-widest">
                Force Calculation (N)
              </p>
              <p className="text-3xl font-mono text-white">
                {calculatedForceN.toExponential(2).split('e')[0]}
                <span className="text-lg opacity-40 font-mono">e{calculatedForceN.toExponential(2).split('e')[1]}</span>
              </p>
              <span className="text-[11px] text-orange-300 font-mono mt-1 block">
                {formatForceKorean(calculatedForceN)} (지구의 {forceVsEarth.toFixed(2)}배)
              </span>
            </div>

            {/* Newtonian Equation Card */}
            <div>
              <h2 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 font-mono">
                Newtonian Equation
              </h2>
              <div className="p-4 bg-white/5 rounded-lg border border-white/5 italic font-serif text-center relative overflow-hidden">
                <div className="text-2xl text-white">
                  F = G <span className="relative inline-block align-middle ml-2"><span className="block border-b border-white pb-0.5">m₁ m₂</span><span className="block pt-0.5 text-base">r²</span></span>
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-10 text-6xl font-bold font-serif text-white pointer-events-none">
                  G
                </div>
              </div>
            </div>

            {/* Substituted Equation Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Orbital Velocity</span>
                <span className="text-blue-300 font-bold text-xs">
                  {calculatedVelocityKmS.toFixed(2)} km/s
                </span>
              </div>
              <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Period (T)</span>
                <span className="text-emerald-400 font-bold text-xs">
                  {calculatedPeriodDays >= 365
                    ? `${(calculatedPeriodDays / 365.25).toFixed(2)} yr`
                    : `${calculatedPeriodDays.toFixed(1)} d`}
                </span>
              </div>
              <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Surface Gravity</span>
                <span className="text-orange-200 font-bold text-xs">
                  {calculatedSurfaceGravity.toFixed(2)} m/s² ({gravityVsEarth.toFixed(2)} G)
                </span>
              </div>
              <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Escape Velocity</span>
                <span className="text-purple-300 font-bold text-xs">
                  {calculatedEscapeVelocity.toFixed(2)} km/s
                </span>
              </div>
            </div>

            {/* Real-time Dynamic Interactive Chart */}
            <div className="bg-black/40 p-3.5 rounded-lg border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  Vector Curve
                </span>
                <div className="flex bg-white/5 p-0.5 rounded border border-white/5 text-[10px] font-mono">
                  <button
                    onClick={() => setGraphMode('distance')}
                    className={`px-2 py-0.5 rounded ${
                      graphMode === 'distance'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1/r²
                  </button>
                  <button
                    onClick={() => setGraphMode('mass')}
                    className={`px-2 py-0.5 rounded ${
                      graphMode === 'mass'
                        ? 'bg-orange-500/30 text-orange-200'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    F ∝ m
                  </button>
                </div>
              </div>

              {/* Dynamic SVG Curve Render */}
              {graphMode === 'distance' ? (
                <div className="space-y-1">
                  <div className="h-32 w-full bg-[#020204] rounded p-2 relative flex flex-col justify-end border border-white/5">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />

                      {/* 1/r^2 Curve */}
                      {(() => {
                        const maxF = Math.max(...distanceCurvePoints.map((p) => p.forceN));
                        const minF = Math.min(...distanceCurvePoints.map((p) => p.forceN));
                        const rangeF = maxF - minF || 1;

                        const pathData = distanceCurvePoints
                          .map((p, idx) => {
                            const x = (idx / (distanceCurvePoints.length - 1)) * 280 + 10;
                            const y = 90 - ((p.forceN - minF) / rangeF) * 75;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ');

                        // Current point coordinates
                        const currIdx = distanceCurvePoints.findIndex(
                          (p) => p.distanceAU >= currentDistanceAU
                        );
                        const safeIdx = currIdx >= 0 ? currIdx : Math.floor(distanceCurvePoints.length / 2);
                        const currPoint = distanceCurvePoints[safeIdx];
                        const currX = (safeIdx / (distanceCurvePoints.length - 1)) * 280 + 10;
                        const currY = 90 - ((currPoint.forceN - minF) / rangeF) * 75;

                        return (
                          <>
                            <path d={pathData} fill="none" stroke="#f97316" strokeWidth="2" />
                            {/* Guide line */}
                            <line x1={currX} y1={currY} x2={currX} y2="95" stroke="#f97316" strokeDasharray="2 2" opacity="0.6" />
                            {/* Current Point Marker */}
                            <circle cx={currX} cy={currY} r="4" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                            <circle cx={currX} cy={currY} r="8" fill="none" stroke="#f97316" opacity="0.4" />
                          </>
                        );
                      })()}
                    </svg>

                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                      <span>Close (High G)</span>
                      <span className="text-orange-400 font-bold font-mono">● {currentDistanceAU.toFixed(2)} AU</span>
                      <span>Far (Low G)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="h-32 w-full bg-[#020204] rounded p-2 relative flex flex-col justify-end border border-white/5">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                      <line x1="10" y1="85" x2="290" y2="15" stroke="#f97316" strokeWidth="2" />
                      {(() => {
                        const normalizedX = (massMultiplier / 10.0) * 280 + 10;
                        const normalizedY = 85 - (massMultiplier / 10.0) * 70;
                        return (
                          <>
                            <line x1={normalizedX} y1={normalizedY} x2={normalizedX} y2="95" stroke="#f97316" strokeDasharray="2 2" opacity="0.6" />
                            <circle cx={normalizedX} cy={normalizedY} r="4" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                          </>
                        );
                      })()}
                    </svg>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                      <span>0.1x Mass</span>
                      <span className="text-orange-400 font-bold font-mono">● {massMultiplier.toFixed(1)}x</span>
                      <span>10.0x Mass</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Weight on Planet Tool */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">내 몸무게 체감 (Weight on Body)</span>
                <div className="flex items-center gap-1 text-xs">
                  <input
                    type="number"
                    value={userWeightKg}
                    onChange={(e) => setUserWeightKg(Math.max(1, Number(e.target.value)))}
                    className="w-12 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs"
                  />
                  <span className="text-slate-400 font-mono">kg</span>
                </div>
              </div>
              <div className="bg-black/40 p-2 rounded border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{planet.nameKo} 표면 체감:</span>
                <span className="text-orange-300 font-bold text-sm">
                  {userWeightOnPlanet.toFixed(1)} kg
                  <span className="text-[10px] text-slate-500 font-normal ml-1">
                    ({(userWeightOnPlanet * 9.807).toFixed(0)} N)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs text-slate-300">
            {/* Overview paragraph */}
            <p className="leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 text-slate-300 italic text-[11px]">
              {planet.description}
            </p>

            {/* Astronomical Data Matrix */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest font-mono">
                Astronomical Matrix
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Radius</p>
                  <p className="font-mono text-xs text-orange-200">{planet.realRadiusKm.toLocaleString()} km</p>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Rotation (Day)</p>
                  <p className="font-mono text-xs text-orange-200">
                    {Math.abs(planet.realRotationHours).toFixed(1)} h{planet.realRotationHours < 0 ? ' (Retro)' : ''}
                  </p>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Mean Temp</p>
                  <p className="font-mono text-xs text-slate-200">{planet.averageTempC} °C</p>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Moons</p>
                  <p className="font-mono text-xs text-orange-200">{planet.moonsCount}</p>
                </div>
              </div>
            </div>

            {/* Atmosphere & Composition */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono font-bold text-[10px] block">대기 조성:</span>
              <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                {planet.atmosphere}
              </p>
            </div>

            {/* Exploration */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono font-bold text-[10px] block">탐사 역사:</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">{planet.explorationHistory}</p>
            </div>

            {/* Interesting Facts */}
            <div className="space-y-1.5 bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-orange-400 font-bold block text-[10px] uppercase font-mono flex items-center gap-1">
                <Info className="w-3 h-3" /> 과학 사실
              </span>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400 leading-relaxed text-[11px]">
                {planet.facts.map((fact, idx) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'experiment' && (
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="bg-white/5 p-3.5 rounded-lg border border-white/5 space-y-1.5">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                Thought Experiment Lab
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                물리적 조건 변경 시 궤도 및 인력 변화를 즉각 검증합니다.
              </p>
            </div>

            {/* Experiment 1: Double Mass */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white text-xs">1. 질량이 2배로 증가할 때</span>
                <button
                  onClick={() => onUpdatePlanetState(planet.id, { massMultiplier: 2.0 })}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono border border-white/10"
                >
                  적용
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                • <strong className="text-orange-300">인력 변화</strong>: 태양과의 만유인력 F가 정확히 2배로 증가합니다.
                <br />
                • <strong className="text-blue-300">공전 속도</strong>: 공전 속도(v = √(GM/r))는 행성 질량에 무관하므로 유지됩니다.
              </p>
            </div>

            {/* Experiment 2: Half Distance */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white text-xs">2. 태양과의 거리가 1/2로 단축될 때</span>
                <button
                  onClick={() => onUpdatePlanetState(planet.id, { distanceMultiplier: 0.5 })}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono border border-white/10"
                >
                  적용
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                • <strong className="text-orange-400">인력 폭증</strong>: 거리 제곱 역비례로 인력이 4배(2²) 폭증합니다.
                <br />
                • <strong className="text-blue-300">공전 가속</strong>: 궤도 유지를 위해 속도가 √2(≈1.414)배 빨라지고 주기는 단축됩니다.
              </p>
            </div>

            {/* Experiment 3: Reset */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white text-xs">3. 관측 기본값으로 복원</span>
                <button
                  onClick={() => onResetPlanetState(planet.id)}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded text-[10px] font-mono border border-white/10"
                >
                  초기화
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                천문학 관측 표준값으로 되돌립니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
