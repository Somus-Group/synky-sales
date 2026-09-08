'use client';

import { useEffect, useState } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ArtworkProposal } from '@/components/proposal-artwork';
import { ProposalOnePage } from '@/components/proposal-onepage';

type ProposalContent = { brand_name?: string; title: string; subtitle: string; slides: Array<{ type: string; eyebrow: string; title: string; body: string; bullets: string[] }> };
type Proposal = ArtworkProposal & { valueCents: number; status: string; validity: string; slug: string; content?: ProposalContent };
const fallback: Proposal = { code: 'PROP-024', client: 'Rafael e Luiza', project: 'Casa Serra', valueCents: 8650000, status: 'Visualizada', validity: '2026-09-19', template: 'Somus · Editorial Atelier', slug: 'casa-serra' };

export function PublicProposal({ slug }: { slug: string }) {
  const [proposal, setProposal] = useState<Proposal>({ ...fallback, slug });
  const [notFound, setNotFound] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    void fetch(`/api/proposals/${slug}`).then(async (response) => {
      if (!response.ok) { setNotFound(true); return; }
      const data = await response.json() as { proposal: Proposal };
      setProposal(data.proposal);
      setAccepted(data.proposal.status === 'Aceita');
    }).catch(() => undefined);
  }, [slug]);

  async function accept() {
    setAccepting(true);
    const response = await fetch(`/api/proposals/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Aceita' }) }).catch(() => null);
    if (response?.ok) setAccepted(true);
    setAccepting(false);
  }

  if (notFound) return <main className="grid min-h-screen place-items-center bg-[#111113] px-6 text-center text-white"><div><span className="mx-auto grid size-11 place-items-center rounded-[14px] bg-white text-sm font-semibold text-black">S</span><h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">Proposta não encontrada</h1><p className="mt-2 text-sm text-white/45">Confira se o link recebido está completo ou solicite um novo acesso ao escritório.</p></div></main>;

  return <main className="min-h-screen"><ProposalOnePage proposal={proposal} accepted={accepted} accepting={accepting} onAccept={accept} actions={<div className="ml-2 flex items-center gap-1"><Button onClick={() => window.print()} variant="ghost" size="sm" className="rounded-xl text-current hover:bg-current/10 hover:text-current"><Download /><span className="hidden xl:inline">PDF</span></Button><Button onClick={() => void document.documentElement.requestFullscreen?.()} variant="ghost" size="icon-sm" className="rounded-xl text-current hover:bg-current/10 hover:text-current" aria-label="Tela cheia"><Maximize2 /></Button></div>} /></main>;
}
