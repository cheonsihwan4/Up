import React from 'react';
import { SimulationSettings } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipForward,
  SkipBack,
  Sliders,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';

interface PlaybackControlsProps {
  settings: SimulationSettings;
  elapsedDays: number;
  onUpdateSettings: (updater: (prev: SimulationSettings) => SimulationSettings) => void;
  onResetTime: () => void;
  onStepTime: (deltaDays: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  settings,
  elapsedDays,
  onUpdateSettings,
  onResetTime,
  onStepTime,
}) => {
  const togglePlay = () => {
    onUpdateSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSpeedChange = (speed: number) => {
    onUpdateSettings((prev) => ({ ...prev, simulationSpeedDaysPerSec: speed }));
  };

  // Convert elapsed days to human readable years & days
  const years = Math.floor(elapsedDays / 365.25);
  const remainingDays = Math.floor(elapsedDays % 365.25);

  const speedPresets = [
    { label: '1일/초', value: 1 },
    { label: '10일/초', value: 10 },
    { label: '30일/초 (표준)', value: 30 },
    { label: '100일/초', value: 100 },
    { label: '365일/초 (1년)', value: 365 },
  ];

  return (
    <div
      id="playback-controls-bar"
      className="bg-[#050508] border-t border-white/10 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 z-30 flex-shrink-0"
    >
      {/* 1. Master Playback & Step Controls */}
      <div className="flex items-center gap-3">
        <button
          id="btn-main-play-pause"
          onClick={togglePlay}
          className={`px-3.5 py-1.5 rounded-full font-medium text-xs flex items-center gap-2 transition-all ${
            settings.isPlaying
              ? 'bg-orange-500 hover:bg-orange-400 text-black font-semibold shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
          }`}
        >
          {settings.isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>시뮬레이션 재생</span>
            </>
          )}
        </button>

        {/* Step Forward / Backward */}
        <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded border border-white/5">
          <button
            id="btn-step-backward"
            onClick={() => onStepTime(-5)}
            title="5일 뒤로"
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-step-forward"
            onClick={() => onStepTime(5)}
            title="5일 앞으로"
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-reset-time"
            onClick={onResetTime}
            title="시간 초기화"
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Elapsed Time Counter */}
        <div
          id="simulation-elapsed-counter"
          className="bg-black/40 border border-white/10 px-3 py-1.5 rounded flex items-center gap-2 font-mono text-xs"
        >
          <span className="text-slate-500 text-[11px] uppercase tracking-wider">시간:</span>
          <span className="text-orange-300 font-bold">
            {years > 0 ? `${years}년 ` : ''}
            {remainingDays}일
          </span>
          <span className="text-slate-500 text-[10px]">({elapsedDays.toFixed(0)}d)</span>
        </div>
      </div>

      {/* 2. Simulation Speed Control Slider & Presets */}
      <div className="flex items-center gap-3 flex-1 max-w-md min-w-[260px]">
        <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 font-mono text-[11px]">
          <FastForward className="w-3 h-3 text-orange-400" />
          속도:
        </span>
        <input
          id="simulation-speed-slider"
          type="range"
          min="1"
          max="500"
          step="1"
          value={settings.simulationSpeedDaysPerSec}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <span className="text-xs font-mono text-slate-200 min-w-[60px] text-right">
          {settings.simulationSpeedDaysPerSec}d/s
        </span>

        {/* Quick Speed Preset Chips */}
        <div className="hidden lg:flex items-center gap-1">
          {speedPresets.slice(1, 4).map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSpeedChange(preset.value)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors border ${
                settings.simulationSpeedDaysPerSec === preset.value
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {preset.value}x
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visual Layer Toggles (Orbits, Vectors, Labels, Habitable Zone) */}
      <div id="visual-toggles" className="flex items-center gap-1.5 flex-wrap">
        <button
          id="toggle-gravity-vectors"
          onClick={() =>
            onUpdateSettings((prev) => ({
              ...prev,
              showGravityVectors: !prev.showGravityVectors,
            }))
          }
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all flex items-center gap-1.5 border ${
            settings.showGravityVectors
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          중력 벡터 (Fg)
        </button>

        <button
          id="toggle-velocity-vectors"
          onClick={() =>
            onUpdateSettings((prev) => ({
              ...prev,
              showVelocityVectors: !prev.showVelocityVectors,
            }))
          }
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all flex items-center gap-1.5 border ${
            settings.showVelocityVectors
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          속도 벡터 (v)
        </button>

        <button
          id="toggle-orbits"
          onClick={() =>
            onUpdateSettings((prev) => ({
              ...prev,
              showOrbits: !prev.showOrbits,
            }))
          }
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all border ${
            settings.showOrbits
              ? 'bg-white/15 border-white/30 text-white'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          궤도선
        </button>

        <button
          id="toggle-habitable"
          onClick={() =>
            onUpdateSettings((prev) => ({
              ...prev,
              showHabitableZone: !prev.showHabitableZone,
            }))
          }
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all border ${
            settings.showHabitableZone
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          골디락스 존
        </button>
      </div>
    </div>
  );
};
