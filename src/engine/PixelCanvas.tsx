import { useRef, useEffect, useCallback } from 'react';
import { ParticleSystem } from './ParticleSystem';
import { getSprite } from './SpriteManager';

interface Cloud { x: number; y: number; w: number; speed: number; }

const particles = new ParticleSystem();
let clouds: Cloud[] = [];
let animFrame = 0;

function initClouds(w: number) {
  clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * w,
      y: 20 + Math.random() * 80,
      w: 60 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.3,
    });
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: string) {
  const skyTop = theme === 'nether' ? '#3B0A0A' : theme === 'end' ? '#0A0015' : theme === 'night' ? '#0A0A2E' : '#78B9FF';
  const skyBot = theme === 'nether' ? '#8B2020' : theme === 'end' ? '#1A0030' : theme === 'night' ? '#1A1A4E' : '#B8E0FF';

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.7, skyBot);
  grad.addColorStop(1, theme === 'nether' ? '#4A0A0A' : theme === 'end' ? '#0D001A' : '#5B8731');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (theme === 'normal' || theme === 'ocean') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      const r = c.w / 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.arc(c.x + r, c.y - r * 0.4, r * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x + r * 1.5, c.y, r * 0.9, 0, Math.PI * 2);
      ctx.arc(c.x - r * 0.5, c.y + r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (theme === 'end') {
    ctx.fillStyle = '#CC00FF22';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137 + animFrame * 0.1) % w);
      const sy = ((i * 97) % (h * 0.6));
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // ground blocks
  const blockSize = 48;
  const groundY = h - blockSize;
  const blockSprite = theme === 'nether' ? 'netherrack' : theme === 'end' ? 'obsidian' : 'grass';
  const dirtSprite = theme === 'nether' ? 'netherrack' : theme === 'end' ? 'obsidian' : 'dirt';
  const sprite = getSprite(blockSprite);
  const dSprite = getSprite(dirtSprite);

  for (let x = 0; x < w; x += blockSize) {
    ctx.drawImage(sprite, x, groundY, blockSize, blockSize);
    ctx.drawImage(dSprite, x, groundY + blockSize, blockSize, blockSize);
  }
}

function updateClouds(w: number) {
  for (const c of clouds) {
    c.x += c.speed;
    if (c.x > w + 100) c.x = -100;
  }
}

interface PixelCanvasProps {
  theme?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PixelCanvas({ theme = 'normal', className, style }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.imageSmoothingEnabled = false;
    animFrame++;
    updateClouds(w);
    drawBackground(ctx, w, h, theme);
    particles.update();
    particles.draw(ctx);

    rafRef.current = requestAnimationFrame(render);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (clouds.length === 0) initClouds(canvas.width);
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, ...style }}
    />
  );
}

export function getParticles(): ParticleSystem {
  return particles;
}

export { particles };
