import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { RenderBoard as Board, Character, FrameNode, HubState, Project } from '../store/types';
import { getBlob, peekAssetUrl } from '../store/assetDb';
import { WIRE_LABELS } from '../store/types';

// ── image helpers ────────────────────────────────────────────────────────

async function assetDataUrl(assetId: string | null, fallbackUrl?: string | null): Promise<string | null> {
  if (!assetId) return null;
  const blob = await getBlob(assetId);
  if (blob) {
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  }
  // Remote images: draw through a canvas. Cross-origin hosts will taint it,
  // in which case we skip the image rather than fail the whole export.
  const url = fallbackUrl ?? peekAssetUrl(assetId);
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')!.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 16, h: 9 });
    img.src = dataUrl;
  });
}

// ── palette (print-friendly dark sheet) ──────────────────────────────────

const INK = { r: 232, g: 236, b: 244 };
const DIM = { r: 140, g: 148, b: 165 };
const CYAN = { r: 34, g: 211, b: 238 };
const PAPER = { r: 12, g: 14, b: 20 };
const LINE = { r: 44, g: 50, b: 64 };

/**
 * Storyboard export — structured production sheets, 6 panels per A4 landscape
 * page (3 across × 2 down), grouped so a scene never splits mid-row.
 */
export async function exportStoryboardPdf(
  board: Board,
  project: Project | null,
  characters: Character[],
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297;
  const PH = 210;
  const M = 12;

  const frames = board.nodes.filter((n): n is FrameNode => n.kind === 'frame');

  const cols = 3;
  const rows = 2;
  const gap = 6;
  const headerH = 22;
  const cellW = (PW - M * 2 - gap * (cols - 1)) / cols;
  const cellH = (PH - M * 2 - headerH - gap * (rows - 1)) / rows;

  let page = 0;
  let idx = 0;

  const drawPageChrome = (pageNo: number, total: number) => {
    doc.setFillColor(PAPER.r, PAPER.g, PAPER.b);
    doc.rect(0, 0, PW, PH, 'F');

    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(board.name, M, M + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DIM.r, DIM.g, DIM.b);
    const sub = [project?.name, `${frames.length} shots`, new Date().toLocaleDateString()]
      .filter(Boolean)
      .join('   ·   ');
    doc.text(sub, M, M + 11);

    doc.setTextColor(CYAN.r, CYAN.g, CYAN.b);
    doc.setFontSize(7);
    doc.text('CREATIVE HUB · STORYBOARD', PW - M, M + 4, { align: 'right' });
    doc.setTextColor(DIM.r, DIM.g, DIM.b);
    doc.text(`Page ${pageNo} of ${total}`, PW - M, M + 9, { align: 'right' });

    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.setLineWidth(0.3);
    doc.line(M, M + 15, PW - M, M + 15);
  };

  const totalPages = Math.max(1, Math.ceil(frames.length / (cols * rows)));

  for (const frame of frames) {
    const slot = idx % (cols * rows);
    if (slot === 0) {
      if (page > 0) doc.addPage();
      page++;
      drawPageChrome(page, totalPages);
    }

    const c = slot % cols;
    const r = Math.floor(slot / cols);
    const x = M + c * (cellW + gap);
    const y = M + headerH + r * (cellH + gap);

    // cell frame
    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.setFillColor(18, 21, 29);
    doc.roundedRect(x, y, cellW, cellH, 1.6, 1.6, 'FD');

    // shot number + scene
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(CYAN.r, CYAN.g, CYAN.b);
    doc.text(`${String(idx + 1).padStart(2, '0')}  ${frame.scene || ''}`.trim(), x + 3, y + 5);

    // image band
    const imgY = y + 7;
    const imgH = cellH * 0.4;
    doc.setFillColor(8, 9, 13);
    doc.rect(x + 3, imgY, cellW - 6, imgH, 'F');

    const data = await assetDataUrl(frame.imageAssetId);
    if (data) {
      try {
        const { w, h } = await imageSize(data);
        const boxW = cellW - 6;
        const scale = Math.min(boxW / w, imgH / h);
        const dw = w * scale;
        const dh = h * scale;
        doc.addImage(data, 'JPEG', x + 3 + (boxW - dw) / 2, imgY + (imgH - dh) / 2, dw, dh);
      } catch {
        /* skip unreadable image */
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(70, 78, 95);
      doc.text(frame.iconOnly ? '[ icon only ]' : '[ no image ]', x + cellW / 2, imgY + imgH / 2, {
        align: 'center',
      });
    }

    // title
    let ty = imgY + imgH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(doc.splitTextToSize(frame.title || 'Untitled', cellW - 6)[0] ?? '', x + 3, ty);

    if (frame.subtitle) {
      ty += 3.6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DIM.r, DIM.g, DIM.b);
      doc.text(doc.splitTextToSize(frame.subtitle, cellW - 6)[0] ?? '', x + 3, ty);
    }

    // labelled rows
    const rowsOut: Array<[string, string]> = [
      ['DESCR', frame.description],
      ['AUDIO', frame.audio],
      ['VIDEO', frame.video],
      ['PROMPT', frame.prompts[0]?.text ?? ''],
    ];

    ty += 4;
    const bottom = y + cellH - 3;
    for (const [k, v] of rowsOut) {
      if (!v?.trim() || ty > bottom - 3) continue;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.4);
      doc.setTextColor(90, 98, 116);
      doc.text(k, x + 3, ty);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.3);
      doc.setTextColor(175, 183, 199);
      const lines = doc.splitTextToSize(v.trim(), cellW - 18) as string[];
      const room = Math.max(0, Math.floor((bottom - ty) / 2.5));
      const shown = lines.slice(0, Math.min(k === 'PROMPT' ? 4 : 2, room));
      shown.forEach((ln, i) => doc.text(ln, x + 14, ty + i * 2.5));
      ty += Math.max(3, shown.length * 2.5) + 1.4;
    }

    idx++;
  }

  if (!frames.length) {
    drawPageChrome(1, 1);
    doc.setTextColor(DIM.r, DIM.g, DIM.b);
    doc.setFontSize(10);
    doc.text('This board has no frames yet.', PW / 2, PH / 2, { align: 'center' });
  }

  // ── appendix: character bible + wire log ──
  const wires = board.wires;
  if (characters.length || wires.length) {
    doc.addPage();
    doc.setFillColor(PAPER.r, PAPER.g, PAPER.b);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text('Appendix', M, M + 6);
    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.line(M, M + 10, PW - M, M + 10);

    let ay = M + 18;
    const colW = (PW - M * 2 - 10) / 2;

    if (characters.length) {
      doc.setFontSize(9);
      doc.setTextColor(CYAN.r, CYAN.g, CYAN.b);
      doc.text('CHARACTER BIBLE', M, ay);
      ay += 5;
      for (const ch of characters) {
        if (ay > PH - M - 8) break;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(INK.r, INK.g, INK.b);
        doc.text(`${ch.name}${ch.role ? ` — ${ch.role}` : ''}`, M, ay);
        ay += 3.2;
        const body = ch.signature || ch.appearance || ch.logline;
        if (body) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.4);
          doc.setTextColor(DIM.r, DIM.g, DIM.b);
          const lines = (doc.splitTextToSize(body, colW) as string[]).slice(0, 4);
          lines.forEach((ln, i) => doc.text(ln, M, ay + i * 2.5));
          ay += lines.length * 2.5;
        }
        ay += 2.5;
      }
    }

    if (wires.length) {
      let wy = M + 18;
      const wx = M + colW + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(CYAN.r, CYAN.g, CYAN.b);
      doc.text('PIPELINE — WIRE LOG', wx, wy);
      wy += 5;
      const nameOf = (id: string) => {
        const n = board.nodes.find((x) => x.id === id);
        return n && n.kind === 'frame' ? n.title : 'node';
      };
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      for (const w of wires) {
        if (wy > PH - M - 4) break;
        doc.setTextColor(DIM.r, DIM.g, DIM.b);
        doc.text(`${nameOf(w.fromId)}  →  ${nameOf(w.toId)}   [${WIRE_LABELS[w.type]}]`, wx, wy);
        wy += 3.4;
      }
    }
  }

  doc.save(`${board.name.replace(/[^\w\s-]/g, '') || 'storyboard'} — storyboard.pdf`);
}

/**
 * Full-canvas export — a picture of the board exactly as laid out, so wire
 * topology and spatial arrangement survive into the PDF.
 *
 * Capture the *surface*, not `.canvas-world`: the world div's children are all
 * absolutely positioned, so its own layout box is 0×0 and html2canvas hands
 * back a zero-size bitmap. The caller frames the camera on the content first.
 */
export async function exportCanvasPdf(board: Board, element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#050609',
    scale: 2,
    logging: false,
    useCORS: true,
    width: element.clientWidth,
    height: element.clientHeight,
  });

  if (!canvas.width || !canvas.height) {
    throw new Error('Nothing to capture — the canvas rendered at zero size.');
  }

  const img = canvas.toDataURL('image/jpeg', 0.92);
  const landscape = canvas.width >= canvas.height;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const PW = landscape ? 297 : 210;
  const PH = landscape ? 210 : 297;
  const M = 10;

  doc.setFillColor(PAPER.r, PAPER.g, PAPER.b);
  doc.rect(0, 0, PW, PH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(board.name, M, M + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(DIM.r, DIM.g, DIM.b);
  doc.text(new Date().toLocaleString(), PW - M, M + 4, { align: 'right' });

  const availW = PW - M * 2;
  const availH = PH - M * 2 - 8;
  const scale = Math.min(availW / canvas.width, availH / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  doc.addImage(img, 'JPEG', M + (availW - w) / 2, M + 8 + (availH - h) / 2, w, h);

  doc.save(`${board.name.replace(/[^\w\s-]/g, '') || 'board'} — canvas.pdf`);
}

// exportProjectJson lives in exportJson.ts — it needs no dependencies, and
// importing it from the hub must not pull jsPDF into the initial bundle.
