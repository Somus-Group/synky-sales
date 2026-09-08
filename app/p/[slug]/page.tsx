import type { Metadata } from 'next';
import { PublicProposal } from '@/components/public-proposal';
import { getD1 } from '@/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let proposal: { client: string; project: string; contentJson: string } | null = null;
  try {
    proposal = await getD1().prepare('SELECT client_name AS client, project_name AS project, content_json AS contentJson FROM proposals WHERE slug = ? LIMIT 1').bind(slug).first<{ client: string; project: string; contentJson: string }>();
  } catch {
    proposal = null;
  }
  const project = proposal?.project ?? 'Proposta comercial';
  const client = proposal?.client ?? 'cliente Somus';
  let brand = 'Somus';
  try { brand = JSON.parse(proposal?.contentJson || '{}').brand_name || brand; } catch { /* Mantém a marca padrão. */ }
  const title = `${project} · Proposta ${brand}`;
  const description = `Proposta comercial preparada pela ${brand} para ${client}.`;
  return { title, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicProposal slug={slug} />;
}
