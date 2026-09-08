import { env } from 'cloudflare:workers';
import { getD1 } from '@/db';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('Imagem não encontrada.', { status: 404 });
    const asset = await getD1().prepare('SELECT object_key AS objectKey, content_type AS contentType FROM brand_assets WHERE public_token = ? LIMIT 1').bind(token).first<{ objectKey: string; contentType: string }>();
    if (!asset) return new Response('Imagem não encontrada.', { status: 404 });
    const bucket = (env as unknown as { FILES?: R2Bucket }).FILES;
    if (!bucket) return new Response('Biblioteca indisponível.', { status: 503 });
    const object = await bucket.get(asset.objectKey);
    if (!object) return new Response('Imagem não encontrada.', { status: 404 });
    const headers = new Headers({ 'Content-Type': asset.contentType, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', ETag: object.httpEtag });
    return new Response(object.body, { headers });
  } catch {
    return new Response('Falha ao carregar a imagem.', { status: 500 });
  }
}
