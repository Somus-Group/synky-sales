import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const allowedTypes = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']);
const maxSize = 10 * 1024 * 1024;

function filesBucket() {
  const bucket = (env as unknown as { FILES?: R2Bucket }).FILES;
  if (!bucket) throw new Error('Armazenamento de referências indisponível.');
  return bucket;
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const result = await getD1().prepare('SELECT id, name, content_type AS contentType, size_bytes AS sizeBytes, status, created_at AS createdAt FROM proposal_references WHERE workspace_id = ? ORDER BY id DESC').bind(workspaceId).all();
    return Response.json({ references: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar referências.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return Response.json({ error: 'Selecione um arquivo.' }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > maxSize) return Response.json({ error: 'Envie PDF, DOCX, TXT ou Markdown com até 10 MB.' }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100) || 'referencia';
    const objectKey = `${workspaceId.replace(/[^a-zA-Z0-9_-]+/g, '-')}/proposal-references/${crypto.randomUUID()}-${safeName}`;
    await filesBucket().put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name } });
    const result = await getD1().prepare('INSERT INTO proposal_references (workspace_id, name, object_key, content_type, size_bytes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(workspaceId, file.name, objectKey, file.type, file.size, 'Pronta para uso', Date.now()).run();
    return Response.json({ reference: { id: result.meta.last_row_id, name: file.name, contentType: file.type, sizeBytes: file.size, status: 'Pronta para uso', createdAt: Date.now() } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao enviar referência.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const payload = await request.json() as { id?: number };
    const reference = await getD1().prepare('SELECT object_key AS objectKey FROM proposal_references WHERE id = ? AND workspace_id = ? LIMIT 1').bind(Number(payload.id), workspaceId).first<{ objectKey: string }>();
    if (!reference) return Response.json({ error: 'Referência não encontrada.' }, { status: 404 });
    await filesBucket().delete(reference.objectKey);
    await getD1().prepare('DELETE FROM proposal_references WHERE id = ? AND workspace_id = ?').bind(Number(payload.id), workspaceId).run();
    return Response.json({ status: 'deleted' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao remover referência.' }, { status: 500 });
  }
}
