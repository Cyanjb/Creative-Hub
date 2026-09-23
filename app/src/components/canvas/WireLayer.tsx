import { useStore } from '../../store/useStore';
import { WIRE_COLORS, type Board, type WireType } from '../../store/types';
import { inPort, outPort, wireMidpoint, wirePath, type Point } from '../../lib/geometry';

/**
 * Wires render in one SVG behind the nodes. Each wire gets a fat invisible
 * "hit" stroke so it can be clicked without demanding pixel accuracy on a
 * 2px line.
 */
export function WireLayer({
  board,
  dragPoint,
}: {
  board: Board;
  /** Live cursor position in world space while dragging a new wire. */
  dragPoint: Point | null;
}) {
  const selectedWireId = useStore((s) => s.selectedWireId);
  const setSelectedWire = useStore((s) => s.setSelectedWire);
  const deleteWire = useStore((s) => s.deleteWire);
  const pendingWire = useStore((s) => s.pendingWire);

  const byId = new Map(board.nodes.map((n) => [n.id, n]));

  const pending = (() => {
    if (!pendingWire || !dragPoint) return null;
    const from = byId.get(pendingWire.fromId);
    if (!from) return null;
    return {
      d: wirePath(outPort(from), dragPoint),
      color: WIRE_COLORS[pendingWire.type],
    };
  })();

  return (
    <svg className="wire-layer" width="1" height="1">
      {board.wires.map((w) => {
        const a = byId.get(w.fromId);
        const b = byId.get(w.toId);
        if (!a || !b) return null;
        const p1 = outPort(a);
        const p2 = inPort(b);
        const d = wirePath(p1, p2);
        const mid = wireMidpoint(p1, p2);
        const color = WIRE_COLORS[w.type];
        const sel = selectedWireId === w.id;

        return (
          <g key={w.id} className="wire-g" style={{ color }}>
            <path
              className="wire-hit"
              d={d}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWire(sel ? null : w.id);
              }}
            />
            <path className={`wire ${sel ? 'sel' : ''}`} d={d} stroke={color} />
            {/* Arrowhead sits just before the input port. */}
            <circle cx={p2.x - 3} cy={p2.y} r={3} fill={color} />
            {sel && (
              <g
                className="wire-del"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWire(board.id, w.id);
                }}
              >
                <circle cx={mid.x} cy={mid.y} r={11} fill="#12151d" stroke={color} strokeWidth={1.5} />
                <path
                  d={`M ${mid.x - 4} ${mid.y - 4} L ${mid.x + 4} ${mid.y + 4} M ${mid.x + 4} ${
                    mid.y - 4
                  } L ${mid.x - 4} ${mid.y + 4}`}
                  stroke={color}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </g>
            )}
            {w.label && (
              <text
                x={mid.x}
                y={mid.y - 9}
                fill={color}
                fontSize={11}
                textAnchor="middle"
                style={{ pointerEvents: 'none', opacity: 0.85 }}
              >
                {w.label}
              </text>
            )}
          </g>
        );
      })}

      {pending && (
        <path
          className="wire"
          d={pending.d}
          stroke={pending.color}
          strokeDasharray="5 4"
          style={{ opacity: 0.85 }}
        />
      )}
    </svg>
  );
}

export function WireTypePicker({
  value,
  onChange,
}: {
  value: WireType;
  onChange: (t: WireType) => void;
}) {
  const types: WireType[] = ['image', 'video', 'text'];
  return (
    <div className="row" style={{ gap: 4 }}>
      {types.map((t) => (
        <button
          key={t}
          className="btn btn-sm"
          onClick={() => onChange(t)}
          title={`${t} wire`}
          style={{
            borderColor: value === t ? WIRE_COLORS[t] : undefined,
            background: value === t ? `${WIRE_COLORS[t]}22` : undefined,
            color: value === t ? WIRE_COLORS[t] : undefined,
            textTransform: 'capitalize',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: WIRE_COLORS[t],
              display: 'inline-block',
            }}
          />
          {t}
        </button>
      ))}
    </div>
  );
}
