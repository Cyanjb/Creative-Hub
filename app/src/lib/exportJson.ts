import type { HubState, Project } from '../store/types';

/**
 * Production metadata export. Managed bytes and global templates require the V2 backup command.
 *
 * Kept apart from exportPdf.ts on purpose: this needs no dependencies, and
 * importing it from the hub must not drag jsPDF into the initial bundle.
 */
export function exportProjectJson(state: HubState, project: Project): void {
  const payload = {
    schemaVersion: 2,
    shots: state.shots.filter(s=>s.productionId===project.id),
    exportedAt: new Date().toISOString(),
    project,
    boards: state.boards.filter((b) => b.projectId === project.id),
    characters: state.characters.filter((c) => c.projectId === project.id),
    worlds: state.worlds.filter((w) => w.projectId === project.id),
    scripts: state.scripts.filter((s) => s.projectId === project.id),
    assets: state.assets.filter((a) => a.projectId === project.id),
    resources: state.resources.filter((r) => r.projectId === project.id),
    links: state.links.filter((l) => l.projectId === project.id),
    notes: state.notes.filter((n) => n.projectId === project.id),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${project.name.replace(/[^\w\s-]/g, '') || 'project'}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
