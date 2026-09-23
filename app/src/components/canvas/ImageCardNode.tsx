import { useStore } from '../../store/useStore';
import type { ImageNode } from '../../store/types';
import { useAssetUrl } from '../../lib/useAssetUrl';

/** Free-floating image card — not locked inside a frame. */
export function ImageCardNode({
  node,
  boardId,
  selected,
}: {
  node: ImageNode;
  boardId: string;
  selected: boolean;
}) {
  const assets = useStore((s) => s.assets);
  const updateNode = useStore((s) => s.updateNode);
  const asset = assets.find((a) => a.id === node.assetId);
  const url = useAssetUrl(node.assetId, node.src ?? asset?.url ?? null);

  return (
    <div className="imgcard">
      {url ? (
        <img src={url} alt={node.caption || asset?.name || 'image'} draggable={false} />
      ) : (
        <div className="missing">
          <span style={{ fontSize: 20, opacity: 0.5 }}>⬓</span>
          <span>Image unavailable</span>
        </div>
      )}
      {(node.caption || selected) && (
        <input
          className="ghost-input cap"
          value={node.caption}
          placeholder="Caption…"
          data-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => updateNode(boardId, node.id, { caption: e.target.value })}
        />
      )}
      {selected && <div className="node-sel-ring" />}
    </div>
  );
}
