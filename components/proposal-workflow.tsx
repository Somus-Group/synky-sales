'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, LayoutTemplate, Loader2, MessageSquare, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { briefFields, briefApprovalError, copyApprovalError, type Briefing, type BriefingResult, type CopyResult, type ProposalCopy } from '@/lib/proposal-workflow';
import type { AgentProfile, Proposal } from './somus-app';

type Props = {
  profile: AgentProfile; onSetup: () => void; onGenerated: (proposal: Proposal) => void;
  onNotify: (message: string) => void;
  renderTemplates: (value: string, change: (value: string) => void) => ReactNode;
  initialTemplate: string;
};
const stages = [
  { title: 'Briefing', detail: 'Entender o cliente', icon: MessageSquare },
  { title: 'Proposta em texto', detail: 'Revisar e aprovar a copy', icon: FileText },
  { title: 'Layout', detail: 'Dar forma ao texto aprovado', icon: LayoutTemplate },
];
const fieldClass = 'w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-base leading-relaxed outline-none focus:ring-2 focus:ring-[#31594E]/30 disabled:opacity-60';

export function ProposalWorkflow({ profile, onSetup, onGenerated, onNotify, renderTemplates, initialTemplate }: Props) {
  const formId = useId();
  const [stage, setStage] = useState(0);
  const [description, setDescription] = useState('');
  const [analyzedDescription, setAnalyzedDescription] = useState('');
  const [briefResult, setBriefResult] = useState<BriefingResult | null>(null);
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [briefApproved, setBriefApproved] = useState(false);
  const [copyApproved, setCopyApproved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [template, setTemplate] = useState(initialTemplate);
  const [validity, setValidity] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 15); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [busy, setBusy] = useState<'briefing' | 'copy' | 'layout' | null>(null);
  const [error, setError] = useState('');
  const configured = profile.status === 'configured';
  const hasAnswers = Object.values(answers).some(v => v.trim());
  const descriptionChanged = !!briefResult && description !== analyzedDescription;

  async function requestPhase(phase: 'briefing' | 'copy') {
    if (busy) return;
    if (phase === 'briefing' && description.trim().length < 30) { setError('Conte mais sobre o cliente e o desafio: pelo menos 30 caracteres.'); return; }
    if (phase === 'copy' && (!briefApproved || !briefResult)) return;
    setBusy(phase); setError('');
    try {
      const response = await fetch('/api/agent/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        phase, description, briefing: briefResult?.briefing, briefingApproved: briefApproved,
        feedback: phase === 'briefing' ? briefResult?.missing_questions.map((q, i) => `${q}\n${answers[i] || 'Ainda não confirmado'}`).join('\n\n') : feedback,
        previousCopy: phase === 'copy' ? copyResult?.proposal : undefined,
      }) });
      const result = await response.json() as BriefingResult & CopyResult & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a etapa.');
      if (phase === 'briefing') {
        setAnalyzedDescription(description);
        setBriefResult(result as BriefingResult); setAnswers({}); setReviewed(false); setBriefApproved(false); setCopyResult(null); setCopyApproved(false);
      } else { setCopyResult(result as CopyResult); setCopyApproved(false); setFeedback(''); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'A conexão falhou. Seu conteúdo foi preservado.'); }
    finally { setBusy(null); }
  }

  function editBrief(key: keyof Briefing, value: string | string[] | number | null) {
    setBriefResult(current => current ? { ...current, briefing: { ...current.briefing, [key]: value } } : current);
    setBriefApproved(false); setCopyApproved(false); setCopyResult(null); setReviewed(false);
  }
  function approveBrief() {
    if (!briefResult || !reviewed || hasAnswers || descriptionChanged) return;
    const issue = briefApprovalError(briefResult.briefing);
    if (issue) { setError(issue); return; }
    setBriefApproved(true); setError(''); setStage(1);
  }
  function editCopy(update: (copy: ProposalCopy) => ProposalCopy) {
    setCopyResult(current => current ? { ...current, proposal: update(current.proposal) } : current);
    setCopyApproved(false);
  }
  function approveCopy() {
    if (!copyResult || !briefApproved) return;
    if (feedback.trim()) { setError('Aplique ou remova o pedido de revisão antes de aprovar o texto.'); return; }
    const issue = copyApprovalError(copyResult.proposal);
    if (issue) { setError(issue); return; }
    setCopyApproved(true); setError(''); setStage(2);
  }
  async function buildLayout() {
    if (!briefApproved || !copyApproved || !briefResult || !copyResult || busy) return;
    if (!validity) { setError('Informe a validade da proposta.'); return; }
    setBusy('layout'); setError('');
    try {
      const brief = briefResult.briefing;
      const content = { ...copyResult.proposal, budget_pending: brief.budget === null };
      const response = await fetch('/api/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        workflow: 'phased', briefingApproved: true, copyApproved: true,
        client: brief.client, project: brief.project, value: brief.budget ?? 0, validity, template,
        brief, content,
      }) });
      const saved = await response.json() as { id?: number; code?: string; slug?: string; error?: string };
      if (!response.ok || !saved.id || !saved.slug || !saved.code) throw new Error(saved.error || 'Não foi possível salvar a proposta. Tente novamente.');
      onGenerated({ id: saved.id, code: saved.code, slug: saved.slug, client: brief.client, project: brief.project, value: brief.budget ?? 0, validity, template, status: 'Rascunho', updated: 'agora', content });
      onNotify('Layout criado com o texto aprovado');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível montar o layout. Seu texto foi preservado.'); }
    finally { setBusy(null); }
  }

  return <div className="mx-auto max-w-5xl pb-8">
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#68746E]">Agente de propostas</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Uma proposta, construída por etapas.</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-[#6E6E73]">Primeiro o contexto do cliente. Depois a argumentação completa. Por último, a apresentação visual.</p></div><Button variant="outline" onClick={onSetup} disabled={!!busy}><SlidersHorizontal />Configurar agente</Button></header>
    <ol className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Etapas da proposta">{stages.map((step, index) => {
      const done = index === 0 ? briefApproved : index === 1 ? copyApproved : false;
      const available = index === 0 || index === 1 && briefApproved || index === 2 && copyApproved;
      return <li key={step.title}><button disabled={!available || !!busy} aria-current={stage === index ? 'step' : undefined} onClick={() => { setStage(index); setError(''); }} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${stage === index ? 'border-[#172A25] bg-[#172A25] text-white' : 'border-black/5 bg-white text-[#6E6E73] disabled:opacity-50'}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${stage === index ? 'bg-white/15' : 'bg-[#F1F3F2]'}`}>{done ? <Check className="size-4" /> : <step.icon className="size-4" />}</span><span><strong className="block text-sm">{index + 1}. {step.title}</strong><span className="mt-1 block text-xs opacity-65">{step.detail}</span></span></button></li>;
    })}</ol>
    {!configured && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-base">Configure os dados, serviços e referências da sua empresa para começar.</p><Button className="mt-3" onClick={onSetup}>Configurar empresa</Button></div>}
    {error && <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">{error}</p>}
    {busy && <output aria-live="polite" className="mb-5 flex items-center gap-3 rounded-2xl bg-[#EDF3F0] p-4 text-sm"><Loader2 className="size-4 animate-spin" />{busy === 'briefing' ? 'Analisando o contexto e preparando as perguntas…' : busy === 'copy' ? 'Redigindo a proposta completa a partir do briefing aprovado…' : 'Aplicando o layout e salvando a proposta…'}</output>}

    {stage === 0 && <div className="space-y-5">
      <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Conte sobre o cliente e a oportunidade</h2><p className="mb-5 mt-2 text-sm leading-relaxed text-[#6E6E73]">Qual é o momento do cliente? O que ele precisa resolver? Quem decide? Informe também escopo, prazo e investimento, se já existirem.</p><label className="block"><span className="sr-only">Descrição da oportunidade</span><textarea rows={6} value={description} disabled={!!busy || !configured} onChange={e => { setDescription(e.target.value); setBriefApproved(false); setReviewed(false); setCopyApproved(false); setCopyResult(null); }} className={fieldClass} placeholder="Ex.: A Clínica Onyx está abrindo uma segunda unidade. A diretora precisa padronizar a experiência do paciente…" /></label><Button className="mt-4 bg-[#172A25] text-white" disabled={!configured || !!busy || description.trim().length < 30} onClick={() => void requestPhase('briefing')}><Sparkles />{briefResult ? 'Atualizar análise do briefing' : 'Analisar contexto do cliente'}</Button></section>
      {briefResult && <>
        <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Minha compreensão do cliente</h2><p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#47534D]">{briefResult.understanding}</p>
          {briefResult.missing_questions.length > 0 && <div className="mt-6 space-y-4 rounded-2xl bg-[#FAF7F0] p-5"><h3 className="font-semibold">O que ainda precisamos esclarecer</h3>{briefResult.missing_questions.map((q, i) => <TextField key={`${i}-${q}`} label={q} value={answers[i] || ''} disabled={!!busy} onChange={value => { setAnswers(current => ({ ...current, [i]: value })); setReviewed(false); setBriefApproved(false); setCopyApproved(false); setCopyResult(null); }} rows={2} />)}<Button variant="outline" disabled={!!busy || !hasAnswers} onClick={() => void requestPhase('briefing')}>Atualizar briefing com as respostas</Button></div>}
        </section>
        <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Revise o briefing</h2><p className="mb-6 mt-2 text-sm text-[#6E6E73]">Você pode corrigir todos os campos. Itens sem informação continuam a confirmar.</p><div className="space-y-5">{briefFields.map(field => <TextField key={field.key} label={`${field.label}${field.list ? ' — um item por linha' : ''}`} value={Array.isArray(briefResult.briefing[field.key]) ? (briefResult.briefing[field.key] as string[]).join('\n') : briefResult.briefing[field.key] as string} onChange={value => editBrief(field.key, field.list ? value.split('\n') : value)} disabled={!!busy} rows={field.key === 'client' || field.key === 'project' || field.key === 'tone' ? 1 : 3} />)}<label htmlFor={`${formId}-budget`} className="block"><span className="mb-2 block text-sm font-medium">Investimento total (R$) — deixe vazio se não estiver definido</span><Input id={`${formId}-budget`} type="number" min={0} step="0.01" disabled={!!busy} value={briefResult.briefing.budget ?? ''} onChange={e => editBrief('budget', e.target.value === '' ? null : Number(e.target.value))} className="h-12 text-base" /></label></div>
          <label htmlFor={`${formId}-reviewed`} className="mt-7 flex items-start gap-3 rounded-2xl bg-[#F3F6F4] p-4 text-sm leading-relaxed"><Checkbox id={`${formId}-reviewed`} checked={reviewed} disabled={!!busy || hasAnswers || descriptionChanged} onCheckedChange={value => { setReviewed(value === true); if (!value) { setBriefApproved(false); setCopyApproved(false); } }} className="mt-0.5" /><span>Revisei o briefing. Os campos em aberto deverão aparecer como “a confirmar”, sem inventar informações.</span></label>
          {descriptionChanged && <p className="mt-3 text-sm text-amber-800">A descrição foi alterada. Atualize a análise antes de aprovar o briefing.</p>}{hasAnswers && <p className="mt-3 text-sm text-amber-800">Atualize o briefing com as respostas antes de aprovar.</p>}
          <Button disabled={!!busy || !reviewed || hasAnswers || descriptionChanged} onClick={approveBrief} className="mt-4 h-auto min-h-11 w-full whitespace-normal bg-[#172A25] py-3 text-white">Aprovar briefing e avançar para o texto<ArrowRight /></Button>
        </section>
      </>}
    </div>}

    {stage === 1 && briefResult && <div className="space-y-5">
      <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#277157]">Briefing aprovado</p><h2 className="mt-2 text-xl font-semibold">{briefResult.briefing.project}</h2><p className="mt-1 text-sm text-[#6E6E73]">{briefResult.briefing.client}</p></div><Button variant="outline" disabled={!!busy} onClick={() => { setStage(0); setError(''); }}><ArrowLeft />Revisar briefing</Button></div>{!copyResult && <><p className="my-6 text-base leading-relaxed text-[#6E6E73]">O agente vai elaborar toda a argumentação: contexto, solução, entregas, processo, investimento e condições. Você lerá e aprovará o texto antes de escolher o visual.</p><Button disabled={!!busy} onClick={() => void requestPhase('copy')} className="bg-[#172A25] text-white"><Sparkles />Elaborar proposta em texto</Button></>}</section>
      {copyResult && <>
        <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Direção da proposta</h2><p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#47534D]">{copyResult.strategy}</p></section>
        <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><h2 className="mb-6 text-xl font-semibold">Proposta completa — revisão do texto</h2><p className="mb-6 text-sm leading-relaxed text-[#6E6E73]">Revise cada seção abaixo. Para mudar escopo, prazo ou investimento, volte ao briefing e gere uma nova versão do texto.</p><div className="space-y-5"><TextField label="Nome da proposta" value={copyResult.proposal.title} onChange={title => editCopy(p => ({ ...p, title }))} disabled={!!busy} rows={1} /><TextField label="Apresentação da proposta" value={copyResult.proposal.subtitle} onChange={subtitle => editCopy(p => ({ ...p, subtitle }))} disabled={!!busy} rows={3} /></div>
          <div className="mt-8 space-y-8">{copyResult.proposal.slides.map((section, i) => <section key={i} className="border-t border-black/10 pt-7"><p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#6E6E73]">Seção {String(i + 1).padStart(2, '0')}</p><div className="space-y-4">{(['eyebrow', 'title', 'body', 'bullets'] as const).map(key => <TextField key={key} label={{ eyebrow: 'Identificação da seção', title: 'Título', body: 'Texto integral', bullets: 'Itens e entregáveis — um por linha' }[key]} value={key === 'bullets' ? section.bullets.join('\n') : section[key]} disabled={!!busy} rows={key === 'body' ? Math.max(4, Math.min(14, Math.ceil(section.body.length / 75))) : key === 'bullets' ? Math.max(3, section.bullets.length) : 2} onChange={value => editCopy(p => ({ ...p, slides: p.slides.map((s, n) => n === i ? { ...s, [key]: key === 'bullets' ? value.split('\n') : value } : s) }))} />)}</div></section>)}</div>
        </section>
        <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><TextField label="O que a IA deve melhorar nesta versão?" value={feedback} onChange={value => { setFeedback(value); setCopyApproved(false); }} disabled={!!busy} rows={3} placeholder="Ex.: Explique melhor o impacto do problema, detalhe as entregas e deixe as condições mais objetivas." /><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Button variant="outline" disabled={!!busy || !feedback.trim()} onClick={() => void requestPhase('copy')}>Revisar texto com IA</Button><Button disabled={!!busy || !!feedback.trim()} onClick={approveCopy} className="h-auto min-h-11 whitespace-normal bg-[#172A25] py-3 text-white sm:ml-auto">Aprovar texto e escolher layout<ArrowRight /></Button></div></section>
      </>}
    </div>}

    {stage === 2 && copyResult && copyApproved && <div className="space-y-5"><section className="rounded-3xl border border-[#CEE1D6] bg-[#F0F7F3] p-5 sm:p-7"><p className="flex items-center gap-2 text-sm font-semibold text-[#277157]"><Check className="size-4" />Briefing e texto aprovados</p><h2 className="mt-3 text-2xl font-semibold">{copyResult.proposal.title}</h2><p className="mt-2 text-base leading-relaxed text-[#53655D]">{copyResult.proposal.slides.length} seções prontas. O layout usará exatamente o conteúdo revisado, com a identidade da sua empresa.</p><Button variant="outline" className="mt-4" disabled={!!busy} onClick={() => { setStage(1); setError(''); }}><ArrowLeft />Voltar ao texto</Button></section><fieldset disabled={!!busy}>{renderTemplates(template, setTemplate)}</fieldset><section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-7"><label htmlFor={`${formId}-validity`} className="block max-w-sm"><span className="mb-2 block text-sm font-medium">Validade da proposta</span><Input id={`${formId}-validity`} type="date" value={validity} onChange={e => setValidity(e.target.value)} disabled={!!busy} className="h-12 text-base" /></label><Button onClick={() => void buildLayout()} disabled={!!busy || !validity} className="mt-5 h-auto min-h-12 w-full whitespace-normal bg-[#172A25] py-3 text-white"><LayoutTemplate />Montar layout com o texto aprovado</Button></section></div>}
  </div>;
}

function TextField({ label, value, onChange, rows, disabled, placeholder }: { label: string; value: string; onChange: (value: string) => void; rows: number; disabled?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-[#4B514E]">{label}</span><textarea className={fieldClass} value={value} onChange={e => onChange(e.target.value)} rows={rows} disabled={disabled} placeholder={placeholder} /></label>;
}
