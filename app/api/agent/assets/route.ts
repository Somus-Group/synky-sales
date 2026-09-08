import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedKinds = new Set(['logo', 'portfolio', 'gallery']);
const maxSize = 8 * 1024 * 1024;

type StoredAsset = {
  id: number;
  publicToken: string;
  kind: string;
  name: string;
  caption: string;
  contentType: string;
  sizeBytes: number;
  createdAt: number;
};

function filesBucket() {
  const bucket = (env as unknown as { FILES?: R2Bucket }).FILES;
  if (!bucket) throw new Error('Biblioteca de imagens indisponível.');
  return bucket;
}

function publicAsset(asset: StoredAsset) {
  return { ...asset, url: `/api/assets/${asset.publicToken}` };
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const result = await getD1().prepare('SELECT id, public_token AS publicToken, kind, name, caption, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM brand_assets WHERE workspace_id = ? ORDER BY CASE kind WHEN \'logo\' THEN 0 WHEN \'portfolio\' THEN 1 ELSE 2 END, id DESC').bind(workspaceId).all<StoredAsset>();
    return Response.json({ assets: result.results.map(publicAsset) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar a biblioteca visual.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const form = await request.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') || 'gallery');
    const caption = String(form.get('caption') || '').trim().slice(0, 160);
    if (!(file instanceof File)) return Response.json({ error: 'Selecione uma imagem.' }, { status: 400 });
    if (!allowedKinds.has(kind)) return Response.json({ error: 'Categoria de imagem inválida.' }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > maxSize) return Response.json({ error: 'Envie JPG, PNG ou WebP com até 8 MB.' }, { status: 400 });
    const db = getD1();
    const count = await db.prepare('SELECT COUNT(*) AS count FROM brand_assets WHERE workspace_id = ? AND kind != ?').bind(workspaceId, 'logo').first<{ count: number }>();
    if (kind !== 'logo' && Number(count?.count ?? 0) >= 24) return Response.json({ error: 'A biblioteca visual comporta até 24 imagens.' }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100) || 'imagem';
    const publicToken = crypto.randomUUID();
    const objectKey = `${workspaceId.replace(/[^a-zA-Z0-9_-]+/g, '-')}/brand-assets/${publicToken}-${safeName}`;
    await filesBucket().put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name, kind } });

    if (kind === 'logo') {
      const previous = await db.prepare('SELECT object_key AS objectKey FROM brand_assets WHERE workspace_id = ? AND kind = ?').bind(workspaceId, 'logo').all<{ objectKey: string }>();
      for (const asset of previous.results) await filesBucket().delete(asset.objectKey);
      await db.prepare('DELETE FROM brand_assets WHERE workspace_id = ? AND kind = ?').bind(workspaceId, 'logo').run();
    }

    const createdAt = Date.now();
    const result = await db.prepare('INSERT INTO brand_assets (workspace_id, public_token, kind, name, caption, object_key, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(workspaceId, publicToken, kind, file.name, caption, objectKey, file.type, file.size, createdAt).run();
    return Response.json({ asset: publicAsset({ id: Number(result.meta.last_row_id), publicToken, kind, name: file.name, caption, contentType: file.type, sizeBytes: file.size, createdAt }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao enviar a imagem.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const payload = await request.json() as { id?: number; caption?: string; kind?: string };
    const id = Number(payload.id);
    const kind = String(payload.kind || 'gallery');
    if (!Number.isInteger(id) || !allowedKinds.has(kind) || kind === 'logo') return Response.json({ error: 'Imagem inválida.' }, { status: 400 });
    const caption = String(payload.caption || '').trim().slice(0, 160);
    const result = await getD1().prepare('UPDATE brand_assets SET caption = ?, kind = ? WHERE id = ? AND workspace_id = ? AND kind != ?').bind(caption, kind, id, workspaceId, 'logo').run();
    if (!result.meta.changes) return Response.json({ error: 'Imagem não encontrada.' }, { status: 404 });
    return Response.json({ asset: { id, caption, kind } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar a imagem.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const payload = await request.json() as { id?: number };
    const id = Number(payload.id);
    const asset = await getD1().prepare('SELECT object_key AS objectKey FROM brand_assets WHERE id = ? AND workspace_id = ? LIMIT 1').bind(id, workspaceId).first<{ objectKey: string }>();
    if (!asset) return Response.json({ error: 'Imagem não encontrada.' }, { status: 404 });
    await filesBucket().delete(asset.objectKey);
    await getD1().prepare('DELETE FROM brand_assets WHERE id = ? AND workspace_id = ?').bind(id, workspaceId).run();
    return Response.json({ status: 'deleted' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao remover a imagem.' }, { status: 500 });
  }
}
