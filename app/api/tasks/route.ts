import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const statuses = new Set(['Entrada', 'Em andamento', 'Aguardando', 'Concluída']);
const priorities = new Set(['Alta', 'Média', 'Baixa']);

type TaskPayload = {
  id?: number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignee?: string;
  project?: string;
  position?: number;
};

type TaskRow = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  project: string;
  completedAt: number | null;
  position: number;
  createdAt: number;
  updatedAt: number;
};

function isoDate(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function cleanDate(value: unknown) {
  const date = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

async function taskWorkspace() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return { workspaceId: await getWorkspaceForUser(user), db: getD1() };
}

async function seedTasks(workspaceId: string) {
  const db = getD1();
  const count = await db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE workspace_id = ?').bind(workspaceId).first<{ count: number }>();
  if (Number(count?.count || 0) > 0) return;
  const now = Date.now();
  const demos = [
    ['Confirmar briefing da Clínica Onyx', 'Revisar objetivos e validar os ambientes prioritários antes da reunião.', 'Em andamento', 'Alta', isoDate(0), 'Wilson', 'Clínica Onyx', null],
    ['Enviar revisão da proposta Casa Serra', 'Ajustar condições comerciais e publicar o novo link da proposta.', 'Entrada', 'Alta', isoDate(1), 'Wilson', 'Casa Serra', null],
    ['Solicitar imagens do portfólio', 'Pedir à equipe as imagens aprovadas para a apresentação comercial.', 'Aguardando', 'Média', isoDate(2), 'Ana', 'Biblioteca da marca', null],
    ['Agendar diagnóstico do Grupo Áurea', 'Confirmar participantes e enviar o convite da reunião.', 'Entrada', 'Média', isoDate(3), 'Wilson', 'Grupo Áurea', null],
    ['Atualizar dados da Marina Alves', 'Cadastro revisado e valor do contrato conferido.', 'Concluída', 'Baixa', isoDate(-1), 'Ana', 'Apartamento Vila Nova', now - 3600000],
  ] as const;
  await db.batch(demos.map((task, index) => db.prepare('INSERT INTO tasks (workspace_id, title, description, status, priority, due_date, assignee, project, completed_at, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(workspaceId, ...task, index, now - index * 60000, now - index * 60000)));
}

async function readTasks(workspaceId: string) {
  const result = await getD1().prepare(`SELECT id, title, description, status, priority, due_date AS dueDate, assignee, project, completed_at AS completedAt, position, created_at AS createdAt, updated_at AS updatedAt
    FROM tasks WHERE workspace_id = ?
    ORDER BY CASE status WHEN 'Entrada' THEN 0 WHEN 'Em andamento' THEN 1 WHEN 'Aguardando' THEN 2 ELSE 3 END, position ASC, updated_at DESC`).bind(workspaceId).all<TaskRow>();
  return result.results;
}

export async function GET() {
  try {
    const context = await taskWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    await seedTasks(context.workspaceId);
    return Response.json({ tasks: await readTasks(context.workspaceId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar ações.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await taskWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as TaskPayload;
    const title = payload.title?.trim();
    if (!title) return Response.json({ error: 'Informe o título da ação.' }, { status: 400 });
    const status = statuses.has(payload.status || '') ? payload.status! : 'Entrada';
    const priority = priorities.has(payload.priority || '') ? payload.priority! : 'Média';
    const now = Date.now();
    const dueDate = cleanDate(payload.dueDate);
    const completedAt = status === 'Concluída' ? now : null;
    const position = Number.isFinite(payload.position) ? Number(payload.position) : now;
    const result = await context.db.prepare('INSERT INTO tasks (workspace_id, title, description, status, priority, due_date, assignee, project, completed_at, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(context.workspaceId, title, payload.description?.trim() || '', status, priority, dueDate, payload.assignee?.trim() || '', payload.project?.trim() || '', completedAt, position, now, now).run();
    const tasks = await readTasks(context.workspaceId);
    return Response.json({ task: tasks.find((task) => task.id === result.meta.last_row_id) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao criar ação.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await taskWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as TaskPayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    const current = await context.db.prepare('SELECT id, title, description, status, priority, due_date AS dueDate, assignee, project, completed_at AS completedAt, position, created_at AS createdAt FROM tasks WHERE id = ? AND workspace_id = ? LIMIT 1').bind(id, context.workspaceId).first<TaskRow>();
    if (!current) return Response.json({ error: 'Ação não encontrada.' }, { status: 404 });
    const title = payload.title === undefined ? current.title : payload.title.trim();
    if (!title) return Response.json({ error: 'Informe o título da ação.' }, { status: 400 });
    const status = payload.status && statuses.has(payload.status) ? payload.status : current.status;
    const priority = payload.priority && priorities.has(payload.priority) ? payload.priority : current.priority;
    const dueDate = payload.dueDate === undefined ? current.dueDate : cleanDate(payload.dueDate);
    const description = payload.description === undefined ? current.description : payload.description.trim();
    const assignee = payload.assignee === undefined ? current.assignee : payload.assignee.trim();
    const project = payload.project === undefined ? current.project : payload.project.trim();
    const position = Number.isFinite(payload.position) ? Number(payload.position) : current.position;
    const updatedAt = Date.now();
    const completedAt = status === 'Concluída' ? current.completedAt || updatedAt : null;
    await context.db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assignee = ?, project = ?, completed_at = ?, position = ?, updated_at = ? WHERE id = ? AND workspace_id = ?').bind(title, description, status, priority, dueDate, assignee, project, completedAt, position, updatedAt, id, context.workspaceId).run();
    return Response.json({ task: { id, title, description, status, priority, dueDate, assignee, project, completedAt, position, createdAt: current.createdAt, updatedAt } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar ação.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await taskWorkspace();
    if (!context) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const payload = await request.json() as { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    const result = await context.db.prepare('DELETE FROM tasks WHERE id = ? AND workspace_id = ?').bind(id, context.workspaceId).run();
    if (!result.meta.changes) return Response.json({ error: 'Ação não encontrada.' }, { status: 404 });
    return Response.json({ status: 'deleted' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao excluir ação.' }, { status: 500 });
  }
}
