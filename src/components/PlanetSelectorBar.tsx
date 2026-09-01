import React from 'react';
import { PlanetData } from '../types';
import { SUN_DATA } from '../data/planets';

interface PlanetSelectorBarProps {
  planets: PlanetData[];
  selectedPlanetId: string | null;
  onSelectPlanet: (id: string | null) => void;
}

export const PlanetSelectorBar: React.FC<PlanetSelectorBarProps> = ({
  planets,
  selectedPlanetId,
  onSelectPlanet,
}) => {
  return (
    <div
      id="planet-selector-bar"
      className="bg-[#030306] border-b border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-20 flex-shrink-0"
    >
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap mr-1 font-mono">
        천체 선택:
      </span>

      {/* Sun Button */}
      <button
        id="select-sun-btn"
        onClick={() => onSelectPlanet(selectedPlanetId === 'sun' ? null : 'sun')}
        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap border ${
          selectedPlanetId === 'sun'
            ? 'bg-orange-500/15 border-orange-500/40 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
        <span>태양 (Sun)</span>
        <span className="text-[9px] font-mono text-slate-500 ml-0.5">G2V</span>
      </button>

      <div className="h-4 w-px bg-white/10 mx-1" />

      {/* 8 Planets */}
      {planets.map((planet) => {
        const isSelected = selectedPlanetId === planet.id;
        return (
          <button
            key={planet.id}
            id={`select-planet-${planet.id}`}
            onClick={() => onSelectPlanet(isSelected ? null : planet.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap border ${
              isSelected
                ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: planet.color,
                boxShadow: isSelected ? `0 0 8px ${planet.color}` : 'none',
              }}
            />
            <span>{planet.nameKo}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {planet.realDistanceAU} AU
            </span>
          </button>
        );
      })}
    </div>
  );
};
