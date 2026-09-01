import React from 'react';
import { PresetScenario } from '../types';
import { PRESET_SCENARIOS } from '../data/planets';
import {
  Orbit,
  Sparkles,
  BarChart3,
  BookOpen,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface NavbarProps {
  activeScenarioId: string;
  onSelectScenario: (scenario: PresetScenario) => void;
  onOpenComparisonModal: () => void;
  onOpenGuideModal: () => void;
  onResetAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScenarioId,
  onSelectScenario,
  onOpenComparisonModal,
  onOpenGuideModal,
  onResetAll,
}) => {
  return (
    <header
      id="main-navbar"
      className="h-16 border-b border-white/10 flex items-center justify-between px-5 bg-[#050508] z-30 flex-shrink-0"
    >
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-300 shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#050508]/80 flex items-center justify-center">
            <Orbit className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-light tracking-tight text-white leading-none">
              GRAVITY<span className="font-bold text-orange-400">SIM</span>
            </h1>
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono font-medium bg-white/5 text-orange-300/90 border border-white/10 rounded">
              Solar Lab
            </span>
          </div>
          <span className="text-[10px] text-slate-500 tracking-tight hidden sm:inline">
            태양계 만유인력 & 궤도역학 시뮬레이터
          </span>
        </div>
      </div>

      {/* Center / Right Telemetry & Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Status Telemetry */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] uppercase tracking-widest text-slate-400 font-medium font-mono">
          <span>Epoch: J2000.0</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            SYSTEM ONLINE
          </span>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-white/10" />

        {/* Preset Scenarios Selector */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-slate-400 hidden md:inline text-[11px] font-mono">시나리오:</span>
          <select
            id="scenario-selector"
            value={activeScenarioId}
            onChange={(e) => {
              const scenario = PRESET_SCENARIOS.find((s) => s.id === e.target.value);
              if (scenario) onSelectScenario(scenario);
            }}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id} className="bg-[#050508] text-slate-200">
                {scenario.name}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Modal Button */}
        <button
          id="btn-open-comparison"
          onClick={onOpenComparisonModal}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">행성 비교</span>
        </button>

        {/* Physics Guide Modal Button */}
        <button
          id="btn-open-guide"
          onClick={onOpenGuideModal}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">물리 공식</span>
        </button>

        {/* Global Reset */}
        <button
          id="btn-reset-all"
          onClick={onResetAll}
          title="모든 행성 및 태양 기본값으로 초기화"
          className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg border border-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
