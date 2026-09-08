import { getD1 } from '@/db';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getWorkspaceForUser } from '@/db/workspace';
import { isBriefing, isProposalCopy, briefApprovalError, copyApprovalError } from '@/lib/proposal-workflow';

const demos = [
  ['PROP-024', 'Rafael e Luiza', 'Casa Serra', 8650000, 'Visualizada', '2026-09-19', 'Somus · Editorial', 'casa-serra'],
  ['PROP-023', 'Ateliê Vértice', 'Showroom conceito', 5600000, 'Enviada', '2026-09-18', 'Somus · Editorial', 'showroom-vertice'],
  ['PROP-022', 'Construtora Lume', 'Áreas comuns', 16400000, 'Em negociação', '2026-09-15', 'Somus · Essencial', 'areas-comuns-lume'],
  ['PROP-021', 'Marina Alves', 'Apartamento Vila Nova', 4250000, 'Aceita', '2026-09-10', 'Somus · Editorial', 'apartamento-vila-nova'],
] as const;

async function ensureWorkspaceAndDemoData(user: NonNullable<Awaited<ReturnType<typeof getChatGPTUser>>>) {
  const db = getD1();
  const workspaceId = await getWorkspaceForUser(user);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM proposals WHERE workspace_id = ?').bind(workspaceId).first<{ count: number }>();
  if (Number(count?.count ?? 0) === 0) {
    const workspaceSuffix = user.userId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(-18) || 'workspace';
    await db.batch(demos.map(([code, client, project, value, status, validity, template, slug]) => db.prepare('INSERT INTO proposals (workspace_id, code, client_name, project_name, value_cents, status, validity, template, slug, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(workspaceId, code, client, project, value, status, validity, template, `${slug}-${workspaceSuffix}`, Date.now())));
  }
  return workspaceId;
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const db = getD1();
    const workspaceId = await ensureWorkspaceAndDemoData(user);
    const result = await db.prepare('SELECT id, code, client_name AS client, project_name AS project, value_cents AS valueCents, status, validity, template, slug, content_json AS contentJson, created_at AS createdAt FROM proposals WHERE workspace_id = ? ORDER BY id DESC').bind(workspaceId).all<Record<string, unknown> & { contentJson?: string }>();
    const proposals = result.results.map(({ contentJson, ...proposal }) => {
      try { return { ...proposal, content: JSON.parse(contentJson || '{}') }; }
      catch { return { ...proposal, content: {} }; }
    });
    return Response.json({ proposals });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar propostas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as { client?: string; project?: string; value?: number; validity?: string; template?: string; brief?: unknown; content?: unknown; workflow?: string; briefingApproved?: boolean; copyApproved?: boolean };
    if (payload.workflow === 'phased') {
      if (payload.briefingApproved !== true || payload.copyApproved !== true) return Response.json({ error: 'Aprove o briefing e o texto antes de montar o layout.' }, { status: 409 });
      if (!isBriefing(payload.brief) || !isProposalCopy(payload.content)) return Response.json({ error: 'Briefing ou proposta incompletos.' }, { status: 400 });
      const issue = briefApprovalError(payload.brief) || copyApprovalError(payload.content);
      if (issue) return Response.json({ error: issue }, { status: 400 });
      payload.client = payload.brief.client;
      payload.project = payload.brief.project;
      payload.value = payload.brief.budget ?? 0;
      payload.content = { ...payload.content, budget_pending: payload.brief.budget === null };
    }
    if (!payload.client?.trim() || !payload.project?.trim()) return Response.json({ error: 'Cliente e projeto são obrigatórios.' }, { status: 400 });
    const db = getD1();
    const workspaceId = await ensureWorkspaceAndDemoData(user);
    const count = await db.prepare('SELECT COUNT(*) AS count FROM proposals WHERE workspace_id = ?').bind(workspaceId).first<{ count: number }>();
    const code = `PROP-${String(25 + Number(count?.count ?? 0) - 4).padStart(3, '0')}`;
    const slugBase = `${payload.project}-${Date.now().toString(36)}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await db.prepare('INSERT INTO proposals (workspace_id, code, client_name, project_name, value_cents, status, validity, template, slug, brief_json, content_json, agent_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(workspaceId, code, payload.client.trim(), payload.project.trim(), Math.round(Number(payload.value ?? 0) * 100), 'Rascunho', payload.validity || '2026-09-30', payload.template || 'Somus · Editorial Atelier', slugBase, JSON.stringify(payload.brief ?? {}), JSON.stringify(payload.content ?? {}), 'generated', Date.now()).run();
    return Response.json({ id: result.meta.last_row_id, code, slug: slugBase, status: 'created' }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao criar proposta' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as { id?: number; project?: string; client?: string; value?: number; template?: string; content?: unknown };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Proposta inválida.' }, { status: 400 });
    const workspaceId = await getWorkspaceForUser(user);
    const db = getD1();
    const current = await db.prepare('SELECT client_name AS client, project_name AS project, value_cents AS valueCents, template, content_json AS contentJson FROM proposals WHERE id = ? AND workspace_id = ? LIMIT 1').bind(id, workspaceId).first<{ client: string; project: string; valueCents: number; template: string; contentJson: string }>();
    if (!current) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
    const project = payload.project?.trim() || current.project;
    const client = payload.client?.trim() || current.client;
    const valueCents = Number.isFinite(payload.value) && Number(payload.value) >= 0 ? Math.round(Number(payload.value) * 100) : current.valueCents;
    const template = payload.template?.trim() || current.template;
    const contentJson = payload.content === undefined ? current.contentJson : JSON.stringify(payload.content);
    if (contentJson.length > 250_000) return Response.json({ error: 'O conteúdo da proposta excede o limite permitido.' }, { status: 413 });
    await db.prepare('UPDATE proposals SET client_name = ?, project_name = ?, value_cents = ?, template = ?, content_json = ? WHERE id = ? AND workspace_id = ?').bind(client, project, valueCents, template, contentJson, id, workspaceId).run();
    return Response.json({ proposal: { id, client, project, valueCents, template, content: JSON.parse(contentJson || '{}') } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar proposta' }, { status: 500 });
  }
}
