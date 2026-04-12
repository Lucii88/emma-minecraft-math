import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../data/state';
import { playClick, initAudio, startMusic } from '../../engine/AudioEngine';
import { getSprite } from '../../engine/SpriteManager';
import { ParticleSystem } from '../../engine/ParticleSystem';

const particles = new ParticleSystem();

export function TitleScreen() {
  const { setScreen, loadSave, incrementSession } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const frame = useRef(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    frame.current++;

    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0A0A2E');
    grad.addColorStop(0.4, '#1A1050');
    grad.addColorStop(0.7, '#3A1880');
    grad.addColorStop(1, '#78B9FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 97.3) % (h * 0.5);
      const alpha = 0.3 + 0.7 * Math.sin(frame.current * 0.03 + i);
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // ground
    const grassSprite = getSprite('grass');
    const dirtSprite = getSprite('dirt');
    const blockSize = 48;
    const groundY = h - blockSize * 2;
    for (let x = 0; x < w; x += blockSize) {
      ctx.drawImage(grassSprite, x, groundY, blockSize, blockSize);
      ctx.drawImage(dirtSprite, x, groundY + blockSize, blockSize, blockSize);
    }

    // Steve
    const steve = getSprite('steve');
    const steveX = w * 0.15;
    const steveY = groundY - 80 + Math.sin(frame.current * 0.04) * 5;
    ctx.drawImage(steve, steveX, steveY, 56, 88);

    // Creeper on the right
    const creeper = getSprite('creeper');
    const creeperX = w * 0.8;
    const creeperY = groundY - 68 + Math.sin(frame.current * 0.03 + 2) * 4;
    ctx.drawImage(creeper, creeperX, creeperY, 52, 72);

    // particles
    particles.update();
    particles.draw(ctx);

    // occasional sparkle
    if (frame.current % 30 === 0) {
      particles.emit(
        Math.random() * w, Math.random() * h * 0.5, 2,
        { colors: ['#FFD700', '#FFFFFF'], spread: 1, maxLife: 40, type: 'star', size: 3, gravity: 0.01 }
      );
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  const handleStart = async () => {
    initAudio();
    playClick();
    await loadSave();
    incrementSession();
    startMusic();
    setScreen('hub');
  };

  return (
    <div className="screen title-screen">
      <canvas ref={canvasRef} className="title-canvas" />
      <div className="title-content">
        <h1 className="title-logo pixel-text animate-float">
          ⛏️ EMMINA<br />MATEMATICKÁ VÝPRAVA
        </h1>
        <p className="title-subtitle pixel-text">🧱 Minecraft Dobrodružství 🧱</p>
        <button className="mc-btn mc-btn-gold title-play-btn" onClick={handleStart}>
          ▶ HRÁT
        </button>
        <p className="title-hint body-text">
          Prozkoumej svět matematiky s Minecraft hrdiny!
        </p>
      </div>
    </div>
  );
}
