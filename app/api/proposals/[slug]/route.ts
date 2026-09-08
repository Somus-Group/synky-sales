import { getD1 } from '@/db';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const proposal = await getD1().prepare('SELECT id, code, client_name AS client, project_name AS project, value_cents AS valueCents, status, validity, template, slug, content_json AS contentJson FROM proposals WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number; code: string; client: string; project: string; valueCents: number; status: string; validity: string; template: string; slug: string; contentJson: string }>();
    if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
    const { contentJson, ...record } = proposal;
    return Response.json({ proposal: { ...record, content: JSON.parse(contentJson || '{}') } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar proposta' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const payload = await request.json() as { status?: string };
    if (payload.status !== 'Aceita') return Response.json({ error: 'Status inválido.' }, { status: 400 });
    const result = await getD1().prepare('UPDATE proposals SET status = ? WHERE slug = ?').bind('Aceita', slug).run();
    if (!result.meta.changes) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
    return Response.json({ status: 'Aceita' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao aceitar proposta' }, { status: 500 });
  }
}
