import type { ArtworkProposal } from '../components/proposal-artwork';

export type ProposalCopy = NonNullable<ArtworkProposal['content']> & {
  brand_name: string; title: string; subtitle: string;
  slides: Array<{ type: string; eyebrow: string; title: string; body: string; bullets: string[] }>;
};
export type Briefing = {
  client: string; project: string; business_context: string; problem: string;
  objectives: string[]; scope: string; deliverables: string[]; audience: string;
  tone: string; schedule: string; budget: number | null; success_criteria: string[];
  decision_makers: string; constraints: string; exclusions: string; payment_terms: string;
};
export type BriefingResult = { understanding: string; briefing: Briefing; missing_questions: string[] };
export type CopyResult = { strategy: string; proposal: ProposalCopy };

export const briefFields: Array<{ key: Exclude<keyof Briefing, 'budget'>; label: string; list?: boolean }> = [
  { key: 'client', label: 'Cliente' }, { key: 'project', label: 'Projeto ou serviço' },
  { key: 'business_context', label: 'Contexto e momento do cliente' }, { key: 'problem', label: 'Problema e impacto no negócio' },
  { key: 'objectives', label: 'Objetivos', list: true }, { key: 'audience', label: 'Público e beneficiários' },
  { key: 'decision_makers', label: 'Decisores e critérios de escolha' }, { key: 'scope', label: 'Escopo da solução' },
  { key: 'deliverables', label: 'Entregáveis', list: true }, { key: 'exclusions', label: 'O que não está incluído' },
  { key: 'constraints', label: 'Restrições e dependências' }, { key: 'schedule', label: 'Prazo e marcos' },
  { key: 'payment_terms', label: 'Condições comerciais' }, { key: 'success_criteria', label: 'Critérios de sucesso', list: true },
  { key: 'tone', label: 'Tom da comunicação' },
];
const string = { type: 'string' };
const strings = { type: 'array', items: string };
export const briefingSchema = {
  type: 'object', additionalProperties: false, required: ['understanding', 'briefing', 'missing_questions'],
  properties: {
    understanding: string, missing_questions: strings,
    briefing: { type: 'object', additionalProperties: false, required: [...briefFields.map(f => f.key), 'budget'],
      properties: { ...Object.fromEntries(briefFields.map(f => [f.key, f.list ? strings : string])), budget: { type: ['number', 'null'] } } },
  },
};
export const copySchema = {
  type: 'object', additionalProperties: false, required: ['strategy', 'proposal'],
  properties: { strategy: string, proposal: {
    type: 'object', additionalProperties: false, required: ['brand_name', 'title', 'subtitle', 'slides'],
    properties: { brand_name: string, title: string, subtitle: string, slides: { type: 'array', minItems: 6, maxItems: 12,
      items: { type: 'object', additionalProperties: false, required: ['type', 'eyebrow', 'title', 'body', 'bullets'],
        properties: { type: { type: 'string', enum: ['cover', 'context', 'objectives', 'solution', 'scope', 'process', 'investment', 'closing'] }, eyebrow: string, title: string, body: string, bullets: strings } } } },
  } },
};

export function isBriefing(value: unknown): value is Briefing {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return briefFields.every(f => f.list ? Array.isArray(b[f.key]) && (b[f.key] as unknown[]).every(v => typeof v === 'string') : typeof b[f.key] === 'string')
    && (b.budget === null || typeof b.budget === 'number' && Number.isFinite(b.budget) && b.budget >= 0);
}
export function briefApprovalError(brief: Briefing): string | null {
  if (!isBriefing(brief)) return 'Revise os campos do briefing e informe um investimento válido ou deixe-o em aberto.';
  if (!brief.client.trim() || !brief.project.trim() || !brief.business_context.trim() || !brief.problem.trim() || !brief.scope.trim() || !brief.objectives.some(v => v.trim()) || !brief.deliverables.some(v => v.trim())) return 'Complete cliente, projeto, contexto, problema, objetivos, escopo e entregáveis antes de aprovar.';
  return null;
}
export function isProposalCopy(value: unknown): value is ProposalCopy {
  if (!value || typeof value !== 'object') return false;
  const p = value as ProposalCopy;
  return ['brand_name', 'title', 'subtitle'].every(key => typeof p[key as keyof ProposalCopy] === 'string')
    && Array.isArray(p.slides) && p.slides.length >= 6 && p.slides.length <= 12
    && p.slides.every(s => s && ['type', 'eyebrow', 'title', 'body'].every(k => typeof s[k as keyof typeof s] === 'string') && Array.isArray(s.bullets) && s.bullets.every(b => typeof b === 'string'))
    && p.slides[0].type === 'cover' && p.slides.at(-1)?.type === 'closing'
    && p.slides.filter(s => s.type === 'investment').length === 1
    && p.slides.slice(1, -1).every(s => ['context', 'objectives', 'solution', 'scope', 'process', 'investment'].includes(s.type));
}
export function copyApprovalError(copy: ProposalCopy): string | null {
  if (!isProposalCopy(copy) || !copy.title.trim() || !copy.subtitle.trim() || copy.slides.some(s => !s.title.trim() || !s.body.trim())) return 'Revise os títulos e textos de todas as seções antes de aprovar a proposta.';
  return null;
}
