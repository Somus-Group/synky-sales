import type { ChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';

export async function getWorkspaceForUser(user: ChatGPTUser) {
  const db = getD1();
  const email = user.email.trim().toLowerCase();
  const membership = await db.prepare('SELECT workspace_id AS workspaceId FROM workspace_members WHERE lower(email) = ? ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END, id ASC LIMIT 1')
    .bind(email, user.userId).first<{ workspaceId: string }>();

  if (membership) {
    await db.prepare('UPDATE workspace_members SET user_id = ?, status = ? WHERE workspace_id = ? AND lower(email) = ?')
      .bind(user.userId, 'Ativo', membership.workspaceId, email).run();
    return membership.workspaceId;
  }

  const workspaceId = `workspace:${user.userId}`;
  await db.prepare('INSERT OR IGNORE INTO workspaces (id, name, owner_user_id, created_at) VALUES (?, ?, ?, ?)')
    .bind(workspaceId, 'Somus Group', user.userId, Date.now()).run();
  await db.prepare('INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, name, email, role, status, invited_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(workspaceId, user.userId, user.fullName || user.displayName || email.split('@')[0], email, 'Proprietário', 'Ativo', user.userId, Date.now()).run();
  return workspaceId;
}
