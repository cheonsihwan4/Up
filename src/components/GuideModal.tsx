import React from 'react';
import { X, BookOpen, Atom, Orbit, Sparkles, Scale, Compass } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="guide-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="guide-modal-container"
        className="bg-[#030306] border border-white/10 rounded-xl max-w-3xl w-full p-6 space-y-6 shadow-2xl overflow-hidden my-8 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-light tracking-tight text-white">
                뉴턴 만유인력 & 태양계 물리 가이드 <span className="text-xs font-serif italic text-orange-400">(Physics Handbook)</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Gravitational Laws, Orbital Mechanics, & Kepler's Equations
              </p>
            </div>
          </div>
          <button
            id="btn-close-guide-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          {/* Section 1: Universal Gravitation */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Scale className="w-4 h-4 text-orange-400" /> 1. 뉴턴의 만유인력 법칙 (Law of Universal Gravitation)
            </h3>
            <div className="bg-black/50 p-3 rounded border border-white/10 font-mono text-center text-sm font-bold text-orange-200">
              F = G · (M · m) / r²
            </div>
            <ul className="space-y-1 text-slate-400 list-disc pl-4 leading-relaxed text-[11px]">
              <li><strong className="text-slate-200">F (인력, 중력)</strong>: 두 천체 사이에 당기는 힘 (단위: N, 뉴턴)</li>
              <li><strong className="text-slate-200">G (만유인력 상수)</strong>: 6.67430 × 10⁻¹¹ N·m²/kg²</li>
              <li><strong className="text-slate-200">M, m</strong>: 중심 항성(태양) 및 공전 행성의 질량 (kg)</li>
              <li><strong className="text-slate-200">r</strong>: 두 천체의 질량 중심 사이의 거리 (m)</li>
              <li><strong className="text-orange-400">역제곱 법칙</strong>: 거리가 2배 멀어지면 중력은 1/4로 급감하고, 3배 멀어지면 1/9로 급감합니다.</li>
            </ul>
          </div>

          {/* Section 2: Circular Orbital Velocity */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Orbit className="w-4 h-4 text-orange-400" /> 2. 원궤도 공전 속도 (Orbital Velocity)
            </h3>
            <div className="bg-black/50 p-3 rounded border border-white/10 font-mono text-center text-sm font-bold text-blue-300">
              v = √( (G · M) / r )
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              만유인력이 원운동의 구심력(Fc = m v² / r) 역할을 합니다.
              <br />
              <strong className="text-orange-300">핵심 원리:</strong> 공전 속도 v의 공식에는 행성의 질량 m이 상쇄되어 들어가지 않습니다. 즉, 지구 위치에 목성을 놓아도 공전 속도는 초속 29.8km로 동일합니다.
            </p>
          </div>

          {/* Section 3: Kepler's Laws */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Atom className="w-4 h-4 text-orange-400" /> 3. 케플러의 행성 운동 3법칙
            </h3>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <div>
                <strong className="text-slate-200">제1법칙 (타원 궤도의 법칙):</strong> 모든 행성은 태양을 한 초점으로 하는 타원 궤도를 그립니다.
              </div>
              <div>
                <strong className="text-slate-200">제2법칙 (면적 속도 일정의 법칙):</strong> 태양과 행성을 잇는 선분은 같은 시간에 같은 면적을 쓸고 지나갑니다 (근일점에서 빠르고 원일점에서 느림).
              </div>
              <div>
                <strong className="text-slate-200">제3법칙 (조화의 법칙):</strong> 공전 주기 T의 제곱은 궤도 장반경 a의 세제곱에 비례합니다 (T² = a³).
              </div>
            </div>
          </div>

          {/* Section 4: Spacetime Distortion */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" /> 4. 시공간 중력 우물 (일반상대성이론)
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              아인슈타인의 일반상대성이론에 따르면, 질량을 가진 천체는 주위의 시공간을 휘어지게 만듭니다.
              행성들이 태양 주위를 도는 것은 눈에 보이지 않는 힘에 끌려가는 것이 아니라, 휘어진 시공간 속에서 가장 자연스러운 최단 경로(측지선)를 따라 운동하는 것입니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded text-xs transition-colors shadow-[0_0_12px_rgba(249,115,22,0.3)]"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
