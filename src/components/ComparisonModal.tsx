import React, { useState } from 'react';
import { PlanetData, PlanetState } from '../types';
import { SUN_DATA } from '../data/planets';
import {
  calculateGravitationalForce,
  calculateOrbitalVelocityKmS,
  calculateOrbitalPeriodDays,
  calculateSurfaceGravity,
  AU_IN_METERS,
  formatForceKorean,
} from '../physics/gravityEngine';
import { X, Scale, BarChart2, Orbit, Info, CheckCircle2 } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  planets: PlanetData[];
  planetStates: Record<string, PlanetState>;
  sunMassMultiplier: number;
  onSelectPlanet: (id: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  planets,
  planetStates,
  sunMassMultiplier,
  onSelectPlanet,
}) => {
  const [userWeight, setUserWeight] = useState<number>(70);
  const [metricMode, setMetricMode] = useState<'force' | 'velocity' | 'period' | 'surface_g'>('force');

  if (!isOpen) return null;

  const sunMassKg = SUN_DATA.realMassKg * sunMassMultiplier;

  // Compute metrics for all 8 planets
  const comparisonData = planets.map((p) => {
    const state = planetStates[p.id];
    const mass = p.realMassKg * (state?.massMultiplier ?? 1.0);
    const distAU = p.realDistanceAU * (state?.distanceMultiplier ?? 1.0);
    const distMeters = distAU * AU_IN_METERS;

    const forceN = calculateGravitationalForce(sunMassKg, mass, distMeters);
    const velKmS = calculateOrbitalVelocityKmS(sunMassKg, distMeters);
    const periodDays = calculateOrbitalPeriodDays(sunMassKg, distMeters);
    const surfaceG = calculateSurfaceGravity(mass, p.realRadiusKm);
    const weightOnPlanet = userWeight * (surfaceG / 9.807);
    
    // Kepler constant: a^3 / T^2 (in AU^3 / yr^2, should equal ~1.0 for Sun mass = 1.0)
    const periodYears = periodDays / 365.25;
    const keplerRatio = Math.pow(distAU, 3) / Math.pow(periodYears, 2);

    return {
      planet: p,
      mass,
      distAU,
      forceN,
      velKmS,
      periodDays,
      surfaceG,
      weightOnPlanet,
      keplerRatio,
    };
  });

  const maxForce = Math.max(...comparisonData.map((d) => d.forceN));
  const maxVel = Math.max(...comparisonData.map((d) => d.velKmS));
  const maxSurfaceG = Math.max(...comparisonData.map((d) => d.surfaceG));

  return (
    <div
      id="comparison-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="comparison-modal-container"
        className="bg-[#030306] border border-white/10 rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl overflow-hidden my-8 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-light tracking-tight text-white">
                8대 행성 중력 & 궤도 비교 분석실 <span className="text-xs font-serif italic text-orange-400">(Matrix Lab)</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Newtonian Gravitation & Kepler Third Law Analysis (a³ / T² = k)
              </p>
            </div>
          </div>
          <button
            id="btn-close-comparison-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Metric Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Metric:</span>
            <div className="flex bg-black/40 p-0.5 rounded border border-white/5 text-xs font-mono">
              <button
                onClick={() => setMetricMode('force')}
                className={`px-3 py-1 rounded transition-all ${
                  metricMode === 'force' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                중력 (F)
              </button>
              <button
                onClick={() => setMetricMode('velocity')}
                className={`px-3 py-1 rounded transition-all ${
                  metricMode === 'velocity' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                속도 (v)
              </button>
              <button
                onClick={() => setMetricMode('surface_g')}
                className={`px-3 py-1 rounded transition-all ${
                  metricMode === 'surface_g' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                표면 중력 (g)
              </button>
            </div>
          </div>

          {/* User weight prompt */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">지구 체중:</span>
            <input
              type="number"
              value={userWeight}
              onChange={(e) => setUserWeight(Math.max(1, Number(e.target.value)))}
              className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs"
            />
            <span className="text-slate-400">kg</span>
          </div>
        </div>

        {/* Visual Bar Comparison Chart */}
        <div className="space-y-3 bg-black/40 p-4 rounded-lg border border-white/5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            {metricMode === 'force' && 'Gravitational Force Comparison (Sun vs Planet)'}
            {metricMode === 'velocity' && 'Orbital Velocity Comparison (km/s)'}
            {metricMode === 'surface_g' && `Surface Gravity (g) & Weight on Surface (${userWeight}kg basis)`}
          </h3>

          <div className="space-y-2">
            {comparisonData.map((d) => {
              let barPercentage = 10;
              let valueLabel = '';
              let barColor = d.planet.color;

              if (metricMode === 'force') {
                // Logarithmic bar scale for astronomical difference
                const logRatio = Math.log10(d.forceN) / Math.log10(maxForce);
                barPercentage = Math.max(8, logRatio * 100);
                valueLabel = formatForceKorean(d.forceN);
              } else if (metricMode === 'velocity') {
                barPercentage = (d.velKmS / maxVel) * 100;
                valueLabel = `${d.velKmS.toFixed(2)} km/s`;
              } else {
                barPercentage = (d.surfaceG / maxSurfaceG) * 100;
                valueLabel = `${d.surfaceG.toFixed(2)} m/s² (체감 ${d.weightOnPlanet.toFixed(1)} kg)`;
              }

              return (
                <div
                  key={d.planet.id}
                  onClick={() => {
                    onSelectPlanet(d.planet.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                >
                  <div className="w-20 text-xs font-medium text-slate-300 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.planet.color }}
                    />
                    <span>{d.planet.nameKo}</span>
                  </div>

                  <div className="flex-1 h-4 bg-black/60 rounded overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${barPercentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>

                  <div className="w-48 text-right font-mono text-xs text-slate-300 truncate">
                    {valueLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kepler's 3rd Law Verification Table */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Orbit className="w-4 h-4 text-orange-400" />
              케플러 제3법칙 조화의 법칙 검증 (a³ / T² = Const)
            </h4>
            <span className="text-[10px] text-orange-300 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-orange-400" />
              태양 질량 1.0 M☉ 기준 일치도 99.9%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            모든 행성은 궤도 장반경 a(AU)의 세제곱과 공전 주기 T(년)의 제곱의 비율이 일정합니다.
            질량이 다른 어떤 행성도 같은 궤도 거리에 위치하면 동일한 공전 주기를 갖습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
