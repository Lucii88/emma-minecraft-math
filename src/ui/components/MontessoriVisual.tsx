import { MontessoriData } from '../../data/types';

const BEAD_COLORS = ['#f44336', '#4CAF50', '#E91E63', '#2196F3', '#9C27B0', '#FF9800', '#fff', '#795548', '#00BCD4', '#FFD700'];

interface Props {
  data: MontessoriData;
  showAnswer?: boolean;
}

export function MontessoriVisual({ data, showAnswer }: Props) {
  switch (data.type) {
    case 'strip_add': return <StripBoardAdd a={data.a!} b={data.b!} />;
    case 'strip_sub': return <StripBoardSub a={data.a!} b={data.b!} showAnswer={showAnswer} />;
    case 'golden_beads': return <GoldenBeads values={data.values!} />;
    case 'hundred_board': return <HundredBoard grid={data.grid!} />;
    case 'decomposition': return <Decomposition whole={data.whole!} parts={data.parts!} />;
    case 'snake': return <SnakeGame values={data.values!} />;
    default: return null;
  }
}

function StripBoardAdd({ a, b }: { a: number; b: number }) {
  const max = Math.max(a + b, 20);
  const pctA = (a / max) * 100;
  const pctB = (b / max) * 100;
  const tens = (10 / max) * 100;

  return (
    <div className="montessori-panel">
      <div className="strip-board" style={{ height: 56 }}>
        <div className="strip-board-axis">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} style={(i + 1) % 5 === 0 ? { fontWeight: 800, color: '#555' } : undefined}>
              {(i + 1) % 5 === 0 ? i + 1 : ''}
            </span>
          ))}
        </div>
        {max >= 10 && <div className="strip-tens-line" style={{ left: `${tens}%` }} />}
        <div className="strip-a" style={{ width: `${pctA}%` }}>{a}</div>
        <div className="strip-b" style={{ left: `${pctA}%`, width: `${pctB}%` }}>{b}</div>
      </div>
    </div>
  );
}

function StripBoardSub({ a, b, showAnswer }: { a: number; b: number; showAnswer?: boolean }) {
  const max = Math.max(a, 20);
  const pctA = (a / max) * 100;
  const pctB = (b / max) * 100;
  const tens = (10 / max) * 100;
  const diff = a - b;
  const pctDiff = (diff / max) * 100;

  return (
    <div className="montessori-panel">
      <div className="strip-board" style={{ height: 56 }}>
        <div className="strip-board-axis">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} style={(i + 1) % 5 === 0 ? { fontWeight: 800, color: '#555' } : undefined}>
              {(i + 1) % 5 === 0 ? i + 1 : ''}
            </span>
          ))}
        </div>
        {max >= 10 && <div className="strip-tens-line" style={{ left: `${tens}%` }} />}
        <div className="strip-a" style={{ width: `${pctA}%` }}>{a}</div>
        <div className="strip-b cover" style={{ left: `${pctDiff}%`, width: `${pctB}%` }}>{b}</div>
        {showAnswer && (
          <div className="strip-a" style={{
            width: `${pctDiff}%`,
            background: '#4CAF50',
            zIndex: 3,
            border: '2px solid #2E7D32',
          }}>{diff}</div>
        )}
      </div>
    </div>
  );
}

function GoldenBeads({ values }: { values: number[] }) {
  const hundreds = values[0] || 0;
  const tens = values[1] || 0;
  const units = values[2] || 0;

  return (
    <div className="montessori-panel">
      <div className="golden-beads">
        {hundreds > 0 && (
          <div className="bead-group">
            <div className="bead-group-label">Stovky</div>
            <div className="bead-group-count bead-hundreds">{hundreds}</div>
            <div className="bead-group-visual">
              {Array.from({ length: Math.min(hundreds, 9) }, (_, i) => (
                <div key={i} className="bead-square" />
              ))}
            </div>
          </div>
        )}
        {tens > 0 && (
          <div className="bead-group">
            <div className="bead-group-label">Desítky</div>
            <div className="bead-group-count bead-tens">{tens}</div>
            <div className="bead-group-visual">
              {Array.from({ length: Math.min(tens, 9) }, (_, i) => (
                <div key={i} className="bead-dot ten" />
              ))}
            </div>
          </div>
        )}
        <div className="bead-group">
          <div className="bead-group-label">Jednotky</div>
          <div className="bead-group-count bead-units">{units}</div>
          <div className="bead-group-visual">
            {Array.from({ length: Math.min(units, 9) }, (_, i) => (
              <div key={i} className="bead-dot unit" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HundredBoard({ grid }: { grid: (number | null)[] }) {
  return (
    <div className="montessori-panel">
      <div className="hundred-board-grid">
        {grid.map((val, i) => (
          <div key={i} className={`hb-cell ${val === null ? 'blank' : ''}`}>
            {val === null ? '?' : val}
          </div>
        ))}
      </div>
    </div>
  );
}

function Decomposition({ whole, parts }: { whole: number; parts: number[] }) {
  return (
    <div className="montessori-panel">
      <div className="decomposition-visual">
        <div className="decomp-whole">{whole}</div>
        <div className="decomp-arrow">⬇</div>
        <div className="decomp-parts">
          {parts.map((p, i) => (
            <div key={i} className={`decomp-part ${p === -1 ? 'missing' : ''}`}>
              {p === -1 ? '?' : p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SnakeGame({ values }: { values: number[] }) {
  return (
    <div className="montessori-panel">
      <div className="snake-visual">
        {values.map((v, i) => {
          const colorIdx = (v - 1) % BEAD_COLORS.length;
          const isGold = v === 10;
          return (
            <div
              key={i}
              className={`snake-bar ${isGold ? 'gold' : ''}`}
              style={{
                width: `${v * 12}px`,
                background: isGold ? undefined : BEAD_COLORS[colorIdx],
              }}
            >
              {v}
            </div>
          );
        })}
      </div>
    </div>
  );
}
