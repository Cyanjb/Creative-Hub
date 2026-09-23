import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { TextNode } from '../../store/types';

export function TextNodeView({
  node,
  boardId,
  selected,
  editing,
  onEdit,
  onDone,
}: {
  node: TextNode;
  boardId: string;
  selected: boolean;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const updateNode = useStore((s) => s.updateNode);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const style = {
    fontSize: node.fontSize,
    color: node.color,
    fontWeight: node.bold ? 650 : 400,
    lineHeight: 1.35,
    letterSpacing: node.fontSize > 24 ? '-0.02em' : undefined,
  };

  return (
    <div className="textnode" style={style} onDoubleClick={onEdit}>
      {editing ? (
        <textarea
          ref={ref}
          value={node.text}
          data-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => updateNode(boardId, node.id, { text: e.target.value })}
          onBlur={onDone}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onDone();
          }}
          style={style}
        />
      ) : (
        <span style={{ pointerEvents: 'none' }}>{node.text || 'Double-click to edit'}</span>
      )}
      {selected && <div className="node-sel-ring" />}
    </div>
  );
}
