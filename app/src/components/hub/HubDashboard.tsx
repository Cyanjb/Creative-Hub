import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { relativeTime } from '../../lib/id';
import { TEMPLATES, type TemplateId } from '../../lib/boardTemplates';
import { Modal, Field, ConfirmModal, toast } from '../ui/Bits';
import { IconBack, IconTrash, IconDownload } from '../ui/Icons';
import { exportProjectJson } from '../../lib/exportJson';

export function HubDashboard() {
  const projects = useStore((s) => s.projects);
  const boards = useStore((s) => s.boards);
  const characters = useStore((s) => s.characters);
  const assets = useStore((s) => s.assets);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const openProject = useStore((s) => s.openProject);

  const project = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <div className="hub">
      <div className="hub-inner">
        {project ? (
          <ProjectDetail projectId={project.id} onBack={() => openProject(null)} />
        ) : (
          <>
            <div className="hub-head">
              <div>
                <h1 className="hub-title">Creative Hub</h1>
                <p className="hub-sub">
                  Storyboards, pipeline boards and infinite whiteboards — with a character bible,
                  world builder and script room that follow through into every prompt.
                </p>
              </div>
            </div>

            <div className="hub-stats">
              <div className="hub-stat">
                <b>{projects.length}</b>
                <span>Projects</span>
              </div>
              <div className="hub-stat">
                <b>{boards.length}</b>
                <span>Boards</span>
              </div>
              <div className="hub-stat">
                <b>{characters.length}</b>
                <span>Characters</span>
              </div>
              <div className="hub-stat">
                <b>{assets.length}</b>
                <span>Assets</span>
              </div>
            </div>

            <ProjectList />
          </>
        )}
      </div>
    </div>
  );
}

function ProjectList() {
  const projects = useStore((s) => s.projects);
  const boards = useStore((s) => s.boards);
  const createProject = useStore((s) => s.createProject);
  const openProject = useStore((s) => s.openProject);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const p = createProject(n, desc.trim());
    setCreating(false);
    setName('');
    setDesc('');
    openProject(p.id);
  };

  return (
    <>
      <h2 className="section-title" style={{ marginBottom: 14 }}>
        Projects
      </h2>
      <div className="project-grid">
        {projects.map((p) => {
          const n = boards.filter((b) => b.projectId === p.id).length;
          return (
            <button
              key={p.id}
              className="project-card"
              style={{ ['--accent' as string]: p.color }}
              onClick={() => openProject(p.id)}
            >
              <h3>{p.name}</h3>
              <p>{p.description || 'No description yet.'}</p>
              <div className="project-meta">
                <span>
                  {n} board{n === 1 ? '' : 's'}
                </span>
                <span>·</span>
                <span>{relativeTime(p.updatedAt)}</span>
              </div>
            </button>
          );
        })}

        <button className="project-card project-new" onClick={() => setCreating(true)}>
          <span className="plus">+</span>
          <span>New project</span>
        </button>
      </div>

      {creating && (
        <Modal
          title="New project"
          onClose={() => setCreating(false)}
          footer={
            <>
              <button className="btn" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>
                Create project
              </button>
            </>
          }
        >
          <Field label="Project name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neon Harbour — Season 1"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <Field label="Description" hint="Optional. What is this project, in one line?">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="A short-form sci-fi series about…"
            />
          </Field>
        </Modal>
      )}
    </>
  );
}

function ProjectDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const state = useStore();
  const project = state.projects.find((p) => p.id === projectId)!;
  const boards = state.boards.filter((b) => b.projectId === projectId);
  const [newBoard, setNewBoard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmProject, setConfirmProject] = useState(false);

  if (!project) return null;

  return (
    <>
      <div className="crumb">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <IconBack size={13} /> All projects
        </button>
        <span className="dim">/</span>
        <span style={{ color: 'var(--tx)' }}>{project.name}</span>
      </div>

      <div className="hub-head" style={{ marginBottom: 26 }}>
        <div style={{ flex: 1 }}>
          <input
            className="ghost-input"
            value={project.name}
            onChange={(e) => state.updateProject(project.id, { name: e.target.value })}
            style={{ fontSize: 26, fontWeight: 650, letterSpacing: '-0.025em', marginBottom: 4 }}
          />
          <input
            className="ghost-input"
            value={project.description}
            placeholder="Add a description…"
            onChange={(e) => state.updateProject(project.id, { description: e.target.value })}
            style={{ fontSize: 13.5, color: 'var(--tx-3)' }}
          />
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              exportProjectJson(state, project);
              toast('Project exported as JSON', 'ok');
            }}
          >
            <IconDownload size={14} /> Backup
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmProject(true)}>
            <IconTrash size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setNewBoard(true)}>
            + New board
          </button>
        </div>
      </div>

      <div className="hub-stats" style={{ marginBottom: 28 }}>
        <div className="hub-stat">
          <b>{boards.length}</b>
          <span>Boards</span>
        </div>
        <div className="hub-stat">
          <b>{state.characters.filter((c) => c.projectId === projectId).length}</b>
          <span>Characters</span>
        </div>
        <div className="hub-stat">
          <b>{state.worlds.filter((w) => w.projectId === projectId).length}</b>
          <span>World entries</span>
        </div>
        <div className="hub-stat">
          <b>{state.scripts.filter((s) => s.projectId === projectId).length}</b>
          <span>Scripts</span>
        </div>
        <div className="hub-stat">
          <b>{state.assets.filter((a) => a.projectId === projectId).length}</b>
          <span>Assets</span>
        </div>
      </div>

      <h2 className="section-title" style={{ marginBottom: 14 }}>
        Boards
      </h2>

      {!boards.length ? (
        <div className="empty">
          <span className="big">▦</span>
          <p>No boards in this project yet. Start from a template — or an empty canvas.</p>
          <button className="btn btn-primary" onClick={() => setNewBoard(true)}>
            + New board
          </button>
        </div>
      ) : (
        <div className="board-grid">
          {boards.map((b) => {
            const frames = b.nodes.filter((n) => (n.kind === 'frame'||n.kind === 'placement')).length;
            return (
              <div key={b.id} className="board-card" style={{ position: 'relative' }}>
                <button
                  onClick={() => state.openBoard(b.id)}
                  style={{ textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <span className="kind">{b.kind}</span>
                  <h4>{b.name}</h4>
                  <div className="spacer" />
                  <div className="row" style={{ fontSize: 11, color: 'var(--tx-4)', gap: 8 }}>
                    <span>{frames} frames</span>
                    <span>·</span>
                    <span>{b.wires.length} wires</span>
                    <span>·</span>
                    <span>{relativeTime(b.updatedAt)}</span>
                  </div>
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-danger"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => setConfirmDelete(b.id)}
                  title="Delete board"
                >
                  <IconTrash size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {newBoard && <NewBoardModal projectId={projectId} onClose={() => setNewBoard(false)} />}

      {confirmDelete && (
        <ConfirmModal
          title="Delete board?"
          message="This removes the board and everything on it. Characters, world entries and assets stay in the project."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            state.deleteBoard(confirmDelete);
            setConfirmDelete(null);
            toast('Board deleted');
          }}
        />
      )}

      {confirmProject && (
        <ConfirmModal
          title="Delete project?"
          message={`"${project.name}" and all its boards, characters, world entries, scripts and assets will be removed. This cannot be undone.`}
          confirmLabel="Delete everything"
          onCancel={() => setConfirmProject(false)}
          onConfirm={() => {
            state.deleteProject(project.id);
            setConfirmProject(false);
            toast('Project deleted');
          }}
        />
      )}
    </>
  );
}

export function NewBoardModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createBoard = useStore((s) => s.createBoard);
  const openBoard = useStore((s) => s.openBoard);
  const [name, setName] = useState('');
  const [tpl, setTpl] = useState<TemplateId>('storyboard');

  const submit = () => {
    const meta = TEMPLATES.find((t) => t.id === tpl)!;
    const b = createBoard(projectId, name.trim() || meta.name, tpl);
    onClose();
    openBoard(b.id);
    toast(`"${b.name}" created`, 'ok');
  };

  return (
    <Modal
      title="New board"
      onClose={onClose}
      width={620}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Create board
          </button>
        </>
      }
    >
      <Field label="Board name" hint="Leave blank to use the template name.">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Episode 1 — Cold Open"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </Field>

      <div className="label" style={{ marginBottom: 9 }}>
        Template
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className="tpl-card"
            style={{
              ['--accent' as string]: t.accent,
              borderColor: tpl === t.id ? 'var(--cyan)' : undefined,
              background: tpl === t.id ? 'rgba(34,211,238,0.07)' : undefined,
            }}
            onClick={() => setTpl(t.id)}
          >
            <span className="ico">{t.icon}</span>
            <b>{t.name}</b>
            <p>{t.blurb}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
