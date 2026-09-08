import { getD1 } from '@/db';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getWorkspaceForUser } from '@/db/workspace';

const demoOpportunities = [
  ['Helena Martins', 'Residência Jardins', 7800000, 'Novo contato', 'Hoje', 'Indicação', '["Prioridade"]'],
  ['Grupo Áurea', 'Escritório corporativo', 12400000, 'Novo contato', '12 set', 'Site', '["Corporativo"]'],
  ['Marina Alves', 'Apartamento Vila Nova', 4250000, 'Diagnóstico', '10 set', 'Instagram', '["Follow-up"]'],
  ['Clínica Onyx', 'Interiores comerciais', 9800000, 'Diagnóstico', '14 set', 'Indicação', '["Saúde","Prioridade"]'],
  ['Rafael e Luiza', 'Casa Serra', 8650000, 'Proposta enviada', 'Vista há 2h', 'Indicação', '["Visualizada"]'],
  ['Ateliê Vértice', 'Showroom conceito', 5600000, 'Proposta enviada', 'Vista ontem', 'Instagram', '["Varejo"]'],
  ['Construtora Lume', 'Áreas comuns', 16400000, 'Negociação', '11 set', 'Parceria', '["Alto valor"]'],
] as const;

const stages = new Set(['Novo contato', 'Diagnóstico', 'Proposta enviada', 'Negociação']);

type OpportunityPayload = {
  client?: string;
  project?: string;
  value?: number;
  stage?: string;
  due?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, string>;
};

function sanitizeTags(tags: unknown) {
  return Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [];
}

function sanitizeCustomFields(fields: unknown) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return {};
  return Object.fromEntries(Object.entries(fields as Record<string, unknown>).map(([key, value]) => [key.trim().slice(0, 60), String(value).trim().slice(0, 240)]).filter(([key, value]) => key && value).slice(0, 20));
}

function parseTags(value: string) { try { return sanitizeTags(JSON.parse(value)); } catch { return []; } }
function parseCustomFields(value: string) { try { return sanitizeCustomFields(JSON.parse(value)); } catch { return {}; } }

async function ensureWorkspaceAndDemoData(user: NonNullable<Awaited<ReturnType<typeof getChatGPTUser>>>) {
  const db = getD1();
  const workspaceId = await getWorkspaceForUser(user);

  const count = await db.prepare('SELECT COUNT(*) AS count FROM opportunities WHERE workspace_id = ?').bind(workspaceId).first<{ count: number }>();
  if (Number(count?.count ?? 0) === 0) {
    await db.batch(demoOpportunities.map((item, index) => {
      const timestamp = Date.now() - index * 6 * 86400000;
      return db.prepare('INSERT INTO opportunities (workspace_id, client_name, project_name, value_cents, stage, next_action, source, tags_json, custom_fields_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(workspaceId, ...item, '{}', timestamp, timestamp);
    }));
  }
  return workspaceId;
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const db = getD1();
    const workspaceId = await ensureWorkspaceAndDemoData(user);
    const result = await db.prepare('SELECT id, client_name AS client, project_name AS project, value_cents AS valueCents, stage, next_action AS due, source, tags_json AS tagsJson, custom_fields_json AS customFieldsJson, created_at AS createdAt, updated_at AS updatedAt FROM opportunities WHERE workspace_id = ? ORDER BY updated_at DESC, id DESC').bind(workspaceId).all<Record<string, unknown> & { tagsJson: string; customFieldsJson: string }>();
    return Response.json({ opportunities: result.results.map(({ tagsJson, customFieldsJson, ...item }) => ({ ...item, tags: parseTags(tagsJson), customFields: parseCustomFields(customFieldsJson) })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar oportunidades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as OpportunityPayload;
    if (!payload.client?.trim() || !payload.project?.trim() || !Number.isFinite(payload.value) || Number(payload.value) < 0) {
      return Response.json({ error: 'Cliente, projeto e valor são obrigatórios.' }, { status: 400 });
    }
    const db = getD1();
    const workspaceId = await ensureWorkspaceAndDemoData(user);
    const stage = stages.has(payload.stage || '') ? payload.stage! : 'Novo contato';
    const tags = sanitizeTags(payload.tags);
    const customFields = sanitizeCustomFields(payload.customFields);
    const now = Date.now();
    const result = await db.prepare('INSERT INTO opportunities (workspace_id, client_name, project_name, value_cents, stage, next_action, source, tags_json, custom_fields_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(workspaceId, payload.client.trim(), payload.project.trim(), Math.round(Number(payload.value) * 100), stage, payload.due?.trim() || 'Hoje', payload.source?.trim() || 'Não informado', JSON.stringify(tags), JSON.stringify(customFields), now, now).run();
    return Response.json({ opportunity: { id: result.meta.last_row_id, client: payload.client.trim(), project: payload.project.trim(), valueCents: Math.round(Number(payload.value) * 100), stage, due: payload.due?.trim() || 'Hoje', source: payload.source?.trim() || 'Não informado', tags, customFields, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao criar oportunidade' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as OpportunityPayload & { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Oportunidade inválida.' }, { status: 400 });
    if (payload.value !== undefined && (!Number.isFinite(payload.value) || Number(payload.value) < 0)) return Response.json({ error: 'Informe um valor válido.' }, { status: 400 });
    const workspaceId = await getWorkspaceForUser(user);
    const db = getD1();
    const current = await db.prepare('SELECT client_name AS client, project_name AS project, value_cents AS valueCents, stage, next_action AS due, source, tags_json AS tagsJson, custom_fields_json AS customFieldsJson, created_at AS createdAt FROM opportunities WHERE id = ? AND workspace_id = ? LIMIT 1').bind(id, workspaceId).first<{ client: string; project: string; valueCents: number; stage: string; due: string; source: string; tagsJson: string; customFieldsJson: string; createdAt: number }>();
    if (!current) return Response.json({ error: 'Oportunidade não encontrada.' }, { status: 404 });
    const stage = stages.has(payload.stage || '') ? payload.stage! : current.stage;
    const client = payload.client?.trim() || current.client;
    const project = payload.project?.trim() || current.project;
    const valueCents = Number.isFinite(payload.value) ? Math.round(Number(payload.value) * 100) : current.valueCents;
    const due = payload.due?.trim() || current.due;
    const source = payload.source?.trim() || current.source;
    const tags = payload.tags === undefined ? parseTags(current.tagsJson) : sanitizeTags(payload.tags);
    const customFields = payload.customFields === undefined ? parseCustomFields(current.customFieldsJson) : sanitizeCustomFields(payload.customFields);
    const updatedAt = Date.now();
    await db.prepare('UPDATE opportunities SET client_name = ?, project_name = ?, value_cents = ?, stage = ?, next_action = ?, source = ?, tags_json = ?, custom_fields_json = ?, updated_at = ? WHERE id = ? AND workspace_id = ?').bind(client, project, valueCents, stage, due, source, JSON.stringify(tags), JSON.stringify(customFields), updatedAt, id, workspaceId).run();
    return Response.json({ opportunity: { id, client, project, valueCents, stage, due, source, tags, customFields, createdAt: current.createdAt, updatedAt } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar oportunidade' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Oportunidade inválida.' }, { status: 400 });
    const workspaceId = await getWorkspaceForUser(user);
    const result = await getD1().prepare('DELETE FROM opportunities WHERE id = ? AND workspace_id = ?').bind(id, workspaceId).run();
    if (!result.meta.changes) return Response.json({ error: 'Oportunidade não encontrada.' }, { status: 404 });
    return Response.json({ status: 'deleted' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao excluir oportunidade' }, { status: 500 });
  }
}
