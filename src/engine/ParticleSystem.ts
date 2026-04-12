export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  gravity: number;
  type: 'circle' | 'square' | 'star';
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(
    x: number,
    y: number,
    count: number,
    opts: Partial<Omit<Particle, 'x' | 'y' | 'life' | 'alpha'>> & { spread?: number; colors?: string[] } = {}
  ) {
    const spread = opts.spread ?? 3;
    const colors = opts.colors ?? ['#80FF20', '#CCFF66', '#FFD700'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread * 2,
        vy: (Math.random() - 1) * spread,
        life: opts.maxLife ?? (40 + Math.random() * 30),
        maxLife: opts.maxLife ?? (40 + Math.random() * 30),
        size: opts.size ?? (3 + Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: opts.gravity ?? 0.05,
        type: opts.type ?? 'square',
      });
    }
  }

  emitXP(x: number, y: number) {
    this.emit(x, y, 15, {
      colors: ['#80FF20', '#CCFF66', '#AAFFAA'],
      spread: 4, gravity: 0.08, type: 'circle',
      maxLife: 50,
    });
  }

  emitCorrect(x: number, y: number) {
    this.emit(x, y, 20, {
      colors: ['#FFD700', '#FFA500', '#FFFF00'],
      spread: 5, gravity: 0.04, type: 'star',
      maxLife: 60,
    });
  }

  emitWrong(x: number, y: number) {
    this.emit(x, y, 8, {
      colors: ['#FF3333', '#CC0000'],
      spread: 2, gravity: 0.1, type: 'square',
      maxLife: 25,
    });
  }

  emitLevelUp(x: number, y: number) {
    this.emit(x, y, 40, {
      colors: ['#FFD700', '#4AEDD9', '#80FF20', '#FF6600', '#CC00FF'],
      spread: 8, gravity: 0.02, type: 'star',
      maxLife: 80, size: 6,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star') {
        const s = p.size;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.1);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? s : s * 0.4;
          const a = (Math.PI / 4) * i;
          const method = i === 0 ? 'moveTo' : 'lineTo';
          ctx[method](r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }

  get active() {
    return this.particles.length > 0;
  }
}
