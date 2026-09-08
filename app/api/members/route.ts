import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const roles = ['Administrador', 'Comercial', 'Arquiteto', 'Visualizador'] as const;

async function canManage(workspaceId: string, userId: string) {
  const member = await getD1().prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1').bind(workspaceId, userId).first<{ role: string }>();
  return member?.role === 'Proprietário' || member?.role === 'Administrador';
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const result = await getD1().prepare('SELECT id, name, email, role, status, created_at AS createdAt, CASE WHEN user_id = ? THEN 1 ELSE 0 END AS isCurrent FROM workspace_members WHERE workspace_id = ? ORDER BY CASE role WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END, id ASC')
      .bind(user.userId, workspaceId, 'Proprietário', 'Administrador').all();
    return Response.json({ members: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar a equipe.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    if (!await canManage(workspaceId, user.userId)) return Response.json({ error: 'Apenas administradores podem adicionar pessoas.' }, { status: 403 });
    const payload = await request.json() as { name?: string; email?: string; role?: string };
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const role = payload.role as typeof roles[number];
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !roles.includes(role)) return Response.json({ error: 'Preencha nome, e-mail e função corretamente.' }, { status: 400 });
    const existing = await getD1().prepare('SELECT id FROM workspace_members WHERE workspace_id = ? AND lower(email) = ? LIMIT 1').bind(workspaceId, email).first();
    if (existing) return Response.json({ error: 'Este e-mail já faz parte da equipe.' }, { status: 409 });
    const result = await getD1().prepare('INSERT INTO workspace_members (workspace_id, user_id, name, email, role, status, invited_by_user_id, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)')
      .bind(workspaceId, name, email, role, 'Acesso preparado', user.userId, Date.now()).run();
    return Response.json({ member: { id: result.meta.last_row_id, name, email, role, status: 'Acesso preparado', createdAt: Date.now(), isCurrent: 0 } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao adicionar usuário.' }, { status: 500 });
  }
}
