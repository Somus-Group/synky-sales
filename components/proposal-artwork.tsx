'use client';

import { Check, Loader2 } from 'lucide-react';
import { getProposalTemplate, proposalTemplates, type ProposalTemplateTheme } from '@/lib/proposal-templates';

export type ProposalTemplateId = ProposalTemplateTheme;
export type ProposalSlideContent = { type: string; eyebrow: string; title: string; body: string; bullets: string[]; backgroundColor?: string };
export type ArtworkProposal = {
  code: string;
  client: string;
  project: string;
  template?: string;
  value?: number;
  valueCents?: number;
  validity?: string;
  content?: {
    budget_pending?: boolean;
    brand_name?: string;
    logo_url?: string;
    hero_image_url?: string;
    primary_color?: string;
    secondary_color?: string;
    company?: { description?: string; website?: string; email?: string; phone?: string; address?: string; instagram?: string };
    portfolio_images?: Array<{ url: string; name: string; caption: string }>;
    title?: string;
    subtitle?: string;
    slides?: ProposalSlideContent[];
  };
};

export { proposalTemplates };

export function resolveProposalTemplate(template?: string): ProposalTemplateId {
  const value = (template || '').toLowerCase();
  const catalogTemplate = proposalTemplates.find((item) => item.value.toLowerCase() === value || item.id === value);
  if (catalogTemplate) return catalogTemplate.theme;
  if (value.includes('noir') || value.includes('essencial')) return 'noir';
  if (value.includes('prisma') || value.includes('agent')) return 'prisma';
  return 'editorial';
}

export function ProposalArtwork({ index, proposal, accepted = false, accepting = false, onAccept }: { index: number; proposal: ArtworkProposal; accepted?: boolean; accepting?: boolean; onAccept?: () => void }) {
  const template = resolveProposalTemplate(proposal.template);
  const slide = template === 'noir'
    ? <NoirSlide index={index} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />
    : template === 'prisma'
      ? <PrismaSlide index={index} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />
      : <EditorialSlide index={index} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />;
  return <div className="h-full w-full overflow-hidden [container-type:inline-size]">{slide}</div>;
}

export function ProposalThumbnail({ template, index = 0 }: { template?: string; index?: number }) {
  const resolved = resolveProposalTemplate(template);
  const swatches = getProposalTemplate(template).swatches;
  if (resolved === 'noir') return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: swatches[0] }}><span className="absolute left-[9%] top-[14%] h-[8%] w-[22%]" style={{ backgroundColor: swatches[1] }} /><span className="absolute bottom-[18%] left-[9%] h-[11%] w-[72%] bg-white" /><span className="absolute bottom-[8%] left-[9%] h-[5%] w-[35%] bg-white/30" /><i className="absolute -right-[18%] top-[10%] size-[68%] rounded-full border" style={{ borderColor: swatches[1] }} /></div>;
  if (resolved === 'prisma') return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: swatches[0] }}><i className="absolute -right-[12%] -top-[30%] size-[78%] rounded-full blur-[4px]" style={{ backgroundColor: swatches[1] }} /><i className="absolute -bottom-[42%] left-[12%] size-[76%] rounded-full blur-[5px]" style={{ backgroundColor: swatches[2] }} /><span className="absolute bottom-[16%] left-[9%] h-[10%] w-[66%] bg-white" /><span className="absolute bottom-[7%] left-[9%] h-[4%] w-[28%] bg-white/45" /></div>;
  return <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: swatches[0] }}><div className="absolute inset-0 bg-[url('/proposal/editorial-cover.png')] bg-cover bg-center opacity-65" /><div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" /><span className="absolute bottom-[18%] left-[9%] h-[10%] w-[64%]" style={{ backgroundColor: swatches[2] }} /><span className="absolute bottom-[7%] left-[9%] h-[4%] w-[28%]" style={{ backgroundColor: swatches[1] }} />{index > 0 && <i className="absolute right-[8%] top-[10%] text-[18px] not-italic text-white/60">0{index + 1}</i>}</div>;
}

function EditorialSlide({ index, proposal, accepted, accepting, onAccept }: SlideProps) {
  const data = getSlideData(index, proposal);
  if (index === 0) return <div className="relative h-full overflow-hidden bg-[#2F241E] text-[#FFF9F0]"><div className="absolute inset-0 bg-[url('/proposal/editorial-cover.png')] bg-cover bg-center" /><div className="absolute inset-0 bg-gradient-to-r from-[#160F0B]/90 via-[#1B120D]/48 to-black/12" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" /><Brand name={data.brand} light className="absolute left-[5.5%] top-[6.5%]" /><div className="absolute bottom-[8%] left-[5.5%] right-[5.5%]"><p className="text-[clamp(6px,0.75cqw,12px)] uppercase tracking-[0.28em] text-[#F0C58E]">{data.eyebrow} · {proposal.code}</p><h1 style={{ fontSize: coverTitleSize(data.title, 'editorial') }} className="mt-[2.4%] max-w-[76%] font-serif font-normal leading-[0.91] tracking-[-0.055em] [overflow-wrap:anywhere]">{data.title}</h1><div className="mt-[4.5%] flex items-end justify-between border-t border-white/25 pt-[2%] text-[clamp(7px,0.82cqw,13px)]"><span className="max-w-[48%] italic text-white/58">{data.subtitle}</span><span className="text-right"><small className="block text-[0.72em] uppercase tracking-[0.2em] text-white/42">Preparada para</small><strong className="mt-[0.5em] block font-medium">{proposal.client}</strong></span></div></div><span className="absolute right-[5.5%] top-[6.5%] text-[clamp(6px,0.7cqw,10px)] uppercase tracking-[0.22em] text-white/55">Uma proposta com intenção</span></div>;
  if (data.closing) return <Closing theme="editorial" data={data} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />;
  if (data.investment) return <div className="grid h-full grid-cols-[1.08fr_0.92fr] bg-[#B86538] text-[#FFF8EE]"><div className="flex flex-col justify-between p-[7%]"><Brand name={data.brand} light /><div><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.28em] text-white/58">{data.eyebrow}</p><h2 className="mt-[4%] max-w-[85%] font-serif text-[clamp(30px,5.2cqw,78px)] font-normal leading-[0.94] tracking-[-0.055em]">Investimento que sustenta a entrega.</h2><p className="mt-[4%] max-w-[72%] text-[clamp(7px,0.84cqw,13px)] leading-[1.6] text-white/62">{data.body}</p></div></div><div className="flex flex-col justify-center bg-[#F3EADF] p-[10%] text-[#2F241E]"><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.26em] text-[#8A705E]">Investimento total</p><strong className="mt-[5%] font-serif text-[clamp(30px,5.3cqw,82px)] font-normal leading-none tracking-[-0.06em]">{data.money}</strong><div className="mt-[10%] space-y-[4%] border-t border-[#2F241E]/18 pt-[6%]">{data.bullets.slice(0, 3).map((bullet, itemIndex) => <div key={bullet} className="flex gap-[5%] text-[clamp(7px,0.85cqw,13px)]"><span className="text-[#B86538]">0{itemIndex + 1}</span><span>{bullet}</span></div>)}</div><p className="mt-[10%] text-[clamp(6px,0.72cqw,11px)] text-[#8A705E]">Validade · {formatValidity(proposal.validity)}</p></div></div>;
  if (index % 2 === 1) return <div className="grid h-full grid-cols-[0.72fr_1.28fr] bg-[#EFE5D8] text-[#2F241E]"><div className="relative overflow-hidden"><div className="absolute inset-0 scale-110 bg-[url('/proposal/editorial-cover.png')] bg-cover bg-[70%_center] grayscale-[15%]" /><div className="absolute inset-0 bg-[#8C4B2B]/20 mix-blend-multiply" /><Brand name={data.brand} light className="absolute left-[11%] top-[9%]" /><span className="absolute bottom-[8%] left-[11%] font-serif text-[clamp(32px,6cqw,92px)] italic text-white/85">0{index}</span></div><div className="flex flex-col justify-center p-[9%]"><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.28em] text-[#A85B36]">{data.eyebrow}</p><h2 className="mt-[4%] max-w-[90%] font-serif text-[clamp(28px,4.9cqw,74px)] font-normal leading-[0.94] tracking-[-0.05em]">{data.title}</h2><p className="mt-[5%] max-w-[82%] text-[clamp(7px,0.86cqw,13px)] leading-[1.7] text-[#2F241E]/62">{data.body}</p>{data.bullets.length > 0 && <div className="mt-[6%] grid grid-cols-2 gap-x-[5%] gap-y-[3%]">{data.bullets.slice(0, 4).map((bullet, itemIndex) => <div key={bullet} className="border-t border-[#2F241E]/18 pt-[3%] text-[clamp(6px,0.78cqw,12px)]"><span className="mr-[7%] text-[#A85B36]">0{itemIndex + 1}</span>{bullet}</div>)}</div>}</div></div>;
  return <div className="h-full bg-[#F7F1E8] p-[5.5%] text-[#2F241E]"><div className="flex items-start justify-between"><div><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.28em] text-[#A85B36]">{data.eyebrow}</p><h2 className="mt-[2.5%] max-w-[78%] font-serif text-[clamp(28px,4.7cqw,70px)] font-normal leading-[0.94] tracking-[-0.05em]">{data.title}</h2></div><Brand name={data.brand} /></div><div className="mt-[5%] grid grid-cols-3 border-y border-[#2F241E]/16">{data.bullets.slice(0, 3).map((bullet, itemIndex) => <div key={bullet} className="min-h-0 border-r border-[#2F241E]/16 p-[7%] last:border-r-0"><span className="font-serif text-[clamp(18px,3.3cqw,50px)] italic text-[#B86538]">0{itemIndex + 1}</span><h3 className="mt-[13%] text-[clamp(11px,1.65cqw,25px)] font-medium leading-[1.08] tracking-[-0.03em]">{bullet}</h3><p className="mt-[7%] text-[clamp(6px,0.72cqw,11px)] leading-[1.6] text-[#2F241E]/52">{data.body}</p></div>)}</div></div>;
}

function NoirSlide({ index, proposal, accepted, accepting, onAccept }: SlideProps) {
  const data = getSlideData(index, proposal);
  if (index === 0) return <div className="relative h-full overflow-hidden bg-[#0B0B0C] p-[5.5%] text-white"><GridLines /><Brand name={data.brand} light /><div className="absolute left-[5.5%] right-[5.5%] top-[24%] z-10"><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.3em] text-[#D7FF38]">{data.eyebrow} / {proposal.code}</p><h1 style={{ fontSize: coverTitleSize(data.title, 'noir') }} className="mt-[2.5%] max-w-[78%] font-black uppercase leading-[0.82] tracking-[-0.07em] [overflow-wrap:anywhere]">{data.title}</h1></div><div className="absolute bottom-[6%] left-[5.5%] right-[5.5%] flex items-end justify-between border-t border-white/18 pt-[1.7%]"><p className="max-w-[48%] text-[clamp(6px,0.82cqw,13px)] leading-[1.5] text-white/50">{data.subtitle}</p><strong className="max-w-[38%] truncate rounded-full bg-[#D7FF38] px-[2.2%] py-[1%] text-[clamp(6px,0.76cqw,11px)] uppercase tracking-[0.16em] text-black">{proposal.client}</strong></div><i className="absolute -right-[9%] top-[8%] size-[45%] rounded-full border border-[#D7FF38]/35" /><i className="absolute right-[2%] top-[19%] size-[22%] rounded-full bg-[#D7FF38] blur-[90px] opacity-10" /></div>;
  if (data.closing) return <Closing theme="noir" data={data} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />;
  if (data.investment) return <div className="grid h-full grid-cols-[0.9fr_1.1fr] bg-[#D7FF38] text-black"><div className="flex flex-col justify-between border-r border-black/20 p-[8%]"><Brand name={data.brand} /><div><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.28em]">{data.eyebrow}</p><h2 className="mt-[5%] text-[clamp(34px,6.2cqw,94px)] font-black uppercase leading-[0.8] tracking-[-0.075em]">Valor<br />em ação.</h2></div></div><div className="flex flex-col justify-center bg-[#0B0B0C] p-[10%] text-white"><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.26em] text-[#D7FF38]">Investimento total</p><strong className="mt-[5%] text-[clamp(34px,5.8cqw,88px)] font-black tracking-[-0.07em]">{data.money}</strong><p className="mt-[4%] max-w-[74%] text-[clamp(6px,0.8cqw,12px)] leading-[1.6] text-white/45">{data.body}</p><div className="mt-[8%] flex gap-[2%]">{data.bullets.slice(0, 3).map((bullet) => <span key={bullet} className="rounded-full border border-white/18 px-[2.6%] py-[1.2%] text-[clamp(5px,0.65cqw,10px)] uppercase tracking-[0.1em] text-white/65">{bullet}</span>)}</div></div></div>;
  return <div className="relative h-full overflow-hidden bg-[#F1EEE7] p-[5.5%] text-[#0D0D0D]"><div className="absolute right-0 top-0 h-full w-[9%] bg-[#D7FF38]" /><div className="flex items-start justify-between pr-[9%]"><Brand name={data.brand} /><span className="text-[clamp(7px,1cqw,15px)] font-black">0{index}</span></div><div className="mt-[7%] grid grid-cols-[0.9fr_1.1fr] gap-[8%] pr-[9%]"><div><p className="text-[clamp(6px,0.72cqw,11px)] font-bold uppercase tracking-[0.28em]">{data.eyebrow}</p><h2 className="mt-[4%] text-[clamp(30px,5.5cqw,84px)] font-black uppercase leading-[0.82] tracking-[-0.07em]">{data.title}</h2></div><div className="pt-[2%]"><p className="max-w-[90%] text-[clamp(8px,1.05cqw,16px)] leading-[1.65] text-black/58">{data.body}</p><div className="mt-[7%] divide-y divide-black/20 border-y border-black/20">{data.bullets.slice(0, 4).map((bullet, itemIndex) => <div key={bullet} className="flex items-center gap-[5%] py-[3%] text-[clamp(7px,0.9cqw,14px)] font-medium"><span className="grid size-[1.7em] place-items-center bg-[#D7FF38] text-[0.72em] font-black">{itemIndex + 1}</span>{bullet}</div>)}</div></div></div></div>;
}

function PrismaSlide({ index, proposal, accepted, accepting, onAccept }: SlideProps) {
  const data = getSlideData(index, proposal);
  if (index === 0) return <div className="relative h-full overflow-hidden bg-[#3434D8] p-[5.5%] text-white"><PrismaOrbs /><Brand name={data.brand} light /><div className="absolute bottom-[8%] left-[5.5%] right-[5.5%] z-10"><p className="text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.3em] text-[#E9FF70]">{data.eyebrow} · {proposal.code}</p><h1 style={{ fontSize: coverTitleSize(data.title, 'prisma') }} className="mt-[2.4%] max-w-[78%] font-semibold leading-[0.9] tracking-[-0.065em] [overflow-wrap:anywhere]">{data.title}</h1><div className="mt-[4.5%] flex items-end justify-between border-t border-white/28 pt-[1.8%]"><p className="max-w-[45%] text-[clamp(6px,0.8cqw,12px)] text-white/58">{data.subtitle}</p><strong className="max-w-[42%] truncate text-[clamp(7px,1cqw,15px)] font-medium">{proposal.client}</strong></div></div></div>;
  if (data.closing) return <Closing theme="prisma" data={data} proposal={proposal} accepted={accepted} accepting={accepting} onAccept={onAccept} />;
  if (data.investment) return <div className="relative h-full overflow-hidden bg-[#FF5D45] p-[6%] text-[#17171B]"><i className="absolute -right-[12%] -top-[30%] size-[75%] rounded-full bg-[#E9FF70]" /><i className="absolute -bottom-[45%] left-[27%] size-[78%] rounded-full bg-[#3434D8]" /><div className="relative z-10 flex h-full flex-col justify-between"><Brand name={data.brand} /><div><p className="text-[clamp(6px,0.72cqw,11px)] font-semibold uppercase tracking-[0.28em]">{data.eyebrow}</p><strong className="mt-[3%] block text-[clamp(38px,7.3cqw,110px)] font-semibold leading-none tracking-[-0.075em]">{data.money}</strong><div className="mt-[4%] flex max-w-[64%] gap-[2%]">{data.bullets.slice(0, 3).map((bullet) => <span key={bullet} className="rounded-full border border-black/30 bg-white/20 px-[2.7%] py-[1.2%] text-[clamp(6px,0.72cqw,11px)] font-medium backdrop-blur">{bullet}</span>)}</div></div></div></div>;
  return <div className="relative h-full overflow-hidden bg-[#F5F2EB] p-[5.5%] text-[#17171B]"><span className="absolute right-[4%] top-[3%] text-[clamp(64px,14cqw,210px)] font-semibold leading-none tracking-[-0.09em] text-[#3434D8]/[0.07]">0{index}</span><div className="relative z-10 flex items-start justify-between"><Brand name={data.brand} /><span className="rounded-full bg-[#E9FF70] px-[2%] py-[0.8%] text-[clamp(5px,0.68cqw,10px)] font-semibold uppercase tracking-[0.16em]">{data.eyebrow}</span></div><div className="relative z-10 mt-[6%] grid grid-cols-[1.1fr_0.9fr] gap-[8%]"><div><h2 className="text-[clamp(30px,5.6cqw,84px)] font-semibold leading-[0.86] tracking-[-0.07em]">{data.title}</h2><p className="mt-[5%] max-w-[76%] text-[clamp(7px,0.9cqw,14px)] leading-[1.65] text-black/52">{data.body}</p></div><div className="grid grid-cols-2 gap-[3%]">{data.bullets.slice(0, 4).map((bullet, itemIndex) => <div key={bullet} className={`${itemIndex % 3 === 0 ? 'bg-[#3434D8] text-white' : itemIndex % 3 === 1 ? 'bg-[#FF5D45]' : 'bg-[#E9FF70]'} flex aspect-square flex-col justify-between rounded-[10%] p-[10%]`}><span className="text-[clamp(6px,0.72cqw,11px)] opacity-55">0{itemIndex + 1}</span><strong className="text-[clamp(9px,1.35cqw,20px)] font-semibold leading-tight tracking-[-0.03em]">{bullet}</strong></div>)}</div></div></div>;
}

function Closing({ theme, data, proposal, accepted, accepting, onAccept }: { theme: ProposalTemplateId; data: SlideData; proposal: ArtworkProposal; accepted: boolean; accepting: boolean; onAccept?: () => void }) {
  const palette = theme === 'editorial' ? 'bg-[#2F241E] text-[#FFF8EE]' : theme === 'noir' ? 'bg-[#0B0B0C] text-white' : 'bg-[#3434D8] text-white';
  const accent = theme === 'editorial' ? 'bg-[#B86538] text-white' : theme === 'noir' ? 'bg-[#D7FF38] text-black' : 'bg-[#E9FF70] text-black';
  return <div className={`relative flex h-full items-center justify-center overflow-hidden p-[7%] text-center ${palette}`}>{theme === 'noir' && <GridLines />}{theme === 'prisma' && <PrismaOrbs />}<Brand name={data.brand} light className="absolute left-[5.5%] top-[6.5%] z-10" /><div className="relative z-10"><p className={`text-[clamp(6px,0.72cqw,11px)] uppercase tracking-[0.3em] ${theme === 'noir' ? 'text-[#D7FF38]' : theme === 'prisma' ? 'text-[#E9FF70]' : 'text-[#E7AA69]'}`}>{data.eyebrow}</p><h2 className={`mx-auto mt-[4%] max-w-[82%] text-[clamp(30px,5.7cqw,86px)] leading-[0.9] tracking-[-0.065em] ${theme === 'editorial' ? 'font-serif font-normal' : 'font-semibold'}`}>{data.title}</h2><p className="mx-auto mt-[4%] max-w-[55%] text-[clamp(7px,0.86cqw,13px)] leading-[1.55] text-white/48">{data.body}</p>{accepted ? <div className={`mx-auto mt-[5%] flex w-fit items-center gap-2 rounded-full px-[3.2%] py-[1.4%] text-[clamp(6px,0.8cqw,12px)] font-semibold ${accent}`}><Check className="size-[1.1em]" />Proposta aceita</div> : <button disabled={accepting} onClick={onAccept} className={`mt-[5%] inline-flex items-center gap-2 rounded-full px-[3.5%] py-[1.5%] text-[clamp(6px,0.8cqw,12px)] font-semibold transition-transform hover:scale-[1.025] disabled:opacity-60 ${accent}`}>{accepting ? <Loader2 className="size-[1.1em] animate-spin" /> : <Check className="size-[1.1em]" />}{onAccept ? 'Aceitar proposta' : 'Pronta para apresentar'}</button>}</div><span className="absolute bottom-[5%] z-10 text-[clamp(5px,0.62cqw,9px)] uppercase tracking-[0.22em] text-white/25">{data.brand} · {proposal.code}</span></div>;
}

type SlideProps = { index: number; proposal: ArtworkProposal; accepted: boolean; accepting: boolean; onAccept?: () => void };
type SlideData = { brand: string; eyebrow: string; title: string; body: string; subtitle: string; bullets: string[]; money: string; investment: boolean; closing: boolean };

function coverTitleSize(title: string, theme: ProposalTemplateId) {
  const length = title.trim().length;
  const scale = length > 54 ? 4.1 : length > 36 ? 4.8 : length > 22 ? 5.8 : theme === 'noir' ? 7.4 : 6.8;
  const maximum = theme === 'noir' ? 92 : theme === 'prisma' ? 86 : 80;
  return `clamp(17px, ${scale}cqw, ${maximum}px)`;
}

function getSlideData(index: number, proposal: ArtworkProposal): SlideData {
  const slides = proposal.content?.slides || [];
  const generated = slides[index];
  const last = Math.max(4, slides.length - 1);
  const defaults = [
    { eyebrow: 'Proposta comercial', title: proposal.project, body: '', bullets: [] },
    { eyebrow: '01 · Nossa leitura', title: 'Compreender antes de propor.', body: 'Toda grande entrega começa pela leitura precisa do contexto, das prioridades e do resultado que realmente importa.', bullets: [] },
    { eyebrow: '02 · A solução', title: 'Uma jornada desenhada para gerar valor.', body: 'Transformamos complexidade em um caminho claro, próximo e consistente.', bullets: ['Imersão', 'Estratégia', 'Desenvolvimento'] },
    { eyebrow: '03 · Método', title: 'Clareza em cada movimento.', body: 'Cada etapa existe para sustentar decisões melhores e preservar a qualidade da entrega.', bullets: ['Descoberta', 'Direção', 'Execução', 'Evolução'] },
    { eyebrow: '04 · Investimento', title: '', body: 'Um investimento alinhado à profundidade, ao cuidado e ao impacto da solução proposta.', bullets: ['Escopo completo', 'Cronograma acordado', 'Acompanhamento próximo'] },
    { eyebrow: 'Próximo passo', title: 'Vamos construir algo relevante juntos?', body: 'Estamos prontos para transformar esta oportunidade em uma entrega memorável.', bullets: [] },
  ];
  const fallbackIndex = index === last ? 5 : Math.min(index, 4);
  const fallback = defaults[fallbackIndex];
  const rawValue = proposal.value ?? ((proposal.valueCents ?? 0) / 100);
  return {
    brand: proposal.content?.brand_name || 'SOMUS',
    eyebrow: generated?.eyebrow || fallback.eyebrow,
    title: generated?.title || fallback.title,
    body: generated?.body || fallback.body,
    subtitle: proposal.content?.subtitle || 'Uma solução construída com clareza, intenção e alto padrão de entrega.',
    bullets: generated?.bullets?.length ? generated.bullets : fallback.bullets,
    money: money.format(rawValue),
    investment: generated?.type === 'investment' || (!generated && index === last - 1),
    closing: generated?.type === 'closing' || index === last,
  };
}

function Brand({ name, light, className = '' }: { name: string; light?: boolean; className?: string }) { return <div className={`flex items-center gap-[0.7em] text-[clamp(6px,0.72cqw,11px)] font-semibold uppercase tracking-[0.22em] ${className}`}><span className={`grid size-[2.1em] place-items-center rounded-full border text-[0.72em] ${light ? 'border-white/35 text-white' : 'border-black/25 text-black'}`}>{name.slice(0, 1)}</span>{name}</div>; }
function GridLines() { return <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '9.1% 16.66%' }} />; }
function PrismaOrbs() { return <><i className="absolute -right-[8%] -top-[25%] size-[62%] rounded-full bg-[#FF5D45] blur-[2px]" /><i className="absolute -bottom-[38%] left-[28%] size-[68%] rounded-full bg-[#E9FF70] blur-[3px]" /><i className="absolute right-[24%] top-[14%] size-[24%] rounded-full bg-[#8E5BFF] blur-[34px] opacity-80" /><div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#3434D8]/10 to-[#3434D8]/70" /></>; }
function formatValidity(value?: string) { if (!value) return '15 dias'; const parsed = new Date(`${value}T12:00:00`); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR'); }
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
