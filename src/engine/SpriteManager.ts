type SpriteMap = Record<string, HTMLCanvasElement>;

const cache: SpriteMap = {};

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * s, y * s, s, s);
}

function drawPixelGrid(ctx: CanvasRenderingContext2D, grid: string[][], palette: Record<string, string>, scale: number) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const key = grid[y][x];
      if (key && key !== '.' && palette[key]) {
        px(ctx, x, y, palette[key], scale);
      }
    }
  }
}

const S = 4; // pixel scale

function makeSteve(): HTMLCanvasElement {
  const W = 16, H = 32;
  const [c, ctx] = createCanvas(W * S, H * S);
  const p: Record<string, string> = {
    h: '#6B4226', s: '#FFCC99', e: '#FFFFFF', p: '#3366CC',
    b: '#44AAFF', t: '#00AAAA', l: '#3333CC', g: '#888888',
    d: '#222222', w: '#FFFFFF', m: '#663300',
  };
  const grid = [
    '....hhhhhh.....'.split(''),
    '...hhhhhhhh....'.split(''),
    '...hhhhhhhh....'.split(''),
    '...hmmhhmhh....'.split(''),
    '..ssssssssss...'.split(''),
    '..sewssssews...'.split(''),
    '..ssssmmssss...'.split(''),
    '..ssssssssss...'.split(''),
    '...sssssssss...'.split(''),
    '....tttttttt...'.split(''),
    '...tttttttttt..'.split(''),
    '..stttttttttts.'.split(''),
    '..ssttttttttss.'.split(''),
    '...tttttttttt..'.split(''),
    '...tttttttttt..'.split(''),
    '...tttt..tttt..'.split(''),
    '...llll..llll..'.split(''),
    '...llll..llll..'.split(''),
    '...llll..llll..'.split(''),
    '...llll..llll..'.split(''),
    '...llll..llll..'.split(''),
    '...gggg..gggg..'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makeCreeper(): HTMLCanvasElement {
  const W = 16, H = 24;
  const [c, ctx] = createCanvas(W * S, H * S);
  const p: Record<string, string> = {
    g: '#4CAF50', d: '#2E7D32', b: '#1B5E20', w: '#000000',
  };
  const grid = [
    '..ddggggggdd..'.split(''),
    '.dggggggggggd.'.split(''),
    '.ggggggggggggg'.split(''),
    '.gwwggggggwwg.'.split(''),
    '.gwwggggggwwg.'.split(''),
    '.gggggwwggggg.'.split(''),
    '.ggggwwwwgggg.'.split(''),
    '.gggwwwwwwggg.'.split(''),
    '.gggww..wwggg.'.split(''),
    '..ggggggggg...'.split(''),
    '..ggggggggg...'.split(''),
    '..ggggggggg...'.split(''),
    '..ggggggggg...'.split(''),
    '..ggggggggg...'.split(''),
    '..ggg..ggg....'.split(''),
    '..ggg..ggg....'.split(''),
    '..ggg..ggg....'.split(''),
    '..ddd..ddd....'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makeBlock(topColor: string, sideColor: string, darkColor: string): HTMLCanvasElement {
  const SIZE = 16;
  const [c, ctx] = createCanvas(SIZE * S, SIZE * S);
  ctx.fillStyle = sideColor;
  ctx.fillRect(0, 0, SIZE * S, SIZE * S);
  ctx.fillStyle = topColor;
  ctx.fillRect(0, 0, SIZE * S, 6 * S);
  ctx.fillStyle = darkColor;
  ctx.fillRect(0, 14 * S, SIZE * S, 2 * S);
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 14) + 1;
    const y = Math.floor(Math.random() * 14) + 1;
    ctx.fillStyle = darkColor;
    ctx.fillRect(x * S, y * S, S, S);
  }
  ctx.strokeStyle = '#00000044';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, SIZE * S, SIZE * S);
  return c;
}

function makeDiamond(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(16 * S, 16 * S);
  const p: Record<string, string> = {
    l: '#8CF4E8', m: '#4AEDD9', d: '#2CB8A8', k: '#1A8A7D',
  };
  const grid = [
    '......llll......'.split(''),
    '.....lmmmmml....'.split(''),
    '....lmmmmmml....'.split(''),
    '...lmmddddmml...'.split(''),
    '..lmmdddddmml...'.split(''),
    '.lmmdddddddmml..'.split(''),
    '.mmddddkddddmm..'.split(''),
    '.mmdddkkkdddmm..'.split(''),
    '..mddddkddddm...'.split(''),
    '...mdddddddm....'.split(''),
    '....mddddm......'.split(''),
    '.....mddm.......'.split(''),
    '......mm........'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makeHeart(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(16 * S, 16 * S);
  const p: Record<string, string> = { r: '#FF3333', d: '#CC0000', l: '#FF6666' };
  const grid = [
    '..rr....rr..'.split(''),
    '.rllr..rllr.'.split(''),
    'rllllrrllllr'.split(''),
    'rllllllllllr'.split(''),
    'rrrrrrrrrrrl'.split(''),
    '.rdddddddr..'.split(''),
    '..rddddddr..'.split(''),
    '...rdddddr..'.split(''),
    '....rddr....'.split(''),
    '.....rr.....'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makeSword(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(16 * S, 16 * S);
  const p: Record<string, string> = {
    b: '#4AEDD9', d: '#2CB8A8', h: '#8B6914', g: '#555555', w: '#CCCCCC',
  };
  const grid = [
    '..............bb'.split(''),
    '.............bdb'.split(''),
    '............bdb.'.split(''),
    '...........bdb..'.split(''),
    '..........bdb...'.split(''),
    '.........bdb....'.split(''),
    '........bdb.....'.split(''),
    '.......bdb......'.split(''),
    '......bdb.......'.split(''),
    '.g...bdb........'.split(''),
    '..g.bdb.........'.split(''),
    '...ghg..........'.split(''),
    '..ghhg..........'.split(''),
    '.g.hg...........'.split(''),
    '....g...........'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makePickaxe(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(16 * S, 16 * S);
  const p: Record<string, string> = {
    w: '#CCCCCC', g: '#888888', h: '#8B6914', d: '#6B4F12',
  };
  const grid = [
    '..wwwwww........'.split(''),
    '.wggggggw.......'.split(''),
    'w........w......'.split(''),
    '..........h.....'.split(''),
    '...........h....'.split(''),
    '............h...'.split(''),
    '.............h..'.split(''),
    '..............h.'.split(''),
    '...............h'.split(''),
  ];
  drawPixelGrid(ctx, grid, p, S);
  return c;
}

function makeStar(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(16 * S, 16 * S);
  ctx.fillStyle = '#FFD700';
  const cx = 8 * S, cy = 8 * S, r1 = 7 * S, r2 = 3 * S;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 === 0 ? r1 : r2) * 0.5;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  return c;
}

function makeXPOrb(): HTMLCanvasElement {
  const [c, ctx] = createCanvas(8 * S, 8 * S);
  const cx = 4 * S, cy = 4 * S;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 3.5 * S);
  grad.addColorStop(0, '#CCFF66');
  grad.addColorStop(0.5, '#80FF20');
  grad.addColorStop(1, '#339900');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx - S, cy - S, 1.2 * S, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export function getSprite(name: string): HTMLCanvasElement {
  if (cache[name]) return cache[name];

  switch (name) {
    case 'steve': cache[name] = makeSteve(); break;
    case 'creeper': cache[name] = makeCreeper(); break;
    case 'grass': cache[name] = makeBlock('#5B8731', '#9B7653', '#7A5C3A'); break;
    case 'dirt': cache[name] = makeBlock('#9B7653', '#8B6843', '#7A5C3A'); break;
    case 'stone': cache[name] = makeBlock('#8B8B8B', '#7B7B7B', '#6B6B6B'); break;
    case 'diamond_ore': cache[name] = makeBlock('#4AEDD9', '#7B7B7B', '#6B6B6B'); break;
    case 'gold_ore': cache[name] = makeBlock('#FFD700', '#7B7B7B', '#6B6B6B'); break;
    case 'obsidian': cache[name] = makeBlock('#1D1026', '#150C1C', '#0A0510'); break;
    case 'netherrack': cache[name] = makeBlock('#8B2020', '#6B1818', '#4B1010'); break;
    case 'diamond': cache[name] = makeDiamond(); break;
    case 'heart': cache[name] = makeHeart(); break;
    case 'sword': cache[name] = makeSword(); break;
    case 'pickaxe': cache[name] = makePickaxe(); break;
    case 'star': cache[name] = makeStar(); break;
    case 'xp_orb': cache[name] = makeXPOrb(); break;
    default:
      const [c] = createCanvas(16 * S, 16 * S);
      cache[name] = c;
  }
  return cache[name];
}

export function getAllSpriteNames(): string[] {
  return [
    'steve', 'creeper', 'grass', 'dirt', 'stone', 'diamond_ore',
    'gold_ore', 'obsidian', 'netherrack', 'diamond', 'heart',
    'sword', 'pickaxe', 'star', 'xp_orb',
  ];
}
