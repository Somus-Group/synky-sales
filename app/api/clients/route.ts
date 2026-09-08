import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const statuses = new Set(['Lead', 'Ativo', 'Inativo', 'Arquivado']);

type ClientPayload = {
  id?: number;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  document?: string;
  status?: string;
  contractValue?: number;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, string>;
};

type ClientRow = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  document: string;
  status: string;
  contractValueCents: number;
  tagsJson: string;
  notes: string;
  customFieldsJson: string;
  createdAt: number;
  updatedAt: number;
};

function sanitizeTags(tags: unknown) { return Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : []; }
function sanitizeCustomFields(fields: unknown) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return {};
  return Object.fromEntries(Object.entries(fields as Record<string, unknown>).map(([key, value]) => [key.trim().slice(0, 60), String(value).trim().slice(0, 240)]).filter(([key, value]) => key && value).slice(0, 20));
}
function parseTags(value: string) { try { return sanitizeTags(JSON.parse(value)); } catch { return []; } }
function parseCustomFields(value: string) { try { return sanitizeCustomFields(JSON.parse(value)); } catch { return {}; } }

async function clientWorkspace() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return { user, workspaceId: await getWorkspaceForUser(user), db: getD1() };
}

async function seedFromOpportunities(workspaceId: string) {
  const db = getD1();
  const count = await db.prepare('SELECT COUNT(*) AS count FROM clients WHERE workspace_id = ?').bind(workspaceId).first<{ count: number }>();
  if (Number(count?.count || 0) > 0) return;
  await db.prepare(`INSERT INTO clients (workspace_id, name, company, email, phone, document, status, contract_value_cents, tags_json, notes, custom_fields_json, created_at, updated_at)
    SELECT workspace_id, client_name, '', '', '', '', 'Ativo', MAX(value_cents), '[]', '', '{}', MIN(created_at), MAX(CASE WHEN updated_at = 0 THEN created_at ELSE updated_at END)
    FROM opportunities WHERE workspace_id = ? GROUP BY workspace_id, client_name`).bind(workspaceId).run();
}

async function readClients(workspaceId: string) {
  const result = await getD1().prepare('SELECT id, name, company, email, phone, document, status, contract_value_cents AS contractValueCents, tags_json AS tagsJson, notes, custom_fields_json AS customFieldsJson, created_at AS createdAt, updated_at AS updatedAt FROM clients WHERE workspace_id = ? ORDER BY updated_at DESC, id DESC').bind(workspaceId).all<ClientRow>();
  return result.results.map(({ tagsJson, customFieldsJson, ...client }) => ({ ...client, tags: parseTags(tagsJson), customFields: parseCustomFields(customFieldsJson) }));
}

export async function GET() {
  try {
    const context = await clientWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    await seedFromOpportunities(context.workspaceId);
    return Response.json({ clients: await readClients(context.workspaceId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar clientes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await clientWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as ClientPayload;
    if (!payload.name?.trim()) return Response.json({ error: 'Informe o nome do cliente.' }, { status: 400 });
    if (!Number.isFinite(payload.contractValue) || Number(payload.contractValue) < 0) return Response.json({ error: 'Informe um valor de contrato válido.' }, { status: 400 });
    const status = statuses.has(payload.status || '') ? payload.status! : 'Ativo';
    const tags = sanitizeTags(payload.tags);
    const customFields = sanitizeCustomFields(payload.customFields);
    const now = Date.now();
    const result = await context.db.prepare('INSERT INTO clients (workspace_id, name, company, email, phone, document, status, contract_value_cents, tags_json, notes, custom_fields_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(context.workspaceId, payload.name.trim(), payload.company?.trim() || '', payload.email?.trim() || '', payload.phone?.trim() || '', payload.document?.trim() || '', status, Math.round(Number(payload.contractValue) * 100), JSON.stringify(tags), payload.notes?.trim() || '', JSON.stringify(customFields), now, now).run();
    const clients = await readClients(context.workspaceId);
    return Response.json({ client: clients.find((client) => client.id === result.meta.last_row_id) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao criar cliente.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await clientWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as ClientPayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0 || !payload.name?.trim()) return Response.json({ error: 'Cliente inválido.' }, { status: 400 });
    if (!Number.isFinite(payload.contractValue) || Number(payload.contractValue) < 0) return Response.json({ error: 'Informe um valor de contrato válido.' }, { status: 400 });
    const status = statuses.has(payload.status || '') ? payload.status! : 'Ativo';
    const updatedAt = Date.now();
    const result = await context.db.prepare('UPDATE clients SET name = ?, company = ?, email = ?, phone = ?, document = ?, status = ?, contract_value_cents = ?, tags_json = ?, notes = ?, custom_fields_json = ?, updated_at = ? WHERE id = ? AND workspace_id = ?').bind(payload.name.trim(), payload.company?.trim() || '', payload.email?.trim() || '', payload.phone?.trim() || '', payload.document?.trim() || '', status, Math.round(Number(payload.contractValue) * 100), JSON.stringify(sanitizeTags(payload.tags)), payload.notes?.trim() || '', JSON.stringify(sanitizeCustomFields(payload.customFields)), updatedAt, id, context.workspaceId).run();
    if (!result.meta.changes) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    const clients = await readClients(context.workspaceId);
    return Response.json({ client: clients.find((client) => client.id === id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar cliente.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await clientWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Cliente inválido.' }, { status: 400 });
    const result = await context.db.prepare('DELETE FROM clients WHERE id = ? AND workspace_id = ?').bind(id, context.workspaceId).run();
    if (!result.meta.changes) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    return Response.json({ status: 'deleted' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao excluir cliente.' }, { status: 500 });
  }
}
