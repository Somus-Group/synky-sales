import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
// Transpile the real modules; external services are isolated test doubles.
function load(path, mocks = {}) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const mod = { exports: {} };
  // Only executes trusted repository source, never user or AI-provided content.
  // oxlint-disable-next-line typescript/no-implied-eval
  new Function('require', 'module', 'exports', outputText)(id => id in mocks ? mocks[id] : require(id), mod, mod.exports);
  return mod.exports;
}
const workflow = load('lib/proposal-workflow.ts');
const brief = Object.fromEntries(workflow.briefFields.map(f => [f.key, f.list ? ['Entrega confirmada'] : 'Informação confirmada']));
brief.budget = null;
const sectionTypes = ['cover', 'context', 'scope', 'process', 'investment', 'closing'];
const copy = {
  brand_name: 'Marca de teste', title: 'Proposta de teste', subtitle: 'Apresentação aprovada',
  slides: sectionTypes.map((type, index) => ({
    type, eyebrow: 'Etapa ' + index, title: 'Título aprovado ' + index,
    body: 'Parágrafo aprovado ' + index + '\nSegundo parágrafo.',
    bullets: Array.from({ length: 7 }, (_, n) => 'Item aprovado ' + index + '-' + n),
  })),
};
test('briefing: campos essenciais e orçamento desconhecido', () => {
  assert.equal(workflow.isBriefing(brief), true);
  assert.equal(workflow.briefApprovalError(brief), null);
  assert.ok(workflow.briefApprovalError({ ...brief, problem: '' }));
  assert.ok(workflow.briefApprovalError({ ...brief, objectives: [' '] }));
  assert.equal(workflow.isBriefing({ ...brief, budget: -1 }), false);
  assert.equal(workflow.isBriefing({ ...brief, budget: Infinity }), false);
});
test('copy: exige texto integral, capa, investimento único e encerramento', () => {
  assert.equal(workflow.copyApprovalError(copy), null);
  assert.equal(workflow.isProposalCopy({ ...copy, slides: copy.slides.slice(1) }), false);
  assert.equal(workflow.isProposalCopy({ ...copy, slides: copy.slides.map((s, i) => i === 2 ? { ...s, type: 'investment' } : s) }), false);
  assert.equal(workflow.isProposalCopy({ ...copy, slides: copy.slides.map((s, i) => i === 2 ? { ...s, type: 'unknown' } : s) }), false);
  assert.ok(workflow.copyApprovalError({ ...copy, slides: copy.slides.map((s, i) => i === 2 ? { ...s, body: ' ' } : s) }));
});

function serviceMocks(key) {
  const env = key ? { OPENAI_API_KEY: 'test-only-key' } : {};
  const writes = [];
  const db = { prepare(sql) {
    return { bind(...args) {
      return {
        first: async () => sql.includes('agent_profiles') ? { status: 'configured', businessName: 'Marca de teste', servicesJson: '[]' } : { count: 4 },
        all: async () => ({ results: [] }),
        run: async () => { writes.push({ sql, args }); return { meta: { last_row_id: 77 } }; },
      };
    } };
  } };
  return { writes, modules: {
    'cloudflare:workers': { env },
    '@/app/chatgpt-auth': { getChatGPTUser: async () => ({ userId: 'test-user' }) },
    '@/db': { getD1: () => db },
    '@/db/workspace': { getWorkspaceForUser: async () => 'test-workspace' },
    '@/lib/proposal-workflow': workflow,
  } };
}
const request = payload => new Request('http://localhost/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
test('agente: não pula briefing e não simula IA desconectada', async () => {
  const { POST } = load('app/api/agent/generate/route.ts', serviceMocks(false).modules);
  assert.equal((await POST(request({ description: 'Contexto bastante detalhado do cliente e do seu projeto.' }))).status, 400);
  assert.equal((await POST(request({ phase: 'copy', briefing: brief }))).status, 409);
  assert.equal((await POST(request({ phase: 'copy', briefing: brief, briefingApproved: true }))).status, 503);
  const result = await POST(request({ phase: 'briefing', description: 'Contexto bastante detalhado do cliente e do seu projeto.' }));
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, 'ai_not_configured');
});
test('agente: chamadas separadas, revisão e resposta inválida', async () => {
  const { POST } = load('app/api/agent/generate/route.ts', serviceMocks(true).modules);
  const originalFetch = globalThis.fetch;
  const calls = [];
  let generated = { understanding: 'Síntese', briefing: brief, missing_questions: ['Qual o prazo?'] };
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({ status: 'completed', output: [{ content: [{ text: JSON.stringify(generated) }] }] });
  };
  try {
    const first = await POST(request({ phase: 'briefing', description: 'Contexto bastante detalhado do cliente e do seu projeto.' }));
    assert.equal(first.status, 200);
    assert.equal((await first.json()).proposal, undefined);
    assert.equal(calls[0].text.format.name, 'client_briefing');
    assert.equal(calls[0].text.format.schema.properties.proposal, undefined);
    generated = { strategy: 'Relação problema-solução', proposal: copy };
    const second = await POST(request({ phase: 'copy', briefing: brief, briefingApproved: true, previousCopy: copy, feedback: 'Detalhe o processo' }));
    assert.equal(second.status, 200);
    assert.deepEqual((await second.json()).proposal.slides, copy.slides);
    assert.equal(calls[1].text.format.name, 'proposal_copy');
    assert.match(calls[1].input[0].content[1].text, /Detalhe o processo/);
    generated = { proposal: {} };
    assert.equal((await POST(request({ phase: 'copy', briefing: brief, briefingApproved: true }))).status, 502);
    globalThis.fetch = async () => Response.json({ status: 'incomplete' });
    assert.equal((await POST(request({ phase: 'copy', briefing: brief, briefingApproved: true }))).status, 502);
    globalThis.fetch = async () => new Response('', { status: 429 });
    assert.equal((await POST(request({ phase: 'copy', briefing: brief, briefingApproved: true }))).status, 502);
  } finally { globalThis.fetch = originalFetch; }
});
test('layout: exige ambas aprovações e salva exatamente o texto aprovado', async () => {
  const mock = serviceMocks(false);
  const { POST } = load('app/api/proposals/route.ts', mock.modules);
  const payload = { workflow: 'phased', brief, content: copy, template: 'Somus Editorial', validity: '2026-10-01' };
  assert.equal((await POST(request(payload))).status, 409);
  assert.equal((await POST(request({ ...payload, briefingApproved: true }))).status, 409);
  assert.equal(mock.writes.length, 0);
  const saved = await POST(request({ ...payload, briefingApproved: true, copyApproved: true, value: 999999 }));
  assert.equal(saved.status, 201);
  const values = mock.writes[0].args;
  assert.equal(values[4], 0);
  assert.deepEqual(JSON.parse(values[9]), brief);
  assert.deepEqual(JSON.parse(values[10]), { ...copy, budget_pending: true });
});
test('one page: nenhuma seção, parágrafo ou item aprovado desaparece nos três temas', () => {
  const { ProposalOnePage } = load('components/proposal-onepage.tsx', {
    '@/components/proposal-artwork': { resolveProposalTemplate: template => template },
  });
  for (const template of ['editorial', 'noir', 'prisma']) {
    const html = renderToStaticMarkup(React.createElement(ProposalOnePage, { proposal: {
      code: 'TEST-001', client: 'Cliente teste', project: copy.title, template,
      content: { ...copy, budget_pending: true },
    } }));
    for (const section of copy.slides) {
      assert.ok(html.includes(section.title), template + ': título');
      assert.ok(html.includes(section.body), template + ': corpo');
      for (const bullet of section.bullets) assert.ok(html.includes(bullet), template + ': ' + bullet);
    }
    assert.ok(html.includes('A confirmar'));
    assert.ok(!html.includes('R$'));
  }
});
