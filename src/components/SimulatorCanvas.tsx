import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlanetData, PlanetState, SimulationSettings } from '../types';
import { SUN_DATA } from '../data/planets';
import { AU_IN_METERS, calculateGravitationalForce } from '../physics/gravityEngine';
import { Eye, Focus, ZoomIn, ZoomOut, RotateCcw, Maximize2, Compass } from 'lucide-react';

interface SimulatorCanvasProps {
  planets: PlanetData[];
  planetStates: Record<string, PlanetState>;
  settings: SimulationSettings;
  selectedPlanetId: string | null;
  onSelectPlanet: (id: string | null) => void;
  onUpdateSettings: (updater: (prev: SimulationSettings) => SimulationSettings) => void;
}

export const SimulatorCanvas: React.FC<SimulatorCanvasProps> = ({
  planets,
  planetStates,
  settings,
  selectedPlanetId,
  onSelectPlanet,
  onUpdateSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera transform state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Background stars cache
  const starsRef = useRef<Array<{ x: number; y: number; size: number; alpha: number; speed: number }>>([]);

  // Generate stars on mount
  useEffect(() => {
    const count = 350;
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 3000 - 1500,
        y: Math.random() * 3000 - 1500,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
      });
    }
    starsRef.current = stars;
  }, []);

  // Distance mapping function from real AU to screen pixels
  const getRadiusPixels = useCallback((distanceAU: number, mode = settings.scaleMode): number => {
    switch (mode) {
      case 'visual':
        // Smooth aesthetic exponent curve: Mercury is well separated from Sun, Neptune fits cleanly on screen
        return 45 + Math.pow(distanceAU, 0.58) * 115;
      case 'logarithmic':
        return 45 + Math.log2(distanceAU + 1.2) * 135;
      case 'true_scale':
        return 15 + distanceAU * 26;
      default:
        return 45 + Math.pow(distanceAU, 0.58) * 115;
    }
  }, [settings.scaleMode]);

  // Compute 2D position for a planet given current angle and state
  const getPlanetPos = useCallback((planet: PlanetData, state?: PlanetState) => {
    const effectiveAU = planet.realDistanceAU * (state?.distanceMultiplier ?? 1.0);
    const radiusPx = getRadiusPixels(effectiveAU);
    const angle = state?.currentAngleRad ?? 0;

    // In 3D isometric mode, compress Y axis
    const yCompress = settings.viewMode === '3d_isometric' ? 0.48 : 1.0;
    return {
      x: radiusPx * Math.cos(angle),
      y: radiusPx * Math.sin(angle) * yCompress,
      radiusPx,
      angle,
      effectiveAU,
    };
  }, [getRadiusPixels, settings.viewMode]);

  // Canvas resize and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tickCount = 0;

    const render = () => {
      tickCount++;
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || 800;
      const height = rect?.height || 600;

      // Handle retina displays
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Smooth camera follow if enabled
      let activePanX = pan.x;
      let activePanY = pan.y;
      if (settings.followSelected && selectedPlanetId && selectedPlanetId !== 'sun') {
        const selPlanet = planets.find(p => p.id === selectedPlanetId);
        const selState = planetStates[selectedPlanetId];
        if (selPlanet && selState) {
          const pos = getPlanetPos(selPlanet, selState);
          // Target position is offset from center
          activePanX = -pos.x * zoom;
          activePanY = -pos.y * zoom;
        }
      }

      const centerX = width / 2 + activePanX;
      const centerY = height / 2 + activePanY;

      // 1. Clear background & draw space gradient
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        Math.max(width, height) * 0.9
      );
      bgGrad.addColorStop(0, '#0a0a14');
      bgGrad.addColorStop(0.45, '#040408');
      bgGrad.addColorStop(1, '#020204');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Deep space subtle nebulae
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const neb1 = ctx.createRadialGradient(centerX - 250 * zoom, centerY - 180 * zoom, 20, centerX - 250 * zoom, centerY - 180 * zoom, 400 * zoom);
      neb1.addColorStop(0, 'rgba(79, 70, 229, 0.12)');
      neb1.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(centerX + 300 * zoom, centerY + 200 * zoom, 10, centerX + 300 * zoom, centerY + 200 * zoom, 350 * zoom);
      neb2.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      neb2.addColorStop(0.6, 'rgba(14, 165, 233, 0.03)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 3. Draw Stars
      ctx.save();
      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i];
        const starScreenX = ((star.x * zoom + centerX) % width + width) % width;
        const starScreenY = ((star.y * zoom + centerY) % height + height) % height;
        const twinkle = Math.sin(tickCount * star.speed + i) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Apply primary world transformation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);

      const yCompress = settings.viewMode === '3d_isometric' ? 0.48 : 1.0;

      // 4. Gravity Well Spacetime Distortion Grid
      if (settings.viewMode === 'gravity_grid' || settings.showGrid) {
        ctx.save();
        const gridSize = 45;
        const gridExtent = 850;
        ctx.lineWidth = 0.6;

        for (let gx = -gridExtent; gx <= gridExtent; gx += gridSize) {
          ctx.beginPath();
          let isFirst = true;
          for (let gy = -gridExtent; gy <= gridExtent; gy += 15) {
            // Distance from Sun
            const distSun = Math.sqrt(gx * gx + gy * gy);
            let warpZ = -120 * settings.sunMassMultiplier / Math.max(25, distSun * 0.18);

            // Add planet gravity wells
            for (const p of planets) {
              const pState = planetStates[p.id];
              const pos = getPlanetPos(p, pState);
              const dx = gx - pos.x;
              const dy = gy - (pos.y / yCompress);
              const distP = Math.sqrt(dx * dx + dy * dy);
              const pMass = (p.realMassKg / 5.972e24) * (pState?.massMultiplier ?? 1.0);
              warpZ -= Math.min(60, (pMass * 1.8) / Math.max(8, distP * 0.2));
            }

            const screenGx = gx;
            const screenGy = gy * yCompress + warpZ * 0.4;

            if (isFirst) {
              ctx.moveTo(screenGx, screenGy);
              isFirst = false;
            } else {
              ctx.lineTo(screenGx, screenGy);
            }
          }
          const alpha = Math.max(0.04, 0.25 - Math.abs(gx) / (gridExtent * 1.2));
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.stroke();
        }

        // Horizontal grid lines
        for (let gy = -gridExtent; gy <= gridExtent; gy += gridSize) {
          ctx.beginPath();
          let isFirst = true;
          for (let gx = -gridExtent; gx <= gridExtent; gx += 15) {
            const distSun = Math.sqrt(gx * gx + gy * gy);
            let warpZ = -120 * settings.sunMassMultiplier / Math.max(25, distSun * 0.18);

            for (const p of planets) {
              const pState = planetStates[p.id];
              const pos = getPlanetPos(p, pState);
              const dx = gx - pos.x;
              const dy = gy - (pos.y / yCompress);
              const distP = Math.sqrt(dx * dx + dy * dy);
              const pMass = (p.realMassKg / 5.972e24) * (pState?.massMultiplier ?? 1.0);
              warpZ -= Math.min(60, (pMass * 1.8) / Math.max(8, distP * 0.2));
            }

            const screenGx = gx;
            const screenGy = gy * yCompress + warpZ * 0.4;

            if (isFirst) {
              ctx.moveTo(screenGx, screenGy);
              isFirst = false;
            } else {
              ctx.lineTo(screenGx, screenGy);
            }
          }
          const alpha = Math.max(0.04, 0.25 - Math.abs(gy) / (gridExtent * 1.2));
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Habitable Goldilocks Zone (0.95 AU ~ 1.37 AU)
      if (settings.showHabitableZone) {
        ctx.save();
        const innerHabPx = getRadiusPixels(0.95 * Math.sqrt(settings.sunMassMultiplier));
        const outerHabPx = getRadiusPixels(1.37 * Math.sqrt(settings.sunMassMultiplier));
        
        ctx.beginPath();
        ctx.ellipse(0, 0, outerHabPx, outerHabPx * yCompress, 0, 0, Math.PI * 2);
        ctx.ellipse(0, 0, innerHabPx, innerHabPx * yCompress, 0, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.07)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, (innerHabPx + outerHabPx) / 2, ((innerHabPx + outerHabPx) / 2) * yCompress, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.28)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for Habitable Zone
        ctx.fillStyle = 'rgba(74, 222, 128, 0.75)';
        ctx.font = '10px "Noto Sans KR", sans-serif';
        ctx.fillText('생명체 거주 가능 구역 (Goldilocks Zone)', (innerHabPx + 8), 0);
        ctx.restore();
      }

      // 6. Draw Orbit Paths
      if (settings.showOrbits) {
        ctx.save();
        planets.forEach((planet) => {
          const state = planetStates[planet.id];
          const effAU = planet.realDistanceAU * (state?.distanceMultiplier ?? 1.0);
          const rPx = getRadiusPixels(effAU);
          const isSelected = selectedPlanetId === planet.id;
          const isHovered = hoveredPlanetId === planet.id;

          ctx.beginPath();
          ctx.ellipse(0, 0, rPx, rPx * yCompress, 0, 0, Math.PI * 2);
          
          if (isSelected) {
            ctx.strokeStyle = 'rgba(244, 244, 245, 0.85)';
            ctx.lineWidth = 2.0;
            ctx.setLineDash([]);
          } else if (isHovered) {
            ctx.strokeStyle = planet.color;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([4, 4]);
          } else {
            ctx.strokeStyle = planet.orbitColor;
            ctx.lineWidth = 1.0;
            ctx.setLineDash([3, 5]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });
        ctx.restore();
      }

      // 7. Draw Orbital Motion Trails
      if (settings.showTrails) {
        ctx.save();
        planets.forEach((planet) => {
          const state = planetStates[planet.id];
          if (!state || !state.trail || state.trail.length < 2) return;

          ctx.beginPath();
          for (let i = 0; i < state.trail.length; i++) {
            const pt = state.trail[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y * yCompress);
            else ctx.lineTo(pt.x, pt.y * yCompress);
          }
          ctx.strokeStyle = planet.color;
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = selectedPlanetId === planet.id ? 0.8 : 0.45;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });
        ctx.restore();
      }

      // 8. Draw Central Sun
      ctx.save();
      const sunBaseRadius = 24 * Math.pow(settings.sunMassMultiplier, 0.33);
      const isSunSelected = selectedPlanetId === 'sun';
      const isSunHovered = hoveredPlanetId === 'sun';

      // Outer Corona Glow Pulses
      const pulse = Math.sin(tickCount * 0.04) * 3;
      const sunGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, (sunBaseRadius + 30 + pulse));
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      sunGrad.addColorStop(0.18, 'rgba(253, 224, 71, 0.95)');
      sunGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.7)');
      sunGrad.addColorStop(0.75, 'rgba(239, 68, 68, 0.25)');
      sunGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sunBaseRadius + 35 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.beginPath();
      ctx.arc(0, 0, sunBaseRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbeb';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Selection ring for Sun
      if (isSunSelected || isSunHovered) {
        ctx.beginPath();
        ctx.arc(0, 0, sunBaseRadius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Sun Label
      if (settings.showLabels) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`태양 (1.0 M☉ × ${settings.sunMassMultiplier.toFixed(2)})`, 0, sunBaseRadius + 22);
      }
      ctx.restore();

      // 9. Draw Planets and Physical Vectors
      planets.forEach((planet) => {
        const state = planetStates[planet.id];
        const pos = getPlanetPos(planet, state);
        const isSelected = selectedPlanetId === planet.id;
        const isHovered = hoveredPlanetId === planet.id;

        const planetRadius = planet.baseVisualRadius * Math.pow(state?.massMultiplier ?? 1.0, 0.25);

        ctx.save();
        ctx.translate(pos.x, pos.y);

        // A. Gravity Vector (Red Arrow pointing toward Sun)
        if (settings.showGravityVectors) {
          ctx.save();
          // Angle to sun is angle + PI
          const angleToSun = Math.atan2(-pos.y, -pos.x);
          const forceN = state?.currentGravityForceN ?? 1e22;
          // Scale arrow length logarithmically for clean visual balance
          const vecLength = Math.min(90, Math.max(22, Math.log10(forceN) * 2.8 - 40));

          ctx.beginPath();
          ctx.moveTo(0, 0);
          const headX = Math.cos(angleToSun) * vecLength;
          const headY = Math.sin(angleToSun) * vecLength;
          ctx.lineTo(headX, headY);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Arrow head
          const headAngle = Math.PI / 6;
          const headSize = 8;
          ctx.beginPath();
          ctx.moveTo(headX, headY);
          ctx.lineTo(
            headX - headSize * Math.cos(angleToSun - headAngle),
            headY - headSize * Math.sin(angleToSun - headAngle)
          );
          ctx.lineTo(
            headX - headSize * Math.cos(angleToSun + headAngle),
            headY - headSize * Math.sin(angleToSun + headAngle)
          );
          ctx.closePath();
          ctx.fillStyle = '#ef4444';
          ctx.fill();

          if (isSelected || isHovered) {
            ctx.fillStyle = '#fca5a5';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Fg (중력)', headX * 0.6, headY * 0.6 - 6);
          }
          ctx.restore();
        }

        // B. Orbital Velocity Vector (Cyan Arrow tangent to orbit)
        if (settings.showVelocityVectors) {
          ctx.save();
          const tangentAngle = pos.angle + Math.PI / 2;
          const velKmS = state?.currentVelocityKmS ?? 30;
          const vecLength = Math.min(85, Math.max(20, velKmS * 1.4));

          ctx.beginPath();
          ctx.moveTo(0, 0);
          const headX = Math.cos(tangentAngle) * vecLength;
          const headY = Math.sin(tangentAngle) * vecLength * yCompress;
          ctx.lineTo(headX, headY);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Arrow head
          const currentHeading = Math.atan2(headY, headX);
          const headAngle = Math.PI / 6;
          const headSize = 8;
          ctx.beginPath();
          ctx.moveTo(headX, headY);
          ctx.lineTo(
            headX - headSize * Math.cos(currentHeading - headAngle),
            headY - headSize * Math.sin(currentHeading - headAngle)
          );
          ctx.lineTo(
            headX - headSize * Math.cos(currentHeading + headAngle),
            headY - headSize * Math.sin(currentHeading + headAngle)
          );
          ctx.closePath();
          ctx.fillStyle = '#06b6d4';
          ctx.fill();

          if (isSelected || isHovered) {
            ctx.fillStyle = '#a5f3fc';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${velKmS.toFixed(1)} km/s`, headX + 4, headY - 4);
          }
          ctx.restore();
        }

        // C. Saturn Rings / Ringed planets
        if (planet.ring) {
          ctx.save();
          ctx.rotate(-0.35); // axial tilt
          const innerR = planetRadius * planet.ring.innerRadiusRatio;
          const outerR = planetRadius * planet.ring.outerRadiusRatio;
          
          ctx.beginPath();
          ctx.ellipse(0, 0, outerR, outerR * 0.32, 0, 0, Math.PI * 2);
          ctx.ellipse(0, 0, innerR, innerR * 0.32, 0, 0, Math.PI * 2, true);
          ctx.fillStyle = planet.ring.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }

        // D. Planet Sphere & Lighting
        ctx.save();
        const pGrad = ctx.createRadialGradient(
          -planetRadius * 0.3,
          -planetRadius * 0.3,
          1,
          0,
          0,
          planetRadius * 1.2
        );
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.3, planet.color);
        pGrad.addColorStop(0.85, planet.secondaryColor);
        pGrad.addColorStop(1, '#09090b');

        ctx.beginPath();
        ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = isSelected ? 22 : (isHovered ? 14 : 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Custom atmospheric details
        if (planet.id === 'earth') {
          // Earth clouds & atmosphere aura
          ctx.beginPath();
          ctx.arc(0, 0, planetRadius + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (planet.id === 'jupiter') {
          // Jupiter stripes overlay
          ctx.save();
          ctx.clip();
          ctx.fillStyle = 'rgba(180, 83, 9, 0.45)';
          ctx.fillRect(-planetRadius, -planetRadius * 0.4, planetRadius * 2, planetRadius * 0.25);
          ctx.fillRect(-planetRadius, planetRadius * 0.15, planetRadius * 2, planetRadius * 0.25);
          // Red spot
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.ellipse(planetRadius * 0.3, planetRadius * 0.25, 3, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // E. Selection ring
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, planetRadius + 7, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Target reticle
          const reticleLen = 4;
          ctx.beginPath();
          ctx.moveTo(-planetRadius - 10, 0); ctx.lineTo(-planetRadius - 10 + reticleLen, 0);
          ctx.moveTo(planetRadius + 10, 0); ctx.lineTo(planetRadius + 10 - reticleLen, 0);
          ctx.moveTo(0, -planetRadius - 10); ctx.lineTo(0, -planetRadius - 10 + reticleLen);
          ctx.moveTo(0, planetRadius + 10); ctx.lineTo(0, planetRadius + 10 - reticleLen);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // F. Planet Labels
        if (settings.showLabels) {
          ctx.fillStyle = isSelected ? '#ffffff' : (isHovered ? '#e2e8f0' : '#cbd5e1');
          ctx.font = isSelected ? 'bold 12px "Noto Sans KR", sans-serif' : '11px "Noto Sans KR", sans-serif';
          ctx.textAlign = 'center';
          const labelY = planetRadius + 14;
          ctx.fillText(`${planet.nameKo} (${pos.effectiveAU.toFixed(2)} AU)`, 0, labelY);
        }

        ctx.restore();
      });

      ctx.restore(); // Restore world transform

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    planets,
    planetStates,
    settings,
    selectedPlanetId,
    hoveredPlanetId,
    zoom,
    pan,
    getRadiusPixels,
    getPlanetPos,
  ]);

  // Handle Mouse / Touch interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    setMousePos({ x: clientX - rect.left, y: clientY - rect.top });

    if (isDragging) {
      // If user drags, disable automatic follow
      if (settings.followSelected) {
        onUpdateSettings(prev => ({ ...prev, followSelected: false }));
      }
      setPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
      return;
    }

    // Hover detection
    const mouseCanvasX = clientX - rect.left - rect.width / 2 - pan.x;
    const mouseCanvasY = clientY - rect.top - rect.height / 2 - pan.y;

    const worldMouseX = mouseCanvasX / zoom;
    const worldMouseY = mouseCanvasY / zoom;

    // Check Sun hover
    const distToSun = Math.sqrt(worldMouseX * worldMouseX + worldMouseY * worldMouseY);
    if (distToSun < 30) {
      setHoveredPlanetId('sun');
      return;
    }

    // Check Planets hover
    let foundPlanet: string | null = null;
    for (const p of planets) {
      const state = planetStates[p.id];
      const pos = getPlanetPos(p, state);
      const dx = worldMouseX - pos.x;
      const dy = worldMouseY - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = Math.max(16, p.baseVisualRadius + 6);
      if (dist < hitRadius) {
        foundPlanet = p.id;
        break;
      }
    }
    setHoveredPlanetId(foundPlanet);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseCanvasX = e.clientX - rect.left - rect.width / 2 - pan.x;
    const mouseCanvasY = e.clientY - rect.top - rect.height / 2 - pan.y;
    const worldMouseX = mouseCanvasX / zoom;
    const worldMouseY = mouseCanvasY / zoom;

    // Check Sun
    const distToSun = Math.sqrt(worldMouseX * worldMouseX + worldMouseY * worldMouseY);
    if (distToSun < 32) {
      onSelectPlanet(selectedPlanetId === 'sun' ? null : 'sun');
      return;
    }

    // Check Planets
    for (const p of planets) {
      const state = planetStates[p.id];
      const pos = getPlanetPos(p, state);
      const dx = worldMouseX - pos.x;
      const dy = worldMouseY - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = Math.max(18, p.baseVisualRadius + 8);
      if (dist < hitRadius) {
        onSelectPlanet(selectedPlanetId === p.id ? null : p.id);
        return;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(4.5, Math.max(0.35, prev * zoomFactor)));
  };

  // Quick preset camera actions
  const resetCamera = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    onUpdateSettings(prev => ({ ...prev, followSelected: false }));
  };

  const focusInnerPlanets = () => {
    setZoom(2.1);
    setPan({ x: 0, y: 0 });
    onUpdateSettings(prev => ({ ...prev, followSelected: false }));
  };

  const focusOuterPlanets = () => {
    setZoom(0.65);
    setPan({ x: 0, y: 0 });
    onUpdateSettings(prev => ({ ...prev, followSelected: false }));
  };

  return (
    <div
      ref={containerRef}
      id="simulator-canvas-container"
      className="relative w-full h-full overflow-hidden select-none bg-[#020204] cursor-grab active:cursor-grabbing"
    >
      <canvas
        ref={canvasRef}
        id="solar-simulation-canvas"
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Floating Canvas Quick View & Zoom Controls */}
      <div
        id="canvas-quick-controls"
        className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-[#030306]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-2xl"
      >
        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(4.5, z * 1.25))}
          title="확대 (Zoom In)"
          className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.35, z * 0.8))}
          title="축소 (Zoom Out)"
          className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-reset"
          onClick={resetCamera}
          title="화면 초기화 (Reset View)"
          className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-full h-px bg-white/10 my-0.5" />

        <button
          id="btn-focus-inner"
          onClick={focusInnerPlanets}
          title="내행성계 집중 (수성~화성)"
          className="px-2 py-1 text-[11px] font-mono hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors flex items-center justify-center gap-1"
        >
          내행성
        </button>
        <button
          id="btn-focus-outer"
          onClick={focusOuterPlanets}
          title="외행성계 전체 보기 (목성~해왕성)"
          className="px-2 py-1 text-[11px] font-mono hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors flex items-center justify-center gap-1"
        >
          외행성
        </button>
      </div>

      {/* View Mode Switcher Pills */}
      <div
        id="view-mode-pills"
        className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-[#030306]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-2xl"
      >
        <button
          id="view-mode-2d"
          onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: '2d' }))}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-all border ${
            settings.viewMode === '2d'
              ? 'bg-white/15 text-white border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          2D 평면
        </button>
        <button
          id="view-mode-3d"
          onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: '3d_isometric' }))}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-all border ${
            settings.viewMode === '3d_isometric'
              ? 'bg-white/15 text-white border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          3D 입체
        </button>
        <button
          id="view-mode-gravity-grid"
          onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: 'gravity_grid' }))}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1.5 border ${
            settings.viewMode === 'gravity_grid'
              ? 'bg-orange-500/20 text-orange-200 border-orange-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-orange-400" />
          중력 격자
        </button>
      </div>

      {/* Bottom Visual Legend */}
      <div
        id="canvas-legend"
        className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-[#030306]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-slate-400"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
          <span>중력 벡터 (Fg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
          <span>속도 벡터 (v)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <span>골디락스 존</span>
        </div>
      </div>
    </div>
  );
};
