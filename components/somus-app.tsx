'use client';

import { useEffect, useMemo, useState, type ReactNode, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Columns3,
  FileCheck2,
  Eye,
  Flag,
  FileText,
  Grid2X2,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  ListTodo,
  Link2,
  Mail,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Palette,
  Pencil,
  Plus,
  Phone,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Shapes,
  Sparkles,
  TrendingUp,
  Trash2,
  Tag,
  Type,
  Upload,
  UserPlus,
  Users2,
  WalletCards,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ProposalArtwork, ProposalThumbnail, proposalTemplates } from '@/components/proposal-artwork';
import { createFallbackProposalSections, ProposalOnePage } from '@/components/proposal-onepage';
import { proposalNiches, type ProposalNiche, type ProposalTemplateTheme } from '@/lib/proposal-templates';
import { ProposalWorkflow } from './proposal-workflow';

type View = 'overview' | 'agent' | 'agent_setup' | 'pipeline' | 'tasks' | 'clients' | 'proposals' | 'team' | 'editor';
type Stage = 'Novo contato' | 'Diagnóstico' | 'Proposta enviada' | 'Negociação';
type Opportunity = { id: number; client: string; project: string; value: number; stage: Stage; due: string; source: string; tags: string[]; customFields: Record<string, string>; createdAt: number; updatedAt: number };
type OpportunityInput = Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>;
type Client = { id: number; name: string; company: string; email: string; phone: string; document: string; status: 'Lead' | 'Ativo' | 'Inativo' | 'Arquivado'; contractValue: number; tags: string[]; notes: string; customFields: Record<string, string>; createdAt: number; updatedAt: number };
type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type Proposal = { id: number; code: string; client: string; project: string; value: number; status: string; validity: string; template: string; slug: string; updated: string; content?: AgentResult['proposal'] };
type Member = { id: number; name: string; email: string; role: string; status: string; createdAt: number; isCurrent: number };
type TaskStatus = 'Entrada' | 'Em andamento' | 'Aguardando' | 'Concluída';
type TaskPriority = 'Alta' | 'Média' | 'Baixa';
type ActionTask = { id: number; title: string; description: string; status: TaskStatus; priority: TaskPriority; dueDate: string; assignee: string; project: string; completedAt: number | null; position: number; createdAt: number; updatedAt: number };
type TaskInput = Omit<ActionTask, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>;
export type AgentProfile = { businessName: string; legalName: string; segment: string; description: string; website: string; email: string; phone: string; address: string; instagram: string; primaryColor: string; secondaryColor: string; services: string[]; audience: string; tone: string; differentiators: string; proposalStructure: string; instructions: string; status: string; updatedAt?: number };
type ProposalReference = { id: number; name: string; contentType: string; sizeBytes: number; status: string; createdAt: number };
type BrandAsset = { id: number; publicToken: string; kind: 'logo' | 'portfolio' | 'gallery'; name: string; caption: string; contentType: string; sizeBytes: number; createdAt: number; url: string };
type AgentResult = {
  understanding: string;
  briefing: { client: string; project: string; business_context: string; problem: string; objectives: string[]; scope: string; deliverables: string[]; audience: string; tone: string; schedule: string; budget: number; success_criteria: string[] };
  missing_questions: string[];
  proposal: { brand_name: string; logo_url?: string; hero_image_url?: string; primary_color?: string; secondary_color?: string; company?: { description?: string; website?: string; email?: string; phone?: string; address?: string; instagram?: string }; portfolio_images?: Array<{ url: string; name: string; caption: string }>; title: string; subtitle: string; slides: Array<{ type: string; eyebrow: string; title: string; body: string; bullets: string[]; backgroundColor?: string }> };
};

const seedNow = Date.now();
const opportunitiesSeed: Opportunity[] = [
  { id: 1, client: 'Helena Martins', project: 'Residência Jardins', value: 78000, stage: 'Novo contato', due: 'Hoje, 16:00', source: 'Indicação', tags: ['Prioridade'], customFields: { Responsável: 'Wilson' }, createdAt: seedNow, updatedAt: seedNow },
  { id: 2, client: 'Grupo Áurea', project: 'Escritório corporativo', value: 124000, stage: 'Novo contato', due: '12 set', source: 'Site', tags: ['Corporativo'], customFields: {}, createdAt: seedNow - 86400000 * 4, updatedAt: seedNow },
  { id: 3, client: 'Marina Alves', project: 'Apartamento Vila Nova', value: 42500, stage: 'Diagnóstico', due: '10 set', source: 'Instagram', tags: ['Follow-up'], customFields: {}, createdAt: seedNow - 86400000 * 9, updatedAt: seedNow },
  { id: 4, client: 'Clínica Onyx', project: 'Interiores comerciais', value: 98000, stage: 'Diagnóstico', due: '14 set', source: 'Indicação', tags: ['Saúde', 'Prioridade'], customFields: { Unidade: 'Savassi' }, createdAt: seedNow - 86400000 * 15, updatedAt: seedNow },
  { id: 5, client: 'Rafael e Luiza', project: 'Casa Serra', value: 86500, stage: 'Proposta enviada', due: 'Vista há 2h', source: 'Indicação', tags: ['Visualizada'], customFields: {}, createdAt: seedNow - 86400000 * 24, updatedAt: seedNow },
  { id: 6, client: 'Ateliê Vértice', project: 'Showroom conceito', value: 56000, stage: 'Proposta enviada', due: 'Vista ontem', source: 'Instagram', tags: ['Varejo'], customFields: {}, createdAt: seedNow - 86400000 * 37, updatedAt: seedNow },
  { id: 7, client: 'Construtora Lume', project: 'Áreas comuns', value: 164000, stage: 'Negociação', due: '11 set', source: 'Parceria', tags: ['Alto valor'], customFields: { Responsável: 'Ana' }, createdAt: seedNow - 86400000 * 62, updatedAt: seedNow },
];

const proposalsSeed: Proposal[] = [
  { id: 24, code: 'PROP-024', client: 'Rafael e Luiza', project: 'Casa Serra', value: 86500, status: 'Visualizada', validity: '2026-09-19', template: 'Somus Editorial', slug: 'casa-serra', updated: 'há 2 horas' },
  { id: 23, code: 'PROP-023', client: 'Ateliê Vértice', project: 'Showroom conceito', value: 56000, status: 'Enviada', validity: '2026-09-18', template: 'Somus Editorial', slug: 'showroom-vertice', updated: 'ontem' },
  { id: 22, code: 'PROP-022', client: 'Construtora Lume', project: 'Áreas comuns', value: 164000, status: 'Em negociação', validity: '2026-09-15', template: 'Somus Essencial', slug: 'areas-comuns-lume', updated: '2 dias atrás' },
  { id: 21, code: 'PROP-021', client: 'Marina Alves', project: 'Apartamento Vila Nova', value: 42500, status: 'Aceita', validity: '2026-09-10', template: 'Somus Editorial', slug: 'apartamento-vila-nova', updated: '28 ago' },
];

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const defaultAgentProfile: AgentProfile = { businessName: '', legalName: '', segment: '', description: '', website: '', email: '', phone: '', address: '', instagram: '', primaryColor: '#172A25', secondaryColor: '#B86538', services: [], audience: '', tone: 'Consultivo, claro e confiante', differentiators: '', proposalStructure: 'Capa, contexto, solução, escopo, investimento e próximos passos', instructions: '', status: 'draft' };
const stageColors: Record<Stage, string> = { 'Novo contato': '#6875F5', Diagnóstico: '#E09252', 'Proposta enviada': '#20A37A', Negociação: '#A44C7D' };

export function SomusApp({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [view, setView] = useState<View>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [opportunities, setOpportunities] = useState(opportunitiesSeed);
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState(proposalsSeed);
  const [activeProposal, setActiveProposal] = useState(proposalsSeed[0]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfile>(defaultAgentProfile);
  const [opportunityDialog, setOpportunityDialog] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [newOpportunityStage, setNewOpportunityStage] = useState<Stage>('Novo contato');
  const [opportunitySaving, setOpportunitySaving] = useState(false);
  const [opportunityError, setOpportunityError] = useState('');
  const [clientDialog, setClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientError, setClientError] = useState('');
  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('Entrada');
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [memberDialog, setMemberDialog] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [workspaceBackground, setWorkspaceBackground] = useState('#F5F5F7');
  const [workspaceColorInput, setWorkspaceColorInput] = useState('#F5F5F7');
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const pipelineValue = useMemo(() => opportunities.reduce((total, item) => total + item.value, 0), [opportunities]);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return [
      ...proposals.map((item) => ({ id: `proposal-${item.id}`, title: item.project, subtitle: `${item.client} · Proposta`, proposal: item, client: null })),
      ...opportunities.map((item) => ({ id: `opportunity-${item.id}`, title: item.project, subtitle: `${item.client} · ${item.stage}`, proposal: null, client: null })),
      ...clients.map((item) => ({ id: `client-${item.id}`, title: item.name, subtitle: `${item.company || 'Cliente'} · Cadastro`, proposal: null, client: item })),
    ].filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(query)).slice(0, 6);
  }, [clients, opportunities, proposals, searchQuery]);

  useEffect(() => {
    void Promise.all([fetch('/api/opportunities'), fetch('/api/proposals'), fetch('/api/members'), fetch('/api/agent/profile'), fetch('/api/clients'), fetch('/api/tasks')]).then(async ([opportunitiesResponse, proposalsResponse, membersResponse, profileResponse, clientsResponse, tasksResponse]) => {
      if (opportunitiesResponse.ok) {
        const data = await opportunitiesResponse.json() as { opportunities: Array<Omit<Opportunity, 'value'> & { valueCents: number }> };
        setOpportunities(data.opportunities.map((item) => ({ ...item, value: item.valueCents / 100 })));
      }
      if (proposalsResponse.ok) {
        const data = await proposalsResponse.json() as { proposals: Array<Omit<Proposal, 'value' | 'updated'> & { valueCents: number }> };
        const loaded = data.proposals.map((item) => ({ ...item, value: item.valueCents / 100, updated: 'agora' }));
        setProposals(loaded);
        if (loaded[0]) setActiveProposal(loaded[0]);
      }
      if (membersResponse.ok) {
        const data = await membersResponse.json() as { members: Member[] };
        setMembers(data.members);
      }
      if (profileResponse.ok) {
        const data = await profileResponse.json() as { profile: AgentProfile };
        setAgentProfile(data.profile);
      }
      if (clientsResponse.ok) {
        const data = await clientsResponse.json() as { clients: Array<Omit<Client, 'contractValue'> & { contractValueCents: number }> };
        setClients(data.clients.map((item) => ({ ...item, contractValue: item.contractValueCents / 100 })));
      }
      if (tasksResponse.ok) {
        const data = await tasksResponse.json() as { tasks: ActionTask[] };
        setTasks(data.tasks);
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('somus-workspace-background');
    if (saved && /^#[0-9a-f]{6}$/i.test(saved)) { setWorkspaceBackground(saved); setWorkspaceColorInput(saved.toUpperCase()); }
  }, []);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: Record<string, object | string | boolean>; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: Record<string, unknown>) => unknown };
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { void Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); };
    register({ name: 'read_commercial_summary', title: 'Ler resumo comercial', description: 'Retorna o valor e a quantidade de oportunidades e propostas do workspace atual.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ pipelineValue, opportunityCount: opportunities.length, proposalCount: proposals.length }) });
    register({ name: 'start_proposal_creation', title: 'Iniciar nova proposta', description: 'Abre o agente configurado para transformar uma descrição em briefing e proposta one page.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { openAgent(); return { status: 'ready', visibleFlow: agentProfile.status === 'configured' ? 'proposal_agent' : 'agent_setup' }; } });
    register({ name: 'configure_proposal_agent', title: 'Configurar agente de propostas', description: 'Abre o setup de negócio, linguagem, serviços e propostas de referência.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { setView('agent_setup'); return { status: 'ready', visibleFlow: 'agent_setup' }; } });
    register({ name: 'open_team_management', title: 'Abrir gestão da equipe', description: 'Abre a área para adicionar e administrar usuários do workspace.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { setView('team'); return { status: 'ready', visibleFlow: 'team_management' }; } });
    return () => lifecycle.abort();
  }, [agentProfile.status, opportunities.length, pipelineValue, proposals.length]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  function changeWorkspaceBackground(color: string) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    const normalized = color.toUpperCase();
    setWorkspaceBackground(normalized);
    setWorkspaceColorInput(normalized);
    window.localStorage.setItem('somus-workspace-background', normalized);
  }

  function openAgent() { setView('agent'); }

  function openNewOpportunity(stage: Stage = 'Novo contato') { setEditingOpportunity(null); setNewOpportunityStage(stage); setOpportunityError(''); setOpportunityDialog(true); }
  function openOpportunity(opportunity: Opportunity) { setEditingOpportunity(opportunity); setOpportunityError(''); setOpportunityDialog(true); }

  async function saveOpportunity(input: OpportunityInput) {
    setOpportunitySaving(true); setOpportunityError('');
    const response = await fetch('/api/opportunities', { method: editingOpportunity ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: editingOpportunity?.id }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { opportunity?: Omit<Opportunity, 'value'> & { valueCents: number }; error?: string } : {};
    setOpportunitySaving(false);
    if (!response?.ok || !payload.opportunity) { setOpportunityError(payload.error || 'Não foi possível salvar esta oportunidade.'); return false; }
    const saved = { ...payload.opportunity, value: payload.opportunity.valueCents / 100 };
    setOpportunities((items) => editingOpportunity ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
    setOpportunityDialog(false); setEditingOpportunity(null); setView('pipeline');
    notify(editingOpportunity ? 'Oportunidade atualizada' : 'Oportunidade criada');
    return true;
  }

  async function moveOpportunity(id: number, stage: Stage) {
    const current = opportunities.find((item) => item.id === id);
    if (!current || current.stage === stage) return;
    setOpportunities((items) => items.map((item) => item.id === id ? { ...item, stage, updatedAt: Date.now() } : item));
    const response = await fetch('/api/opportunities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stage }) }).catch(() => null);
    if (!response?.ok) { setOpportunities((items) => items.map((item) => item.id === id ? current : item)); notify('Não foi possível mover o card'); return; }
    notify(`Movido para ${stage}`);
  }

  async function deleteOpportunity(id: number) {
    const response = await fetch('/api/opportunities', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    if (!response?.ok) { setOpportunityError('Não foi possível excluir esta oportunidade.'); return false; }
    setOpportunities((items) => items.filter((item) => item.id !== id)); setOpportunityDialog(false); setEditingOpportunity(null); notify('Oportunidade excluída'); return true;
  }

  function openNewClient() { setEditingClient(null); setClientError(''); setClientDialog(true); }
  function openClient(client: Client) { setEditingClient(client); setClientError(''); setClientDialog(true); }

  async function saveClient(input: ClientInput) {
    setClientSaving(true); setClientError('');
    const response = await fetch('/api/clients', { method: editingClient ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: editingClient?.id }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { client?: Omit<Client, 'contractValue'> & { contractValueCents: number }; error?: string } : {};
    setClientSaving(false);
    if (!response?.ok || !payload.client) { setClientError(payload.error || 'Não foi possível salvar este cliente.'); return false; }
    const saved = { ...payload.client, contractValue: payload.client.contractValueCents / 100 };
    setClients((items) => editingClient ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
    setClientDialog(false); setEditingClient(null); notify(editingClient ? 'Cliente atualizado' : 'Cliente adicionado'); return true;
  }

  async function deleteClient(id: number) {
    const response = await fetch('/api/clients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    if (!response?.ok) { setClientError('Não foi possível excluir este cliente.'); return false; }
    setClients((items) => items.filter((item) => item.id !== id)); setClientDialog(false); setEditingClient(null); notify('Cliente excluído'); return true;
  }

  function openNewTask(status: TaskStatus = 'Entrada') { setEditingTask(null); setNewTaskStatus(status); setTaskError(''); setTaskDialog(true); }
  function openTask(task: ActionTask) { setEditingTask(task); setTaskError(''); setTaskDialog(true); }

  async function saveTask(input: TaskInput) {
    setTaskSaving(true); setTaskError('');
    const response = await fetch('/api/tasks', { method: editingTask ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: editingTask?.id }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { task?: ActionTask; error?: string } : {};
    setTaskSaving(false);
    if (!response?.ok || !payload.task) { setTaskError(payload.error || 'Não foi possível salvar esta ação.'); return false; }
    setTasks((items) => editingTask ? items.map((item) => item.id === payload.task!.id ? payload.task! : item) : [payload.task!, ...items]);
    setTaskDialog(false); setEditingTask(null); setView('tasks');
    notify(editingTask ? 'Ação atualizada' : 'Ação adicionada');
    return true;
  }

  async function createQuickTask(title: string) {
    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, status: 'Entrada', priority: 'Média', dueDate: new Date().toISOString().slice(0, 10), position: Date.now() }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { task?: ActionTask } : {};
    if (!response?.ok || !payload.task) { notify('Não foi possível adicionar a ação'); return false; }
    setTasks((items) => [payload.task!, ...items]); notify('Ação adicionada para hoje'); return true;
  }

  async function moveTask(id: number, status: TaskStatus) {
    const current = tasks.find((item) => item.id === id);
    if (!current || current.status === status) return;
    const optimistic = { ...current, status, position: Date.now(), completedAt: status === 'Concluída' ? Date.now() : null, updatedAt: Date.now() };
    setTasks((items) => items.map((item) => item.id === id ? optimistic : item));
    const response = await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, position: optimistic.position }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { task?: ActionTask } : {};
    if (!response?.ok || !payload.task) { setTasks((items) => items.map((item) => item.id === id ? current : item)); notify('Não foi possível atualizar a ação'); return; }
    setTasks((items) => items.map((item) => item.id === id ? payload.task! : item));
    notify(status === 'Concluída' ? 'Ação concluída' : `Movida para ${status}`);
  }

  async function deleteTask(id: number) {
    const response = await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    if (!response?.ok) { setTaskError('Não foi possível excluir esta ação.'); return false; }
    setTasks((items) => items.filter((item) => item.id !== id)); setTaskDialog(false); setEditingTask(null); notify('Ação excluída'); return true;
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMemberError('');
    const data = new FormData(event.currentTarget);
    const response = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), email: data.get('email'), role: data.get('role') }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { member?: Member; error?: string } : {};
    if (!response?.ok || !payload.member) { setMemberError(payload.error || 'Não foi possível adicionar esta pessoa.'); return; }
    setMembers((items) => [...items, payload.member!]);
    setMemberDialog(false);
    notify('Usuário adicionado à equipe');
  }

  if (view === 'editor') return <ProposalEditor proposal={activeProposal} onBack={() => setView('proposals')} onNotify={notify} />;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] transition-colors" style={{ backgroundColor: workspaceBackground }}>
      <aside className={`fixed inset-y-0 left-0 z-50 w-[232px] border-r border-black/[0.06] bg-white/95 p-3 backdrop-blur-2xl transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-14 items-center justify-between px-3">
          <button onClick={() => setView('overview')} className="flex items-center gap-2.5" aria-label="Synky Sales">
            <span className="grid size-8 place-items-center rounded-[10px] bg-black text-[13px] font-semibold text-white">S</span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Synky Sales</span>
          </button>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileNav(false)}><X /></Button>
        </div>

        <div className="mx-1 mt-4 rounded-xl bg-[#f5f5f7] p-1.5">
          <div className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium"><span className="grid size-6 place-items-center rounded-md bg-white text-[9px] font-semibold shadow-sm">SG</span><span className="flex-1 truncate">Somus Group</span><span className="size-2 rounded-full bg-[#42a66b]" aria-label="Workspace ativo" /></div>
        </div>

        <nav className="mt-5 space-y-1" aria-label="Menu principal">
          <Nav active={view === 'overview'} icon={LayoutDashboard} label="Visão geral" onClick={() => setView('overview')} />
          <Nav active={view === 'agent'} icon={Sparkles} label="Agente de propostas" onClick={openAgent} />
          <Nav active={view === 'agent_setup'} icon={SlidersHorizontal} label="Configurar agente" onClick={() => setView('agent_setup')} />
          <Nav active={view === 'pipeline'} icon={BarChart3} label="Pipeline" badge={opportunities.length} onClick={() => setView('pipeline')} />
          <Nav active={view === 'tasks'} icon={ListTodo} label="Ações" badge={tasks.filter((task) => task.status !== 'Concluída').length} onClick={() => setView('tasks')} />
          <Nav active={view === 'clients'} icon={Users2} label="Clientes" onClick={() => setView('clients')} />
          <Nav active={view === 'proposals'} icon={FileText} label="Propostas" badge={proposals.length} onClick={() => setView('proposals')} />
          <Nav active={view === 'team'} icon={UserPlus} label="Equipe" badge={members.length} onClick={() => setView('team')} />
        </nav>

        <div className="absolute inset-x-3 bottom-3">
          <button onClick={() => setView('team')} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#f5f5f7]"><span className="grid size-8 place-items-center rounded-full bg-[#dbe8e2] text-[10px] font-semibold text-[#31594e]">{userName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{userName}</span><span className="block truncate text-[10px] text-[#8e8e93]">{userEmail}</span></span><ChevronRight className="size-4 text-[#8e8e93]" /></button>
        </div>
      </aside>

      {mobileNav && <button onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" aria-label="Fechar menu" />}

      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-black/[0.06] bg-[#f5f5f7]/90 px-3 backdrop-blur-2xl sm:px-5 md:px-8" style={{ backgroundColor: workspaceBackground }}>
          <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={() => setMobileNav(true)}><Menu /></Button>
          <div className="relative hidden w-[360px] md:block"><Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#8e8e93]" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 rounded-xl border-0 bg-black/[0.045] pl-9 shadow-none focus-visible:ring-1" placeholder="Buscar cliente, projeto ou proposta" />{searchQuery.trim().length >= 2 && <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-2 shadow-2xl">{searchResults.length ? searchResults.map((result) => <button key={result.id} onClick={() => { setSearchQuery(''); if (result.client) openClient(result.client); else if (result.proposal) { setActiveProposal(result.proposal); setView('editor'); } else setView('pipeline'); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#f5f5f7]"><span className="grid size-8 place-items-center rounded-xl bg-[#edf1ef] text-[10px] font-semibold text-[#31594e]">{result.title.slice(0, 2).toUpperCase()}</span><span><strong className="block text-xs font-medium">{result.title}</strong><span className="mt-0.5 block text-[10px] text-[#8e8e93]">{result.subtitle}</span></span></button>) : <p className="px-3 py-4 text-center text-[11px] text-[#8e8e93]">Nenhum resultado encontrado</p>}</div>}</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Button variant="ghost" size="icon" className={`rounded-full ${appearanceOpen ? 'bg-black/[0.06]' : ''}`} aria-label="Personalizar cor do sistema" onClick={() => setAppearanceOpen((open) => !open)}><Palette /></Button>
              {appearanceOpen && <div className="absolute right-0 top-11 z-50 w-[280px] rounded-[22px] border border-black/[0.08] bg-white p-4 shadow-2xl">
                <div className="flex items-start justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Aparência do sistema</p><p className="mt-1 text-[10px] text-[#6E6E73]">Escolha a cor de fundo do workspace.</p></div><span className="size-8 rounded-xl border border-black/10 shadow-inner" style={{ backgroundColor: workspaceBackground }} /></div>
                <div className="mt-4 grid grid-cols-6 gap-2">{['#F5F5F7', '#F2EEE8', '#EDF3F0', '#EEF0FA', '#F8EFEF', '#ECEBE7'].map((color) => <button key={color} type="button" onClick={() => changeWorkspaceBackground(color)} className={`size-8 rounded-full border border-black/10 transition-transform hover:scale-110 ${workspaceBackground === color ? 'ring-2 ring-black ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Aplicar fundo ${color}`} />)}</div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#F7F7F9] p-2">
                  <NativeColorInput value={workspaceBackground} onChange={changeWorkspaceBackground} ariaLabel="Abrir seletor de cor personalizada" />
                  <Input value={workspaceColorInput} onChange={(event) => { const value = event.target.value.toUpperCase(); setWorkspaceColorInput(value); if (/^#[0-9A-F]{6}$/.test(value)) changeWorkspaceBackground(value); }} onBlur={() => setWorkspaceColorInput(workspaceBackground)} className="h-8 border-0 bg-transparent px-1 font-mono text-[11px] uppercase shadow-none focus-visible:ring-0" aria-label="Código hexadecimal da cor do sistema" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3"><Button type="button" variant="ghost" size="sm" className="rounded-xl text-[10px]" onClick={() => changeWorkspaceBackground('#F5F5F7')}>Restaurar padrão</Button><Button type="button" size="sm" className="rounded-xl bg-black px-4 text-white" onClick={() => { setAppearanceOpen(false); notify('Cor de fundo do sistema atualizada'); }}>Concluir</Button></div>
              </div>}
            </div>
            <Button variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex" aria-label="Notificações" onClick={() => notify('Você não tem novas notificações')}><Bell /></Button><Button variant="outline" className="hidden h-10 rounded-2xl border-black/10 bg-white px-4 shadow-sm md:flex" onClick={() => openNewOpportunity()}><Plus /> Oportunidade</Button><Button className="h-10 rounded-2xl bg-black px-3.5 text-white shadow-[0_8px_22px_rgba(0,0,0,0.16)] hover:bg-[#29292b] sm:px-4" onClick={openAgent}><Sparkles /><span className="hidden sm:inline">Criar com IA</span><span className="sm:hidden">IA</span></Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-5 md:px-8 md:py-10">
          {view === 'overview' && <Overview name={userName} opportunities={opportunities} proposals={proposals} pipelineValue={pipelineValue} onPipeline={() => setView('pipeline')} onProposal={openAgent} onProposals={() => setView('proposals')} onOpenProposal={(proposal) => { setActiveProposal(proposal); setView('editor'); }} />}
          {view === 'agent' && <AgentStudio profile={agentProfile} onSetup={() => setView('agent_setup')} onGenerated={(proposal) => { setProposals((items) => [proposal, ...items]); setActiveProposal(proposal); setView('editor'); }} onNotify={notify} />}
          {view === 'agent_setup' && <AgentSetup initialProfile={agentProfile} onSaved={(profile) => { setAgentProfile(profile); notify('Agente configurado para o seu negócio'); setView('agent'); }} onNotify={notify} />}
          {view === 'pipeline' && <Pipeline opportunities={opportunities} onNew={openNewOpportunity} onEdit={openOpportunity} onMove={moveOpportunity} />}
          {view === 'tasks' && <Actions tasks={tasks} onNew={openNewTask} onQuickAdd={createQuickTask} onEdit={openTask} onMove={moveTask} />}
          {view === 'clients' && <Clients clients={clients} onNew={openNewClient} onEdit={openClient} />}
          {view === 'proposals' && <Proposals proposals={proposals} onNew={openAgent} onOpen={(proposal) => { setActiveProposal(proposal); setView('editor'); }} onNotify={notify} />}
          {view === 'team' && <Team members={members} onAdd={() => { setMemberError(''); setMemberDialog(true); }} />}
        </main>
      </div>

      <OpportunityDialog open={opportunityDialog} onOpenChange={setOpportunityDialog} opportunity={editingOpportunity} defaultStage={newOpportunityStage} saving={opportunitySaving} error={opportunityError} onSave={saveOpportunity} onDelete={deleteOpportunity} />
      <ClientDialog open={clientDialog} onOpenChange={setClientDialog} client={editingClient} saving={clientSaving} error={clientError} onSave={saveClient} onDelete={deleteClient} />
      <TaskDialog open={taskDialog} onOpenChange={setTaskDialog} task={editingTask} defaultStatus={newTaskStatus} saving={taskSaving} error={taskError} members={members} userName={userName} onSave={saveTask} onDelete={deleteTask} />
      <MemberDialog open={memberDialog} onOpenChange={setMemberDialog} onSubmit={createMember} error={memberError} />
      {toast && <output className="fixed inset-x-4 bottom-4 z-[80] flex items-center gap-2.5 rounded-2xl border border-black/5 bg-[#1d1d1f] px-4 py-3 text-xs font-medium text-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6"><span className="grid size-5 place-items-center rounded-full bg-[#6fa58e]"><Check className="size-3" /></span>{toast}</output>}
    </div>
  );
}

function Nav({ active, icon: Icon, label, badge, onClick }: { active: boolean; icon: typeof LayoutDashboard; label: string; badge?: number; onClick?: () => void }) {
  return <button onClick={onClick} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] transition-all ${active ? 'bg-black text-white shadow-sm' : 'text-[#5c5c62] hover:bg-[#f5f5f7] hover:text-black'}`}><Icon className="size-[17px]" strokeWidth={1.8} /><span>{label}</span>{badge !== undefined && <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-[#e8e8ed] text-[#6e6e73]'}`}>{badge}</span>}</button>;
}

function PageTitle({ kicker, title, description, actions }: { kicker?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0">{kicker && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73] sm:text-[11px]">{kicker}</p>}<h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] md:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#6e6e73] sm:text-sm">{description}</p></div>{actions && <div className="flex w-full shrink-0 gap-2 [&>button]:w-full sm:w-auto sm:[&>button]:w-auto">{actions}</div>}</div>;
}

function Overview({ name, opportunities, proposals, pipelineValue, onPipeline, onProposal, onProposals, onOpenProposal }: { name: string; opportunities: Opportunity[]; proposals: Proposal[]; pipelineValue: number; onPipeline: () => void; onProposal: () => void; onProposals: () => void; onOpenProposal: (proposal: Proposal) => void }) {
  const monthly = [{ month: 'Abr', value: 182 }, { month: 'Mai', value: 236 }, { month: 'Jun', value: 218 }, { month: 'Jul', value: 328 }, { month: 'Ago', value: 392 }, { month: 'Set', value: Math.round(pipelineValue / 1000) }];
  const stages = (['Novo contato', 'Diagnóstico', 'Proposta enviada', 'Negociação'] as Stage[]).map((stage) => ({ stage, items: opportunities.filter((item) => item.stage === stage), total: opportunities.filter((item) => item.stage === stage).reduce((sum, item) => sum + item.value, 0) }));
  return <>
    <PageTitle title={`Boa tarde, ${name}`} description="Seu estúdio comercial, claro e inspirador." actions={<Button className="h-10 rounded-xl bg-[#172A25] px-4 text-white shadow-lg shadow-[#172A25]/15" onClick={onProposal}><Sparkles /> Criar com IA</Button>} />

    <section className="relative mb-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#172A25] via-[#24493D] to-[#6D4B67] p-7 text-white shadow-[0_24px_70px_rgba(29,57,49,0.22)] md:p-9">
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/75 backdrop-blur"><Sparkles className="size-3" /> Inspiração do dia</span><blockquote className="mt-5 max-w-3xl text-[clamp(27px,4vw,48px)] font-semibold leading-[1.02] tracking-[-0.055em]">“Grandes projetos começam com uma conversa bem conduzida.”</blockquote><p className="mt-4 text-xs text-white/50">Transforme intenção em clareza. Clareza em confiança. Confiança em novos projetos.</p></div><div className="flex justify-start lg:justify-end"><button onClick={onProposal} className="group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-[#172A25] shadow-xl transition-transform hover:-translate-y-0.5"><span className="grid size-10 place-items-center rounded-xl bg-[#E6F2EC]"><Sparkles className="size-4" /></span><span><strong className="block text-xs">Começar uma proposta</strong><span className="mt-0.5 block text-[10px] text-black/45">Descreva. A IA organiza.</span></span><ChevronRight className="ml-3 size-4 transition-transform group-hover:translate-x-0.5" /></button></div></div>
      <div className="absolute -right-12 -top-20 size-72 rounded-full bg-[#F0B96A]/20 blur-2xl" /><div className="absolute -bottom-28 left-[46%] size-72 rounded-full bg-[#7E8BFF]/20 blur-3xl" />
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <VisualStat color="violet" icon={WalletCards} label="Pipeline em aberto" value={money.format(pipelineValue)} detail="+12,4% no mês" />
      <VisualStat color="green" icon={TrendingUp} label="Conversão" value="38%" detail="Meta do estúdio: 40%" />
      <VisualStat color="orange" icon={FileText} label="Propostas ativas" value={String(proposals.filter((item) => item.status !== 'Aceita').length)} detail={`${proposals.length} propostas no total`} />
      <VisualStat color="rose" icon={Users2} label="Ticket médio" value={money.format(Math.round(pipelineValue / Math.max(opportunities.length, 1)))} detail={`${opportunities.length} oportunidades`} />
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <article className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(25,38,34,0.04)] md:p-6"><SectionHeader title="Evolução comercial" subtitle="Volume do pipeline · últimos 6 meses" action="Ver pipeline" onAction={onPipeline} /><ChartContainer config={{ value: { label: 'Pipeline', color: '#526EE8' } }} className="mt-5 h-[230px] w-full aspect-auto"><AreaChart data={monthly} margin={{ left: 4, right: 4, top: 12 }}><defs><linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#526EE8" stopOpacity={0.28} /><stop offset="95%" stopColor="#526EE8" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="4 6" /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-medium">R$ {Number(value)} mil</span>} />} /><Area type="monotone" dataKey="value" stroke="#526EE8" strokeWidth={3} fill="url(#pipelineGradient)" /></AreaChart></ChartContainer></article>
      <article className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(25,38,34,0.04)] md:p-6"><SectionHeader title="Funil de oportunidades" subtitle="Valor por etapa" action="Abrir CRM" onAction={onPipeline} /><div className="mt-7 space-y-5">{stages.map(({ stage, items, total }, index) => <button onClick={onPipeline} key={stage} className="block w-full text-left"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] font-medium"><i className="size-2 rounded-full" style={{ background: stageColors[stage] }} />{stage}</span><span className="text-[10px] text-[#8e8e93]">{items.length} · {money.format(total)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#f0f0f3]"><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(24, 100 - index * 19)}%`, background: stageColors[stage] }} /></div></button>)}</div><div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#F5F0E8] p-4"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#9A6B37] shadow-sm"><TrendingUp className="size-4" /></span><p className="text-[10px] leading-4 text-[#6D5A45]"><strong className="block text-[11px] text-[#4A3A28]">Seu melhor movimento agora</strong>Priorize as propostas já visualizadas: elas têm maior intenção de compra.</p></div></article>
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
      <article className="rounded-[26px] border border-black/[0.06] bg-white p-5 md:p-6"><SectionHeader title="Propostas recentes" subtitle="Acompanhamento em tempo real" action="Ver todas" onAction={onProposals} /><div className="mt-5 divide-y divide-black/[0.055]">{proposals.slice(0, 4).map((proposal) => <div key={proposal.id} className="flex items-center gap-4 py-4"><ProposalMark project={proposal.project} /><div className="min-w-0 flex-1"><strong className="block truncate text-[13px] font-medium">{proposal.project}</strong><span className="mt-1 block text-[11px] text-[#8e8e93]">{proposal.client} · {proposal.code}</span></div><Status status={proposal.status} /><strong className="hidden w-28 text-right text-[13px] font-medium sm:block">{money.format(proposal.value)}</strong><Button aria-label={`Abrir ${proposal.project}`} onClick={() => onOpenProposal(proposal)} variant="ghost" size="icon-sm" className="rounded-full"><ChevronRight /></Button></div>)}</div></article>
      <article className="rounded-[26px] border border-black/[0.06] bg-[#FFF8EF] p-5 md:p-6"><SectionHeader title="Ações de hoje" subtitle="3 prioridades" /><div className="mt-5 space-y-1"><Task time="10:30" title="Follow-up Casa Serra" detail="Proposta visualizada há 2h" urgent /><Task time="14:00" title="Diagnóstico Clínica Onyx" detail="Reunião online · 45 min" /><Task time="17:00" title="Revisar escopo Lume" detail="Antes de enviar a revisão" /></div><p className="mt-5 border-t border-[#EADBC8] pt-4 text-[10px] italic leading-4 text-[#9A7650]">“Consistência transforma boas conversas em grandes contratos.”</p></article>
    </section>
  </>;
}

function VisualStat({ color, icon: Icon, label, value, detail }: { color: 'violet' | 'green' | 'orange' | 'rose'; icon: typeof Users2; label: string; value: string; detail: string }) { const palette = { violet: ['bg-[#EEF0FF]', 'bg-[#DCE1FF] text-[#5164C9]'], green: ['bg-[#EAF6F0]', 'bg-[#D2EBDD] text-[#277157]'], orange: ['bg-[#FFF2E3]', 'bg-[#FFE1BE] text-[#A46024]'], rose: ['bg-[#F8EAF1]', 'bg-[#EFD4E2] text-[#8F456B]'] }[color]; return <article className={`rounded-[24px] p-5 ${palette[0]}`}><div className={`grid size-9 place-items-center rounded-xl ${palette[1]}`}><Icon className="size-4" /></div><p className="mt-5 text-[10px] font-medium text-black/45">{label}</p><strong className="mt-1.5 block text-[26px] font-semibold tracking-[-0.04em]">{value}</strong><p className="mt-4 text-[10px] text-black/38">{detail}</p></article>; }
function SectionHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) { return <div className="flex items-start justify-between"><div><h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2><p className="mt-1 text-[11px] text-[#8e8e93]">{subtitle}</p></div>{action && <button onClick={onAction} className="flex items-center gap-1 text-[11px] font-medium text-[#31594e]">{action}<ChevronRight className="size-3.5" /></button>}</div>; }
function Task({ time, title, detail, urgent }: { time: string; title: string; detail: string; urgent?: boolean }) { return <div className="flex gap-3 rounded-xl p-3 hover:bg-[#f7f7f9]"><span className={`mt-0.5 text-[10px] font-medium ${urgent ? 'text-[#c04a3b]' : 'text-[#8e8e93]'}`}>{time}</span><span><strong className="block text-xs font-medium">{title}</strong><span className="mt-1 block text-[10px] text-[#8e8e93]">{detail}</span></span></div>; }

function Pipeline({ opportunities, onNew, onEdit, onMove }: { opportunities: Opportunity[]; onNew: (stage?: Stage) => void; onEdit: (opportunity: Opportunity) => void; onMove: (id: number, stage: Stage) => void }) {
  const stages: Stage[] = ['Novo contato', 'Diagnóstico', 'Proposta enviada', 'Negociação'];
  const [period, setPeriod] = useState<'all' | '7' | '30' | '90' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const filtered = useMemo(() => opportunities.filter((item) => {
    if (period === 'all') return true;
    if (period === 'custom') {
      const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
      const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
      return item.createdAt >= start && item.createdAt <= end;
    }
    return item.createdAt >= Date.now() - Number(period) * 86400000;
  }), [endDate, opportunities, period, startDate]);
  const pipelineValue = filtered.reduce((sum, item) => sum + item.value, 0);
  const averageTicket = filtered.length ? pipelineValue / filtered.length : 0;
  const weights: Record<Stage, number> = { 'Novo contato': 0.15, Diagnóstico: 0.35, 'Proposta enviada': 0.65, Negociação: 0.85 };
  const weightedForecast = filtered.reduce((sum, item) => sum + item.value * weights[item.stage], 0);

  return <>
    <PageTitle kicker="CRM inteligente" title="Pipeline comercial" description="Edite, filtre e mova oportunidades entre etapas. Os valores se atualizam em tempo real." actions={<Button onClick={() => onNew()} className="rounded-xl bg-black px-4 text-white"><Plus /> Nova oportunidade</Button>} />
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <PipelineMetric color="violet" label="Pipeline filtrado" value={money.format(pipelineValue)} detail={`${filtered.length} oportunidades`} />
      <PipelineMetric color="green" label="Previsão ponderada" value={money.format(weightedForecast)} detail="Probabilidade por etapa" />
      <PipelineMetric color="orange" label="Ticket médio" value={money.format(averageTicket)} detail="Valor médio por oportunidade" />
      <PipelineMetric color="rose" label="Em negociação" value={String(filtered.filter((item) => item.stage === 'Negociação').length)} detail={money.format(filtered.filter((item) => item.stage === 'Negociação').reduce((sum, item) => sum + item.value, 0))} />
    </section>

    <section className="mb-5 flex flex-col gap-3 rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-2 px-2"><CalendarRange className="size-4 text-[#6E6E73]" /><span className="text-[11px] font-semibold">Período de entrada</span></div>
      <AppSelect value={period} onValueChange={(value) => setPeriod(value as typeof period)} ariaLabel="Período de entrada" className="w-full md:w-52" options={[{ value: 'all', label: 'Todo o período' }, { value: '7', label: 'Últimos 7 dias' }, { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' }, { value: 'custom', label: 'Período personalizado' }]} />
      {period === 'custom' && <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 md:w-auto"><Input aria-label="Data inicial" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 min-w-0 rounded-2xl bg-[#F7F7F9] text-[11px]" /><span className="text-[10px] text-[#8E8E93]">até</span><Input aria-label="Data final" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 min-w-0 rounded-2xl bg-[#F7F7F9] text-[11px]" /></div>}
      <span className="px-2 text-[10px] text-[#8E8E93] md:ml-auto">Arraste os cards para mudar de etapa</span>
    </section>

    <div className="overflow-x-auto pb-4"><div className="grid min-w-[1120px] grid-cols-4 gap-4">{stages.map((stage) => {
      const items = filtered.filter((item) => item.stage === stage);
      const stageValue = items.reduce((sum, item) => sum + item.value, 0);
      return <section key={stage} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => { event.preventDefault(); const id = Number(event.dataTransfer.getData('text/opportunity-id') || draggedId); if (id) onMove(id, stage); setDraggedId(null); }} className={`min-h-[430px] rounded-[24px] border p-3 transition-colors ${draggedId ? 'border-[#83908B] bg-[#EEF4F1]' : 'border-transparent bg-black/[0.025]'}`}>
        <header className="px-2 py-2"><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: stageColors[stage] }} /><h2 className="text-xs font-semibold">{stage}</h2><span className="ml-auto rounded-full bg-white px-2 py-1 text-[9px] text-[#6E6E73] shadow-sm">{items.length}</span></div><strong className="mt-3 block text-[17px] font-semibold tracking-[-0.03em]">{money.format(stageValue)}</strong><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.055]"><div className="h-full rounded-full" style={{ width: `${pipelineValue ? Math.max(5, stageValue / pipelineValue * 100) : 0}%`, background: stageColors[stage] }} /></div></header>
        <div className="mt-2 space-y-3">{items.map((item) => <article key={item.id} draggable onDragStart={(event) => { event.dataTransfer.setData('text/opportunity-id', String(item.id)); event.dataTransfer.effectAllowed = 'move'; setDraggedId(item.id); }} onDragEnd={() => setDraggedId(null)} onClick={() => onEdit(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onEdit(item); }} role="button" tabIndex={0} className={`group cursor-grab rounded-[18px] border border-black/[0.06] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.035)] transition-all active:cursor-grabbing ${draggedId === item.id ? 'scale-[0.98] opacity-50' : 'hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]'}`}>
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F2F3F5] text-[9px] font-semibold">{item.client.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><div className="min-w-0 flex-1"><h3 className="truncate text-[13px] font-semibold">{item.project}</h3><p className="mt-1 truncate text-[10px] text-[#8E8E93]">{item.client}</p></div><GripVertical className="size-4 text-[#C4C4C7] transition-colors group-hover:text-[#6E6E73]" /></div>
          {item.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{item.tags.slice(0, 3).map((tag, index) => <span key={tag} className={`rounded-full px-2 py-1 text-[8px] font-medium ${index % 3 === 0 ? 'bg-[#EEF0FF] text-[#5164C9]' : index % 3 === 1 ? 'bg-[#EAF6F0] text-[#277157]' : 'bg-[#FFF2E3] text-[#A46024]'}`}>{tag}</span>)}</div>}
          {Object.entries(item.customFields).slice(0, 2).map(([label, value]) => <div key={label} className="mt-2 flex items-center justify-between text-[9px]"><span className="text-[#AEAEB2]">{label}</span><span className="max-w-[55%] truncate text-[#5C5C62]">{value}</span></div>)}
          <div className="mt-4 flex items-center justify-between border-t border-black/[0.055] pt-3"><strong className="text-xs font-semibold">{money.format(item.value)}</strong><span className="flex items-center gap-1 text-[9px] text-[#8E8E93]"><Clock3 className="size-3" />{item.due}</span></div>
          <div className="mt-2 flex items-center justify-between text-[8px] text-[#AEAEB2]"><span>{item.source}</span><span className="flex items-center gap-1"><Pencil className="size-2.5" />Editar</span></div>
        </article>)}<button onClick={() => onNew(stage)} className="flex w-full items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-black/10 py-3 text-[10px] font-medium text-[#8E8E93] hover:border-black/20 hover:bg-white hover:text-black"><Plus className="size-3.5" />Adicionar nesta etapa</button></div>
      </section>;
    })}</div></div>
  </>;
}

function PipelineMetric({ color, label, value, detail }: { color: 'violet' | 'green' | 'orange' | 'rose'; label: string; value: string; detail: string }) {
  const palette = { violet: 'bg-[#EEF0FF] text-[#5164C9]', green: 'bg-[#EAF6F0] text-[#277157]', orange: 'bg-[#FFF2E3] text-[#A46024]', rose: 'bg-[#F8EAF1] text-[#8F456B]' }[color];
  return <article className={`rounded-[22px] p-5 ${palette}`}><p className="text-[9px] font-semibold uppercase tracking-[0.1em] opacity-65">{label}</p><strong className="mt-3 block text-[25px] font-semibold tracking-[-0.045em] text-[#1D1D1F]">{value}</strong><p className="mt-3 text-[9px] text-black/40">{detail}</p></article>;
}

const taskStatusColors: Record<TaskStatus, { dot: string; soft: string; text: string }> = {
  Entrada: { dot: '#6875F5', soft: 'bg-[#EEF0FF]', text: 'text-[#5164C9]' },
  'Em andamento': { dot: '#E09252', soft: 'bg-[#FFF2E3]', text: 'text-[#A46024]' },
  Aguardando: { dot: '#A44C7D', soft: 'bg-[#F8EAF1]', text: 'text-[#8F456B]' },
  Concluída: { dot: '#20A37A', soft: 'bg-[#EAF6F0]', text: 'text-[#277157]' },
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function taskDateLabel(value: string) {
  if (!value) return 'Sem prazo';
  const today = localDateKey();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === today) return 'Hoje';
  if (value === localDateKey(tomorrow)) return 'Amanhã';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '');
}

function Actions({ tasks, onNew, onQuickAdd, onEdit, onMove }: { tasks: ActionTask[]; onNew: (status?: TaskStatus) => void; onQuickAdd: (title: string) => Promise<boolean>; onEdit: (task: ActionTask) => void; onMove: (id: number, status: TaskStatus) => void }) {
  const [mode, setMode] = useState<'list' | 'board'>('list');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'Todas' | TaskStatus>('Todas');
  const [priority, setPriority] = useState<'Todas' | TaskPriority>('Todas');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const today = localDateKey();
  const openTasks = tasks.filter((task) => task.status !== 'Concluída');
  const todayCount = openTasks.filter((task) => task.dueDate === today).length;
  const overdueCount = openTasks.filter((task) => task.dueDate && task.dueDate < today).length;
  const progressCount = tasks.filter((task) => task.status === 'Em andamento').length;
  const completedCount = tasks.filter((task) => task.status === 'Concluída').length;
  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.description} ${task.project} ${task.assignee}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === 'Todas' || task.status === status) && (priority === 'Todas' || task.priority === priority);
  }), [priority, query, status, tasks]);
  const groups = [
    { label: 'Atrasadas', tone: 'text-[#B54336]', items: filtered.filter((task) => task.status !== 'Concluída' && task.dueDate && task.dueDate < today) },
    { label: 'Hoje', tone: 'text-[#A46024]', items: filtered.filter((task) => task.status !== 'Concluída' && task.dueDate === today) },
    { label: 'Próximas', tone: 'text-[#5164C9]', items: filtered.filter((task) => task.status !== 'Concluída' && task.dueDate > today) },
    { label: 'Sem prazo', tone: 'text-[#6E6E73]', items: filtered.filter((task) => task.status !== 'Concluída' && !task.dueDate) },
    { label: 'Concluídas', tone: 'text-[#277157]', items: filtered.filter((task) => task.status === 'Concluída') },
  ].filter((group) => group.items.length > 0);

  async function submitQuick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setQuickSaving(true);
    const saved = await onQuickAdd(title);
    setQuickSaving(false);
    if (saved) setQuickTitle('');
  }

  return <div className="min-h-[calc(100vh-148px)]">
    <PageTitle kicker="Execução organizada" title="Ações" description="Transforme próximos passos em tarefas claras. Acompanhe por lista ou mova pelo Kanban." actions={<Button onClick={() => onNew()} className="rounded-xl bg-black px-4 text-white"><Plus /> Nova ação</Button>} />

    <section className="relative mb-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#172A25] via-[#24483D] to-[#31594E] p-5 text-white shadow-[0_18px_55px_rgba(23,42,37,0.16)] md:p-7">
      <div className="absolute -right-24 -top-28 size-72 rounded-full border border-white/10" /><div className="absolute -bottom-32 right-[22%] size-72 rounded-full bg-[#E2B274]/10 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60"><CheckCircle2 className="size-3" />Foco do dia</span><strong className="mt-5 block text-[clamp(28px,4vw,48px)] font-semibold leading-none tracking-[-0.05em]">{todayCount || openTasks.length} {todayCount === 1 ? 'ação importante' : 'ações importantes'}</strong><p className="mt-3 text-[10px] leading-5 text-white/50">Cada ação concluída mantém o comercial em movimento.</p></div>
        <form onSubmit={submitQuick} className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-white/[0.08] p-2 backdrop-blur sm:flex-row"><div className="relative min-w-0 flex-1"><Plus className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" /><Input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Escreva uma ação e pressione Enter" aria-label="Adicionar ação rápida" className="h-12 rounded-[15px] border-white/10 bg-black/15 pl-10 text-white shadow-none placeholder:text-white/35 focus-visible:ring-white/20" /></div><Button disabled={quickSaving || !quickTitle.trim()} type="submit" className="h-12 rounded-[15px] bg-white px-5 text-[#172A25] hover:bg-white/90">{quickSaving ? 'Adicionando...' : 'Adicionar para hoje'}</Button></form></div>
    </section>

    <section className="mb-5 grid gap-3 grid-cols-2 xl:grid-cols-4">
      <TaskMetric icon={CalendarDays} color="orange" label="Para hoje" value={todayCount} detail={todayCount ? 'Prioridades do dia' : 'Agenda em dia'} />
      <TaskMetric icon={Clock3} color="rose" label="Atrasadas" value={overdueCount} detail={overdueCount ? 'Pedem atenção' : 'Nenhum atraso'} />
      <TaskMetric icon={ArrowUp} color="violet" label="Em andamento" value={progressCount} detail="Em execução agora" />
      <TaskMetric icon={CheckCircle2} color="green" label="Concluídas" value={completedCount} detail={`${tasks.length ? Math.round(completedCount / tasks.length * 100) : 0}% do total`} />
    </section>

    <section className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(25,38,34,0.04)]">
      <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 md:flex-row md:items-center md:p-5"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-2xl border-0 bg-[#F5F5F7] pl-9 shadow-none" placeholder="Buscar ação, projeto ou responsável" /></div><div className="grid grid-cols-2 gap-2 sm:flex"><AppSelect value={status} onValueChange={(value) => setStatus(value as typeof status)} ariaLabel="Filtrar por status" className="sm:w-44" options={['Todas', 'Entrada', 'Em andamento', 'Aguardando', 'Concluída'].map((value) => ({ value, label: value === 'Todas' ? 'Todos os status' : value }))} /><AppSelect value={priority} onValueChange={(value) => setPriority(value as typeof priority)} ariaLabel="Filtrar por prioridade" className="sm:w-40" options={['Todas', 'Alta', 'Média', 'Baixa'].map((value) => ({ value, label: value === 'Todas' ? 'Prioridades' : `Prioridade ${value.toLowerCase()}` }))} /></div><div className="grid grid-cols-2 rounded-2xl bg-[#F1F1F3] p-1"><button onClick={() => setMode('list')} aria-label="Visualizar como lista" className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-medium transition-all ${mode === 'list' ? 'bg-white text-black shadow-sm' : 'text-[#8E8E93]'}`}><List className="size-3.5" />Lista</button><button onClick={() => setMode('board')} aria-label="Visualizar como Kanban" className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-medium transition-all ${mode === 'board' ? 'bg-white text-black shadow-sm' : 'text-[#8E8E93]'}`}><Columns3 className="size-3.5" />Kanban</button></div></div>

      {mode === 'list' ? <div className="min-h-[420px] p-3 sm:p-5">{groups.map((group) => <section key={group.label} className="mb-5 last:mb-0"><header className="mb-2 flex items-center gap-2 px-2"><span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${group.tone}`}>{group.label}</span><span className="rounded-full bg-[#F2F2F4] px-2 py-0.5 text-[9px] text-[#8E8E93]">{group.items.length}</span><span className="h-px flex-1 bg-black/[0.055]" /></header><div className="space-y-1">{group.items.map((task) => <TaskListRow key={task.id} task={task} today={today} onEdit={onEdit} onToggle={() => onMove(task.id, task.status === 'Concluída' ? 'Entrada' : 'Concluída')} />)}</div></section>)}{groups.length === 0 && <TaskEmpty onNew={() => onNew()} />}</div> : <div className="overflow-x-auto p-3 pb-5 sm:p-5"><div className="grid min-w-[1040px] grid-cols-4 gap-4">{(['Entrada', 'Em andamento', 'Aguardando', 'Concluída'] as TaskStatus[]).map((column) => { const items = filtered.filter((task) => task.status === column); const colors = taskStatusColors[column]; return <section key={column} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => { event.preventDefault(); const id = Number(event.dataTransfer.getData('text/task-id') || draggedId); if (id) onMove(id, column); setDraggedId(null); }} className={`min-h-[470px] rounded-[22px] border p-3 transition-colors ${draggedId ? 'border-[#AEB9B5] bg-[#F1F6F4]' : 'border-transparent bg-[#F7F7F9]'}`}><header className="flex items-center gap-2 px-2 py-2"><span className="size-2 rounded-full" style={{ backgroundColor: colors.dot }} /><h2 className="text-[11px] font-semibold">{column}</h2><span className="ml-auto rounded-full bg-white px-2 py-1 text-[9px] text-[#6E6E73] shadow-sm">{items.length}</span></header><div className="mt-2 space-y-2.5">{items.map((task) => <TaskBoardCard key={task.id} task={task} dragged={draggedId === task.id} onEdit={onEdit} onDragStart={(id) => setDraggedId(id)} onDragEnd={() => setDraggedId(null)} />)}<button onClick={() => onNew(column)} className="flex w-full items-center justify-center gap-1.5 rounded-[15px] border border-dashed border-black/10 py-3 text-[9px] font-medium text-[#8E8E93] transition-colors hover:border-black/20 hover:bg-white hover:text-black"><Plus className="size-3.5" />Adicionar ação</button></div></section>; })}</div></div>}
    </section>
  </div>;
}

function TaskMetric({ icon: Icon, color, label, value, detail }: { icon: typeof CalendarDays; color: 'violet' | 'green' | 'orange' | 'rose'; label: string; value: number; detail: string }) {
  const palette = { violet: ['bg-[#EEF0FF]', 'bg-[#DCE1FF] text-[#5164C9]'], green: ['bg-[#EAF6F0]', 'bg-[#D2EBDD] text-[#277157]'], orange: ['bg-[#FFF2E3]', 'bg-[#FFE1BE] text-[#A46024]'], rose: ['bg-[#F8EAF1]', 'bg-[#EFD4E2] text-[#8F456B]'] }[color];
  return <article className={`rounded-[22px] p-4 sm:p-5 ${palette[0]}`}><div className="flex items-start justify-between"><span className={`grid size-8 place-items-center rounded-xl ${palette[1]}`}><Icon className="size-3.5" /></span><strong className="text-[25px] font-semibold tracking-[-0.04em]">{value}</strong></div><p className="mt-4 text-[10px] font-semibold text-black/60">{label}</p><p className="mt-1 text-[9px] text-black/35">{detail}</p></article>;
}

function TaskListRow({ task, today, onEdit, onToggle }: { task: ActionTask; today: string; onEdit: (task: ActionTask) => void; onToggle: () => void }) {
  const completed = task.status === 'Concluída';
  const overdue = !completed && Boolean(task.dueDate) && task.dueDate < today;
  const priorityColor = task.priority === 'Alta' ? 'text-[#C65345]' : task.priority === 'Média' ? 'text-[#C47B36]' : 'text-[#8E8E93]';
  return <article onClick={() => onEdit(task)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onEdit(task); }} role="button" tabIndex={0} className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-3 py-3 transition-colors hover:bg-[#F7F7F9] sm:grid-cols-[auto_minmax(0,1fr)_150px_120px_auto] sm:px-4"><button onClick={(event) => { event.stopPropagation(); onToggle(); }} aria-label={completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all ${completed ? 'border-[#20A37A] bg-[#20A37A] text-white' : 'border-[#B8B8BD] bg-white hover:border-[#20A37A] hover:bg-[#EAF6F0]'}`}>{completed && <Check className="size-3" />}</button><div className="min-w-0"><strong className={`block truncate text-[12px] font-medium ${completed ? 'text-[#8E8E93] line-through' : 'text-[#1D1D1F]'}`}>{task.title}</strong><span className="mt-1 flex min-w-0 items-center gap-2 text-[9px] text-[#8E8E93]"><span className="truncate">{task.project || 'Sem projeto'}</span>{task.assignee && <><i className="size-1 rounded-full bg-[#D1D1D6]" /><span className="truncate">{task.assignee}</span></>}</span></div><span className={`hidden items-center gap-1.5 text-[9px] font-medium sm:flex ${overdue ? 'text-[#B54336]' : 'text-[#6E6E73]'}`}><CalendarDays className="size-3" />{taskDateLabel(task.dueDate)}</span><span className={`hidden items-center gap-1 text-[9px] sm:flex ${priorityColor}`}><Flag className="size-3" />{task.priority}</span><ChevronRight className="size-4 text-[#C4C4C7] transition-transform group-hover:translate-x-0.5 group-hover:text-[#6E6E73]" /></article>;
}

function TaskBoardCard({ task, dragged, onEdit, onDragStart, onDragEnd }: { task: ActionTask; dragged: boolean; onEdit: (task: ActionTask) => void; onDragStart: (id: number) => void; onDragEnd: () => void }) {
  const priorityTone = task.priority === 'Alta' ? 'bg-[#FFF0EE] text-[#B54336]' : task.priority === 'Média' ? 'bg-[#FFF2E3] text-[#A46024]' : 'bg-[#F1F1F3] text-[#6E6E73]';
  return <article draggable onDragStart={(event) => { event.dataTransfer.setData('text/task-id', String(task.id)); event.dataTransfer.effectAllowed = 'move'; onDragStart(task.id); }} onDragEnd={onDragEnd} onClick={() => onEdit(task)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onEdit(task); }} role="button" tabIndex={0} className={`group cursor-grab rounded-[17px] border border-black/[0.06] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.035)] transition-all active:cursor-grabbing ${dragged ? 'scale-[0.98] opacity-45' : 'hover:-translate-y-0.5 hover:shadow-[0_9px_25px_rgba(0,0,0,0.08)]'}`}><div className="flex items-start gap-2"><span className={`rounded-full px-2 py-1 text-[8px] font-medium ${priorityTone}`}>{task.priority}</span><GripVertical className="ml-auto size-4 text-[#C4C4C7] group-hover:text-[#8E8E93]" /></div><h3 className={`mt-3 text-[12px] font-semibold leading-[1.45] ${task.status === 'Concluída' ? 'text-[#8E8E93] line-through' : ''}`}>{task.title}</h3>{task.description && <p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#8E8E93]">{task.description}</p>}<div className="mt-4 flex items-center justify-between border-t border-black/[0.055] pt-3"><span className="flex min-w-0 items-center gap-1.5 text-[8px] text-[#6E6E73]"><CalendarDays className="size-3 shrink-0" />{taskDateLabel(task.dueDate)}</span>{task.assignee && <span className="grid size-6 place-items-center rounded-full bg-[#EAF1EE] text-[8px] font-semibold text-[#31594E]" title={task.assignee}>{task.assignee.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>}</div>{task.project && <p className="mt-2 truncate text-[8px] text-[#AEAEB2]">{task.project}</p>}</article>;
}

function TaskEmpty({ onNew }: { onNew: () => void }) {
  return <div className="grid min-h-[390px] place-items-center px-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EAF6F0] text-[#277157]"><CheckCircle2 className="size-5" /></span><strong className="mt-4 block text-sm">Tudo organizado por aqui</strong><p className="mt-1 text-[10px] text-[#8E8E93]">Crie uma nova ação ou ajuste os filtros para visualizar outras tarefas.</p><Button onClick={onNew} variant="outline" className="mt-4 rounded-xl"><Plus /> Nova ação</Button></div></div>;
}

function Clients({ clients, onNew, onEdit }: { clients: Client[]; onNew: () => void; onEdit: (client: Client) => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'Todos' | Client['status']>('Todos');
  const filtered = clients.filter((item) => {
    const matchesQuery = `${item.name} ${item.company} ${item.email} ${item.phone} ${item.document} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === 'Todos' || item.status === status);
  });
  const contractValue = clients.reduce((sum, item) => sum + item.contractValue, 0);
  const filteredValue = filtered.reduce((sum, item) => sum + item.contractValue, 0);
  const active = clients.filter((item) => item.status === 'Ativo').length;
  const averageTicket = clients.length ? contractValue / clients.length : 0;
  const completeContacts = clients.filter((item) => item.email && item.phone).length;
  const completeness = clients.length ? Math.round(completeContacts / clients.length * 100) : 0;
  const topClients = [...clients].sort((a, b) => b.contractValue - a.contractValue).slice(0, 3);
  const statusSummary = (['Ativo', 'Lead', 'Inativo', 'Arquivado'] as Client['status'][]).map((item) => ({ label: item, count: clients.filter((client) => client.status === item).length }));

  return <div className="min-h-[calc(100vh-148px)]">
    <PageTitle kicker="Relacionamento" title="Clientes" description="Uma visão completa da carteira, dos contratos e de cada relacionamento comercial." actions={<Button onClick={onNew} className="rounded-xl bg-black px-4 text-white"><Plus /> Novo cliente</Button>} />

    <section className="relative mb-5 overflow-hidden rounded-[30px] bg-[#172A25] p-6 text-white shadow-[0_18px_55px_rgba(23,42,37,0.16)] md:p-8">
      <div className="absolute -right-20 -top-28 size-80 rounded-full border border-white/10" />
      <div className="absolute -bottom-32 right-[18%] size-72 rounded-full bg-[#D9A66F]/10 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[1.15fr_1fr] xl:items-end">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60"><Circle className="size-1.5 fill-[#76C39A] text-[#76C39A]" />Carteira comercial</span><p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-white/40">Valor total em relacionamento</p><strong className="mt-2 block text-[clamp(34px,5vw,64px)] font-semibold leading-none tracking-[-0.055em]">{money.format(contractValue)}</strong><p className="mt-5 max-w-lg text-[11px] leading-5 text-white/45">Cada cadastro concentra histórico, contato, tags, informações personalizadas e o potencial financeiro do contrato.</p></div>
        <div className="grid grid-cols-3 divide-x divide-white/10 rounded-[22px] border border-white/10 bg-white/[0.055] p-2 backdrop-blur"><ClientHeroMetric label="Clientes" value={String(clients.length)} /><ClientHeroMetric label="Ativos" value={String(active)} /><ClientHeroMetric label="Ticket médio" value={money.format(averageTicket)} /></div>
      </div>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(25,38,34,0.04)]">
        <div className="border-b border-black/[0.055] p-4 md:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8e8e93]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 rounded-xl border-0 bg-[#f5f5f7] pl-9 shadow-none" placeholder="Buscar por nome, empresa, contato ou tag" /></div><span className="shrink-0 text-[10px] text-[#8E8E93]">{filtered.length} registros · {money.format(filteredValue)}</span></div><div className="mt-4 flex flex-wrap gap-1.5">{(['Todos', 'Ativo', 'Lead', 'Inativo', 'Arquivado'] as const).map((item) => <button key={item} onClick={() => setStatus(item)} className={`rounded-full px-3 py-1.5 text-[9px] font-medium transition-colors ${status === item ? 'bg-[#172A25] text-white' : 'bg-[#F3F4F5] text-[#6E6E73] hover:text-black'}`}>{item}{item !== 'Todos' && <span className="ml-1 opacity-45">{clients.filter((client) => client.status === item).length}</span>}</button>)}</div></div>
        <div className="hidden grid-cols-[1.35fr_1fr_0.65fr_0.75fr_auto] gap-4 border-b border-black/[0.055] bg-[#FAFAFB] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93] md:grid"><span>Cliente</span><span>Contato</span><span>Status</span><span>Contrato</span><span className="w-8" /></div>
        <div className="divide-y divide-black/[0.055]">{filtered.map((item, index) => <article key={item.id} onClick={() => onEdit(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onEdit(item); }} role="button" tabIndex={0} className="group grid cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-[#FAFAFB] md:grid-cols-[1.35fr_1fr_0.65fr_0.75fr_auto] md:px-5"><div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl text-[10px] font-semibold ${index % 3 === 0 ? 'bg-[#EAF6F0] text-[#277157]' : index % 3 === 1 ? 'bg-[#EEF0FF] text-[#5164C9]' : 'bg-[#FFF2E3] text-[#A46024]'}`}>{item.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-[12px] font-semibold">{item.name}</strong><span className="mt-0.5 block truncate text-[10px] text-[#8E8E93]">{item.company || 'Pessoa física'}{item.document ? ` · ${item.document}` : ''}</span>{item.tags.length > 0 && <span className="mt-1.5 flex flex-wrap gap-1">{item.tags.slice(0, 2).map((tag) => <i key={tag} className="rounded-full bg-[#F1F2F5] px-2 py-0.5 text-[8px] not-italic text-[#6E6E73]">{tag}</i>)}</span>}</span></div><span className="min-w-0 text-[10px] text-[#6E6E73]">{item.email && <span className="flex items-center gap-1.5 truncate"><Mail className="size-3 shrink-0" />{item.email}</span>}{item.phone && <span className="mt-1 flex items-center gap-1.5 truncate"><Phone className="size-3 shrink-0" />{item.phone}</span>}{!item.email && !item.phone && <span className="text-[#AEAEB2]">Contato não informado</span>}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-medium ${item.status === 'Ativo' ? 'bg-[#EAF6F0] text-[#277157]' : item.status === 'Lead' ? 'bg-[#EEF0FF] text-[#5164C9]' : 'bg-[#F3F3F5] text-[#6E6E73]'}`}>{item.status}</span><strong className="text-[12px] font-semibold">{money.format(item.contractValue)}</strong><Button aria-label={`Editar ${item.name}`} onClick={(event) => { event.stopPropagation(); onEdit(item); }} variant="ghost" size="icon-sm" className="rounded-full text-[#8E8E93] group-hover:bg-white group-hover:text-black"><Pencil /></Button></article>)}{filtered.length === 0 && <div className="px-6 py-20 text-center"><Users2 className="mx-auto size-7 text-[#C4C4C7]" /><strong className="mt-3 block text-sm">Nenhum cliente encontrado</strong><p className="mt-1 text-[10px] text-[#8E8E93]">Ajuste os filtros ou adicione um novo cadastro.</p><Button onClick={onNew} variant="outline" className="mt-4 rounded-xl"><Plus /> Novo cliente</Button></div>}</div>
        {filtered.length > 0 && <div className="mt-auto flex flex-col gap-3 border-t border-black/[0.055] bg-[#FAFAFB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-[9px] text-[#8E8E93]">Clique em qualquer cliente para abrir e editar o cadastro completo.</span><Button onClick={onNew} variant="outline" size="sm" className="w-fit rounded-xl border-black/10 bg-white"><Plus /> Adicionar cliente</Button></div>}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(25,38,34,0.04)]"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Composição</p><h2 className="mt-1 text-[15px] font-semibold">Status da carteira</h2></div><span className="grid size-9 place-items-center rounded-xl bg-[#EEF3F1] text-[#31594E]"><BarChart3 className="size-4" /></span></div><div className="mt-6 space-y-4">{statusSummary.map((item, index) => <div key={item.label}><div className="flex items-center justify-between text-[10px]"><span className="text-[#6E6E73]">{item.label}</span><strong>{item.count}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F0F1F2]"><div className={`h-full rounded-full ${index === 0 ? 'bg-[#3C8B68]' : index === 1 ? 'bg-[#6875F5]' : index === 2 ? 'bg-[#D9A66F]' : 'bg-[#B9B9BE]'}`} style={{ width: `${clients.length ? item.count / clients.length * 100 : 0}%` }} /></div></div>)}</div></section>
        <section className="rounded-[26px] bg-[#ECEFFB] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6E78A4]">Qualidade da base</p><h2 className="mt-1 text-[15px] font-semibold">Contatos completos</h2></div><strong className="text-2xl tracking-[-0.04em]">{completeness}%</strong></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-[#5D6FCE]" style={{ width: `${completeness}%` }} /></div><p className="mt-4 text-[10px] leading-4 text-[#66709A]">{completeContacts} de {clients.length} clientes possuem telefone e e-mail cadastrados.</p></section>
        <section className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(25,38,34,0.04)]"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Maiores contratos</p><div className="mt-4 space-y-4">{topClients.map((item, index) => <button key={item.id} onClick={() => onEdit(item)} className="flex w-full items-center gap-3 text-left"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#F3F4F5] text-[9px] font-semibold text-[#6E6E73]">0{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-medium">{item.name}</strong><span className="mt-0.5 block truncate text-[8px] text-[#8E8E93]">{item.company || item.status}</span></span><strong className="text-[10px]">{money.format(item.contractValue)}</strong></button>)}{topClients.length === 0 && <p className="py-5 text-center text-[10px] text-[#8E8E93]">A carteira ainda não possui contratos.</p>}</div></section>
      </aside>
    </div>
  </div>;
}

function ClientHeroMetric({ label, value }: { label: string; value: string }) { return <div className="min-w-0 px-3 py-4 text-center md:px-5"><strong className="block truncate text-[clamp(17px,2vw,28px)] font-semibold tracking-[-0.04em]">{value}</strong><span className="mt-1.5 block text-[8px] uppercase tracking-[0.12em] text-white/38">{label}</span></div>; }

function Team({ members, onAdd }: { members: Member[]; onAdd: () => void }) {
  const active = members.filter((member) => member.status === 'Ativo').length;
  return <><PageTitle kicker="Workspace" title="Equipe" description="Pessoas, acessos e responsabilidades do seu escritório." actions={<Button onClick={onAdd} className="rounded-xl bg-[#172A25] px-4 text-white"><UserPlus /> Adicionar usuário</Button>} />
    <section className="grid gap-4 md:grid-cols-3"><article className="rounded-[24px] bg-[#EEF0FF] p-5"><span className="grid size-9 place-items-center rounded-xl bg-[#DCE1FF] text-[#5164C9]"><Users2 className="size-4" /></span><strong className="mt-5 block text-3xl tracking-[-0.04em]">{members.length}</strong><p className="mt-1 text-[10px] text-black/45">pessoas no workspace</p></article><article className="rounded-[24px] bg-[#EAF6F0] p-5"><span className="grid size-9 place-items-center rounded-xl bg-[#D2EBDD] text-[#277157]"><ShieldCheck className="size-4" /></span><strong className="mt-5 block text-3xl tracking-[-0.04em]">{active}</strong><p className="mt-1 text-[10px] text-black/45">acessos ativos</p></article><article className="relative overflow-hidden rounded-[24px] bg-[#6D4B67] p-5 text-white"><Sparkles className="size-5 text-[#F4C981]" /><p className="mt-5 max-w-xs text-[13px] font-medium leading-5">“Talento individual cria ideias. Uma equipe alinhada transforma ideias em legado.”</p><div className="absolute -bottom-12 -right-10 size-32 rounded-full bg-[#F0B96A]/20 blur-2xl" /></article></section>
    <section className="mt-5 overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(25,38,34,0.04)]"><div className="flex items-center justify-between border-b border-black/[0.055] px-5 py-5 md:px-6"><div><h2 className="text-[15px] font-semibold">Usuários do workspace</h2><p className="mt-1 text-[10px] text-[#8e8e93]">Quem entra, o que pode fazer e o status do acesso.</p></div><Button onClick={onAdd} variant="outline" className="rounded-xl border-black/10"><Plus /> Adicionar</Button></div><div className="divide-y divide-black/[0.055]">{members.map((member, index) => <div key={member.id} className="grid items-center gap-4 px-5 py-4 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto] md:px-6"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-2xl text-[11px] font-semibold ${index % 3 === 0 ? 'bg-[#EAF6F0] text-[#277157]' : index % 3 === 1 ? 'bg-[#EEF0FF] text-[#5164C9]' : 'bg-[#FFF2E3] text-[#A46024]'}`}>{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong className="block text-[12px] font-medium">{member.name}{member.isCurrent ? ' (você)' : ''}</strong><span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#8e8e93]"><Mail className="size-3" />{member.email}</span></span></div><span className="w-fit rounded-full bg-[#F3F3F5] px-2.5 py-1 text-[9px] font-medium text-[#5E5E63]">{member.role}</span><span className={`flex items-center gap-1.5 text-[10px] ${member.status === 'Ativo' ? 'text-[#277157]' : 'text-[#9A6B37]'}`}><i className="size-1.5 rounded-full bg-current" />{member.status}</span><span className="text-[9px] text-[#AEAEB2]">{member.status === 'Ativo' ? 'Acesso confirmado' : 'Entra ao acessar com este e-mail'}</span></div>)}{members.length === 0 && <div className="px-6 py-14 text-center"><Users2 className="mx-auto size-6 text-[#AEAEB2]" /><p className="mt-3 text-xs text-[#6E6E73]">Adicione a primeira pessoa da equipe.</p></div>}</div></section>
  </>;
}

function Proposals({ proposals, onNew, onOpen, onNotify }: { proposals: Proposal[]; onNew: () => void; onOpen: (proposal: Proposal) => void; onNotify: (message: string) => void }) {
  const [filter, setFilter] = useState<'Todas' | 'Rascunhos' | 'Enviadas' | 'Aceitas'>('Todas');
  const filtered = proposals.filter((proposal) => filter === 'Todas' || (filter === 'Rascunhos' && proposal.status === 'Rascunho') || (filter === 'Enviadas' && ['Enviada', 'Visualizada'].includes(proposal.status)) || (filter === 'Aceitas' && proposal.status === 'Aceita'));
  function copyLink(proposal: Proposal) { void navigator.clipboard?.writeText(`${window.location.origin}/p/${proposal.slug}`); onNotify('Link público copiado'); }
  return <><PageTitle kicker="Sites comerciais" title="Propostas" description="One pages sofisticadas, interativas e prontas para compartilhar por link." actions={<Button onClick={onNew} className="rounded-xl bg-black px-4 text-white"><Sparkles /> Nova proposta</Button>} /><div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">{(['Todas', 'Rascunhos', 'Enviadas', 'Aceitas'] as const).map((item) => <Filter key={item} active={filter === item} label={item === 'Todas' ? `Todas ${proposals.length}` : item} onClick={() => setFilter(item)} />)}</div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((proposal, index) => <article key={`${proposal.id}-${proposal.code}`} className="group overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.035)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.09)]"><button className="block w-full text-left" onClick={() => onOpen(proposal)}><ProposalCover proposal={proposal} index={index} /></button><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-[13px] font-semibold">{proposal.project}</h3><p className="mt-1 text-[10px] text-[#8e8e93]">{proposal.client} · {proposal.code}</p></div><Status status={proposal.status} /></div><div className="mt-4 flex items-center gap-1 border-t border-black/[0.055] pt-3 sm:gap-2"><Button variant="ghost" size="sm" className="rounded-xl text-[11px]" onClick={() => onOpen(proposal)}><Eye /> Editar</Button><Button variant="ghost" size="sm" className="rounded-xl text-[11px]" onClick={() => copyLink(proposal)}><Link2 /> Copiar link</Button><Button aria-label={`Mais opções de ${proposal.project}`} onClick={() => onNotify('Mais opções estarão disponíveis na próxima versão')} variant="ghost" size="icon-sm" className="ml-auto rounded-full"><MoreHorizontal /></Button></div></div></article>)}<button onClick={onNew} className="grid min-h-[300px] place-items-center rounded-[22px] border border-dashed border-black/15 bg-white/50 p-6 text-center transition-all hover:-translate-y-1 hover:border-black/30 hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"><span><span className="mx-auto grid size-11 place-items-center rounded-full bg-black text-white"><Plus /></span><strong className="mt-4 block text-sm">Nova proposta</strong><span className="mt-1 block text-[11px] text-[#8e8e93]">Criar com o agente de IA</span></span></button></div></>;
}

function ProposalCover({ proposal }: { proposal: Proposal; index: number }) { return <div className="aspect-video overflow-hidden"><ProposalArtwork index={0} proposal={proposal} /></div>; }
function ProposalMark({ project }: { project: string }) { return <span className="grid size-10 place-items-center rounded-xl bg-[#203a32] text-[10px] font-semibold text-white">{project.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span>; }
function Status({ status }: { status: string }) { const accepted = status === 'Aceita'; const sent = ['Visualizada', 'Enviada', 'Proposta enviada'].includes(status); return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium ${accepted ? 'bg-[#e5f2eb] text-[#2d6a4f]' : sent ? 'bg-[#edf0f7] text-[#536381]' : 'bg-[#f2f2f4] text-[#6e6e73]'}`}><Circle className="size-1.5 fill-current" />{status}</span>; }
function Filter({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`rounded-full px-3.5 py-2 text-[11px] font-medium ${active ? 'bg-black text-white' : 'bg-white text-[#6e6e73] hover:text-black'}`}>{label}</button>; }

const visualStyles: Array<{ id: ProposalTemplateTheme; name: string; description: string }> = [
  { id: 'editorial', name: 'Editorial sofisticado', description: 'Fotografia, respiro e narrativa premium.' },
  { id: 'noir', name: 'Minimalista contrastado', description: 'Tipografia forte, precisão e alto contraste.' },
  { id: 'prisma', name: 'Contemporâneo vibrante', description: 'Formas gráficas, cor e energia visual.' },
];

function ProposalTemplatePicker({ selected, onSelect, brandColors }: { selected: string; onSelect: (value: string) => void; brandColors?: [string, string] }) {
  const selectedTemplate = proposalTemplates.find((template) => template.value === selected) || proposalTemplates[0];
  const [niche, setNiche] = useState<ProposalNiche>(selectedTemplate.niche);
  const [style, setStyle] = useState<ProposalTemplateTheme>(selectedTemplate.theme);
  const options = proposalTemplates.filter((template) => template.niche === niche && template.theme === style);

  function chooseNiche(nextNiche: ProposalNiche) {
    setNiche(nextNiche);
    const next = proposalTemplates.find((template) => template.niche === nextNiche && template.theme === style) || proposalTemplates.find((template) => template.niche === nextNiche);
    if (next) onSelect(next.value);
  }

  function chooseStyle(nextStyle: ProposalTemplateTheme) {
    setStyle(nextStyle);
    const next = proposalTemplates.find((template) => template.niche === niche && template.theme === nextStyle);
    if (next) onSelect(next.value);
  }

  return <section className="mb-5 rounded-[26px] border border-black/[0.06] bg-white p-4 shadow-[0_8px_30px_rgba(25,38,34,0.04)] md:p-5">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Coleção de modelos</p><p className="mt-1 text-[10px] text-[#6E6E73]">Escolha uma referência visual. O texto aprovado não será alterado.</p></div><div className="flex flex-wrap gap-1.5">{proposalNiches.map((item) => <button type="button" key={item} onClick={() => chooseNiche(item)} className={`rounded-full px-3 py-1.5 text-[9px] font-medium transition-colors ${niche === item ? 'bg-black text-white' : 'bg-[#F3F4F5] text-[#6E6E73] hover:text-black'}`}>{item}</button>)}</div></div>
    <div className="mt-5 border-t border-black/[0.06] pt-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Estilo visual</p><p className="mt-1 text-[10px] text-[#6E6E73]">A identidade da marca será aplicada sobre esta direção de design.</p></div>{brandColors && <div className="flex items-center gap-2 rounded-full bg-[#F5F5F7] px-3 py-2"><span className="text-[8px] font-medium uppercase tracking-[0.1em] text-[#8E8E93]">Paleta da marca</span>{brandColors.map((color) => <i key={color} className="size-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div>}</div><div className="mt-3 grid gap-2 md:grid-cols-3">{visualStyles.map((option) => <button type="button" key={option.id} onClick={() => chooseStyle(option.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${style === option.id ? 'border-black bg-[#171719] text-white shadow-lg' : 'border-black/[0.07] bg-[#FAFAFB] hover:-translate-y-0.5 hover:border-black/20'}`}><span className="h-12 w-20 shrink-0 overflow-hidden rounded-xl"><ProposalThumbnail template={proposalTemplates.find((template) => template.theme === option.id)?.value} /></span><span><strong className="block text-[10px]">{option.name}</strong><span className={`mt-1 block text-[8px] leading-3 ${style === option.id ? 'text-white/45' : 'text-[#8E8E93]'}`}>{option.description}</span></span></button>)}</div></div>
    <div className="mt-5 border-t border-black/[0.06] pt-5"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">Modelo da apresentação</p><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{options.map((template) => <button type="button" key={template.id} onClick={() => onSelect(template.value)} className={`overflow-hidden rounded-2xl border p-2 text-left transition-all ${selected === template.value ? 'border-black bg-black text-white shadow-lg' : 'border-black/[0.07] bg-[#FAFAFB] hover:-translate-y-0.5 hover:border-black/20'}`}><span className="block overflow-hidden rounded-xl aspect-video"><ProposalThumbnail template={template.value} /></span><span className="block px-1 pb-1"><strong className="mt-2 block truncate text-[10px]">{template.name}</strong><span className={`mt-1 block text-[8px] leading-3 ${selected === template.value ? 'text-white/45' : 'text-[#8E8E93]'}`}>{template.description}</span></span></button>)}</div></div>
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#EEF3F1] px-3 py-2"><Check className="size-3.5 shrink-0 text-[#357252]" /><span className="min-w-0 text-[9px] text-[#5E6E67]"><strong>{selectedTemplate.niche} · {visualStyles.find((item) => item.id === selectedTemplate.theme)?.name} · {selectedTemplate.name}</strong> — {selectedTemplate.focus}</span></div>
  </section>;
}

function AgentSetup({ initialProfile, onSaved, onNotify }: { initialProfile: AgentProfile; onSaved: (profile: AgentProfile) => void; onNotify: (message: string) => void }) {
  const [profile, setProfile] = useState(initialProfile);
  const [servicesText, setServicesText] = useState(initialProfile.services.join('\n'));
  const [references, setReferences] = useState<ProposalReference[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<BrandAsset['kind'] | null>(null);
  const [analyzingPalette, setAnalyzingPalette] = useState(false);
  const [detectedPalette, setDetectedPalette] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([fetch('/api/agent/references'), fetch('/api/agent/assets')]).then(async ([referencesResponse, assetsResponse]) => {
      if (referencesResponse.ok) setReferences(((await referencesResponse.json()) as { references: ProposalReference[] }).references);
      if (assetsResponse.ok) setAssets(((await assetsResponse.json()) as { assets: BrandAsset[] }).assets);
    }).catch(() => undefined);
  }, []);

  function update(field: keyof AgentProfile, value: string) { setProfile((current) => ({ ...current, [field]: value })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaving(true);
    const services = servicesText.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
    const response = await fetch('/api/agent/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, services }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { profile?: AgentProfile; error?: string } : {};
    setSaving(false);
    if (!response?.ok || !payload.profile) { setError(payload.error || 'Não foi possível salvar a configuração.'); return; }
    onSaved(payload.profile);
  }

  async function uploadReference(file?: File) {
    if (!file) return;
    setError(''); setUploading(true);
    const form = new FormData(); form.append('file', file);
    const response = await fetch('/api/agent/references', { method: 'POST', body: form }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { reference?: ProposalReference; error?: string } : {};
    setUploading(false);
    if (!response?.ok || !payload.reference) { setError(payload.error || 'Não foi possível enviar a referência.'); return; }
    setReferences((items) => [payload.reference!, ...items]); onNotify('Referência adicionada à memória do agente');
  }

  async function removeReference(reference: ProposalReference) {
    if (!window.confirm(`Remover a referência “${reference.name}”?`)) return;
    const response = await fetch('/api/agent/references', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reference.id }) }).catch(() => null);
    if (response?.ok) { setReferences((items) => items.filter((item) => item.id !== reference.id)); onNotify('Referência removida'); }
  }

  async function uploadBrandAsset(file: File | undefined, kind: BrandAsset['kind']) {
    if (!file) return;
    setError(''); setUploadingAsset(kind);
    const form = new FormData(); form.append('file', file); form.append('kind', kind);
    const response = await fetch('/api/agent/assets', { method: 'POST', body: form }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { asset?: BrandAsset; error?: string } : {};
    setUploadingAsset(null);
    if (!response?.ok || !payload.asset) { setError(payload.error || 'Não foi possível enviar a imagem.'); return; }
    setAssets((items) => kind === 'logo' ? [payload.asset!, ...items.filter((item) => item.kind !== 'logo')] : [payload.asset!, ...items]);
    if (kind === 'logo') void identifyBrandPalette([payload.asset.url, ...assets.filter((asset) => asset.kind !== 'logo').slice(0, 3).map((asset) => asset.url)]);
    onNotify(kind === 'logo' ? 'Logo adicionada à identidade da empresa' : 'Imagem adicionada à biblioteca visual');
  }

  async function identifyBrandPalette(sourceUrls = assets.slice(0, 5).map((asset) => asset.url)) {
    if (!sourceUrls.length) { setError('Adicione a logo ou uma imagem para identificar a paleta da marca.'); return; }
    setError(''); setAnalyzingPalette(true);
    const palette = await extractBrandPalette(sourceUrls).catch(() => [] as string[]);
    setAnalyzingPalette(false);
    if (palette.length < 2) { setError('Não foi possível identificar cores suficientes. Tente uma imagem mais nítida.'); return; }
    setDetectedPalette(palette);
    setProfile((current) => ({ ...current, primaryColor: palette[0], secondaryColor: palette[1] }));
    onNotify('Paleta da marca identificada e aplicada');
  }

  function editAsset(id: number, changes: Partial<Pick<BrandAsset, 'caption' | 'kind'>>) {
    setAssets((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  async function persistAsset(asset: BrandAsset) {
    const response = await fetch('/api/agent/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: asset.id, caption: asset.caption, kind: asset.kind }) }).catch(() => null);
    if (!response?.ok) setError('Não foi possível atualizar os dados da imagem.');
  }

  async function removeAsset(asset: BrandAsset) {
    if (!window.confirm(`Remover “${asset.name}” da biblioteca visual?`)) return;
    const response = await fetch('/api/agent/assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: asset.id }) }).catch(() => null);
    if (response?.ok) { setAssets((items) => items.filter((item) => item.id !== asset.id)); onNotify('Imagem removida da biblioteca'); }
  }

  const logo = assets.find((asset) => asset.kind === 'logo');
  const portfolioAssets = assets.filter((asset) => asset.kind === 'portfolio');
  const galleryAssets = assets.filter((asset) => asset.kind === 'gallery');

  return <div className="mx-auto max-w-[1260px]"><PageTitle kicker="Setup inteligente" title="Identidade e inteligência da empresa" description="Configure os dados, a marca, o portfólio e as referências que o agente deve usar em todas as propostas." />
    <div className="grid gap-5 xl:grid-cols-[0.34fr_1fr]">
      <aside className="h-fit rounded-[26px] bg-[#172A25] p-6 text-white xl:sticky xl:top-24"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Sparkles /></span><h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">A proposta deve carregar a identidade da empresa.</h2><p className="mt-2 text-[11px] leading-5 text-white/45">O agente combina estes dados com cada novo briefing para criar uma apresentação coerente e autoral.</p><div className="mt-8 space-y-5"><SetupStep number="01" title="Identidade" text="Logo, dados e cores da marca." /><SetupStep number="02" title="Oferta" text="Serviços, diferenciais e linguagem." /><SetupStep number="03" title="Portfólio" text="Projetos e imagens para as propostas." /><SetupStep number="04" title="Referências" text="Documentos que ensinam o padrão." /></div><div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[10px] leading-4 text-white/50">Logo, contatos e imagens são incorporados automaticamente às novas propostas-site.</div></aside>
      <form onSubmit={save} className="space-y-5">
        <SetupCard number="01" title="Identidade da empresa" description="Dados e elementos visuais usados no cabeçalho, capa e contato das propostas.">
          <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
            <div><span className="mb-1.5 block text-[11px] font-medium text-[#5d5d62]">Logo principal</span><label className="group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-black/15 bg-[#F7F7F9] text-center transition-colors hover:bg-[#F0F2F1]">{logo ? <img src={logo.url} alt={`Logo ${profile.businessName || 'da empresa'}`} className="h-full w-full object-contain p-5" /> : <><span className="grid size-11 place-items-center rounded-2xl bg-white text-[#31594E] shadow-sm"><ImageIcon /></span><strong className="mt-3 text-[11px]">{uploadingAsset === 'logo' ? 'Enviando...' : 'Adicionar logo'}</strong><span className="mt-1 px-4 text-[9px] leading-4 text-[#8E8E93]">PNG, JPG ou WebP</span></>}<input disabled={uploadingAsset !== null} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void uploadBrandAsset(event.target.files?.[0], 'logo'); event.currentTarget.value = ''; }} /></label>{logo && <div className="mt-2 flex gap-2"><label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2 text-[9px] font-medium"><Upload className="mr-1.5 size-3" />Trocar<input disabled={uploadingAsset !== null} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void uploadBrandAsset(event.target.files?.[0], 'logo'); event.currentTarget.value = ''; }} /></label><Button type="button" variant="ghost" size="sm" className="rounded-xl text-[#B54336]" onClick={() => void removeAsset(logo)}><Trash2 /></Button></div>}</div>
            <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Nome da marca"><Input required value={profile.businessName} onChange={(event) => update('businessName', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Somus Group" /></Field><Field label="Razão social"><Input value={profile.legalName} onChange={(event) => update('legalName', event.target.value)} className="h-11 rounded-xl" placeholder="Nome jurídico da empresa" /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Segmento"><Input required value={profile.segment} onChange={(event) => update('segment', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Consultoria, marketing, tecnologia..." /></Field><Field label="Público que recebe as propostas"><Input required value={profile.audience} onChange={(event) => update('audience', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Diretores de empresas" /></Field></div><Field label="Apresentação institucional"><textarea value={profile.description} onChange={(event) => update('description', event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder="Quem é a empresa, em que acredita e que transformação entrega?" /></Field></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Site"><Input value={profile.website} onChange={(event) => update('website', event.target.value)} className="h-11 rounded-xl" placeholder="www.suaempresa.com.br" /></Field><Field label="Instagram ou rede principal"><Input value={profile.instagram} onChange={(event) => update('instagram', event.target.value)} className="h-11 rounded-xl" placeholder="@suaempresa" /></Field><Field label="E-mail comercial"><Input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} className="h-11 rounded-xl" placeholder="contato@suaempresa.com.br" /></Field><Field label="Telefone"><Input value={profile.phone} onChange={(event) => update('phone', event.target.value)} className="h-11 rounded-xl" placeholder="(31) 99999-9999" /></Field></div>
          <Field label="Endereço"><Input value={profile.address} onChange={(event) => update('address', event.target.value)} className="h-11 rounded-xl" placeholder="Cidade, estado ou endereço completo" /></Field>
          <div className="grid gap-4 md:grid-cols-2"><BrandColorField label="Cor principal" color={profile.primaryColor} onChange={(color) => update('primaryColor', color)} /><BrandColorField label="Cor de destaque" color={profile.secondaryColor} onChange={(color) => update('secondaryColor', color)} /></div>
          <div className="rounded-[20px] border border-black/[0.06] bg-[#F7F7F9] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#5164C9] shadow-sm"><Palette className="size-4" /></span><span><strong className="block text-[11px]">Paleta inteligente da marca</strong><span className="mt-1 block text-[9px] text-[#8E8E93]">Analisa a logo e as imagens para sugerir cores coerentes.</span></span></div><Button type="button" variant="outline" size="sm" disabled={analyzingPalette || assets.length === 0} className="rounded-xl bg-white" onClick={() => void identifyBrandPalette()}><Sparkles />{analyzingPalette ? 'Analisando...' : 'Identificar paleta'}</Button></div><div className="mt-4 flex items-center gap-2">{(detectedPalette.length ? detectedPalette : [profile.primaryColor, profile.secondaryColor]).map((color, index) => <button type="button" key={`${color}-${index}`} onClick={() => update(index === 0 ? 'primaryColor' : 'secondaryColor', color)} className="group relative size-10 rounded-xl border border-black/10 shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: color }} aria-label={`Usar ${color} como ${index === 0 ? 'cor principal' : 'cor de destaque'}`}><span className="absolute inset-x-0 -bottom-4 hidden text-[7px] font-medium text-[#6E6E73] group-hover:block">{color}</span></button>)}<span className="ml-2 text-[9px] leading-4 text-[#8E8E93]">As duas primeiras cores são aplicadas automaticamente. Você pode ajustá-las antes de salvar.</span></div></div>
        </SetupCard>
        <SetupCard number="02" title="Oferta e linguagem" description="Como o agente deve interpretar e apresentar o seu valor."><div className="grid gap-4 md:grid-cols-2"><Field label="Serviços ou soluções"><textarea required value={servicesText} onChange={(event) => setServicesText(event.target.value)} className="min-h-32 w-full rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder={'Consultoria estratégica\nImplantação\nAcompanhamento'} /></Field><Field label="Diferenciais"><textarea value={profile.differentiators} onChange={(event) => update('differentiators', event.target.value)} className="min-h-32 w-full rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder="O que faz o cliente escolher sua empresa?" /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Tom de voz"><AppSelect value={profile.tone} onValueChange={(value) => update('tone', value)} ariaLabel="Tom de voz" options={['Consultivo, claro e confiante', 'Executivo, direto e objetivo', 'Inspirador, humano e sofisticado', 'Técnico, preciso e detalhado'].map((value) => ({ value, label: value }))} /></Field><Field label="Estrutura preferida"><Input value={profile.proposalStructure} onChange={(event) => update('proposalStructure', event.target.value)} className="h-11 rounded-xl" /></Field></div><Field label="Instruções especiais para o agente"><textarea value={profile.instructions} onChange={(event) => update('instructions', event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder="Ex.: Nunca usar linguagem excessivamente técnica. Sempre destacar prazo e retorno esperado." /></Field></SetupCard>
        <SetupCard number="03" title="Portfólio e biblioteca visual" description="As imagens do portfólio aparecem nas propostas. A biblioteca também serve como repertório visual para capas e seções."><div className="grid gap-3 md:grid-cols-2"><BrandUpload kind="portfolio" title="Adicionar ao portfólio" description="Projetos, cases e resultados" loading={uploadingAsset === 'portfolio'} onUpload={uploadBrandAsset} /><BrandUpload kind="gallery" title="Adicionar imagem de marca" description="Equipe, bastidores, ambientes e texturas" loading={uploadingAsset === 'gallery'} onUpload={uploadBrandAsset} /></div>{portfolioAssets.length > 0 && <div><p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E6E73]">Portfólio selecionado</p><BrandAssetGrid assets={portfolioAssets} onEdit={editAsset} onPersist={persistAsset} onRemove={removeAsset} /></div>}{galleryAssets.length > 0 && <div><p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E6E73]">Biblioteca da marca</p><BrandAssetGrid assets={galleryAssets} onEdit={editAsset} onPersist={persistAsset} onRemove={removeAsset} /></div>}{portfolioAssets.length === 0 && galleryAssets.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAFB] px-5 py-8 text-center"><ImageIcon className="mx-auto size-5 text-[#AEAEB2]" /><p className="mt-2 text-[10px] text-[#8E8E93]">Adicione imagens para dar identidade visual às propostas.</p></div>}</SetupCard>
        <SetupCard number="04" title="Propostas de referência" description="Envie documentos que representem a linguagem, estrutura e profundidade desejadas."><label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-[#98A7A1] bg-[#F3F8F5] p-5 transition-colors hover:bg-[#EAF3EE]"><span className="grid size-11 place-items-center rounded-2xl bg-white text-[#31594E] shadow-sm"><Paperclip /></span><span className="flex-1"><strong className="block text-xs">{uploading ? 'Enviando referência...' : 'Enviar proposta de referência'}</strong><span className="mt-1 block text-[10px] text-[#6E7A75]">PDF, DOCX, TXT ou Markdown · até 10 MB</span></span><input disabled={uploading} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(event) => { void uploadReference(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>{references.length > 0 && <div className="mt-4 space-y-2">{references.map((reference) => <div key={reference.id} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-3"><span className="grid size-9 place-items-center rounded-xl bg-[#EEF0FF] text-[#5164C9]"><FileCheck2 className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-medium">{reference.name}</strong><span className="text-[9px] text-[#8E8E93]">{(reference.sizeBytes / 1024).toFixed(0)} KB · {reference.status}</span></span><Button type="button" onClick={() => void removeReference(reference)} variant="ghost" size="icon-sm" className="rounded-full text-[#8E8E93]" aria-label={`Remover ${reference.name}`}><Trash2 /></Button></div>)}</div>}</SetupCard>
        {error && <p className="rounded-xl bg-[#FFF0EE] px-4 py-3 text-[11px] font-medium text-[#B54336]">{error}</p>}<div className="flex flex-col gap-3 rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] text-[#8E8E93]">{logo ? 'Logo configurada' : 'Logo pendente'} · {portfolioAssets.length} projetos · {galleryAssets.length} imagens · {references.length} referências</span><Button disabled={saving || uploadingAsset !== null} type="submit" className="h-11 rounded-xl bg-[#172A25] px-5 text-white">{saving ? 'Salvando configuração' : <><Check />Salvar e conversar com o agente</>}</Button></div>
      </form>
    </div>
  </div>;
}

function SetupStep({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[9px] text-white/65">{number}</span><span><strong className="block text-[11px] font-medium">{title}</strong><span className="mt-1 block text-[9px] text-white/35">{text}</span></span></div>; }
function SetupCard({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) { return <section className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(25,38,34,0.04)] md:p-6"><div className="mb-6 flex gap-3"><span className="grid size-8 place-items-center rounded-xl bg-[#EEF0FF] text-[10px] font-semibold text-[#5164C9]">{number}</span><span><h2 className="text-[15px] font-semibold">{title}</h2><p className="mt-1 text-[10px] text-[#8E8E93]">{description}</p></span></div><div className="space-y-4">{children}</div></section>; }
function NativeColorInput({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) { const safeValue = /^#[0-9a-f]{6}$/i.test(value) ? value : '#F5F5F7'; return <input type="color" value={safeValue} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} className="h-8 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0" />; }
function BrandColorField({ label, color, onChange }: { label: string; color: string; onChange: (color: string) => void }) { const [draft, setDraft] = useState(color.toUpperCase()); useEffect(() => setDraft(color.toUpperCase()), [color]); function commit(value: string) { const normalized = value.toUpperCase(); if (/^#[0-9A-F]{6}$/.test(normalized)) { setDraft(normalized); onChange(normalized); return; } setDraft(color.toUpperCase()); } return <Field label={label}><div className="flex h-11 items-center gap-3 rounded-xl border border-input bg-white px-3 focus-within:ring-2 focus-within:ring-black/10"><NativeColorInput value={color} onChange={(value) => commit(value)} ariaLabel={`Abrir seletor para ${label.toLowerCase()}`} /><Input value={draft} onChange={(event) => { const value = event.target.value.toUpperCase(); setDraft(value); if (/^#[0-9A-F]{6}$/.test(value)) onChange(value); }} onBlur={() => commit(draft)} className="h-8 border-0 px-0 font-mono text-xs uppercase shadow-none focus-visible:ring-0" aria-label={`Código hexadecimal da ${label.toLowerCase()}`} /><span className="size-6 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(color) ? color : '#F5F5F7' }} /></div></Field>; }
function BrandUpload({ kind, title, description, loading, onUpload }: { kind: BrandAsset['kind']; title: string; description: string; loading: boolean; onUpload: (file: File | undefined, kind: BrandAsset['kind']) => void }) { return <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-[#98A7A1] bg-[#F3F8F5] p-4 transition-colors hover:bg-[#EAF3EE]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#31594E] shadow-sm"><Upload className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-[11px]">{loading ? 'Enviando imagem...' : title}</strong><span className="mt-1 block text-[9px] text-[#6E7A75]">{description} · até 8 MB</span></span><input disabled={loading} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { onUpload(event.target.files?.[0], kind); event.currentTarget.value = ''; }} /></label>; }
function BrandAssetGrid({ assets, onEdit, onPersist, onRemove }: { assets: BrandAsset[]; onEdit: (id: number, changes: Partial<Pick<BrandAsset, 'caption' | 'kind'>>) => void; onPersist: (asset: BrandAsset) => void; onRemove: (asset: BrandAsset) => void }) { return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white"><div className="relative aspect-[4/3] bg-[#F3F3F5]"><img src={asset.url} alt={asset.caption || asset.name} className="h-full w-full object-cover" /><Button type="button" onClick={() => void onRemove(asset)} variant="secondary" size="icon-sm" className="absolute right-2 top-2 rounded-full bg-white/90 text-[#B54336] shadow-sm backdrop-blur" aria-label={`Remover ${asset.name}`}><Trash2 /></Button><div className="absolute bottom-2 left-2 w-28"><AppSelect value={asset.kind} onValueChange={(value) => { const kind = value as BrandAsset['kind']; onEdit(asset.id, { kind }); void onPersist({ ...asset, kind }); }} ariaLabel={`Tipo da imagem ${asset.name}`} compact dark options={[{ value: 'portfolio', label: 'Portfólio' }, { value: 'gallery', label: 'Biblioteca' }]} /></div></div><div className="p-3"><Input value={asset.caption} onChange={(event) => onEdit(asset.id, { caption: event.target.value })} onBlur={() => { const current = assets.find((item) => item.id === asset.id); if (current) void onPersist(current); }} className="h-9 rounded-xl border-black/8 bg-[#FAFAFB] text-[10px]" placeholder="Legenda ou nome do projeto" /><p className="mt-2 truncate text-[8px] text-[#AEAEB2]">{asset.name}</p></div></article>)}</div>; }

async function extractBrandPalette(urls: string[]) {
  const scores = new Map<string, number>();
  await Promise.allSettled(urls.slice(0, 5).map(async (url) => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const element = new Image(); element.crossOrigin = 'anonymous'; element.onload = () => resolve(element); element.onerror = reject; element.src = url; });
    const canvas = document.createElement('canvas'); canvas.width = 88; canvas.height = 88;
    const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 0; index < pixels.length; index += 16) {
      if (pixels[index + 3] < 180) continue;
      const raw = [pixels[index], pixels[index + 1], pixels[index + 2]];
      if (raw.every((channel) => channel > 244)) continue;
      const channels = raw.map((channel) => Math.min(255, Math.round(channel / 24) * 24));
      const saturation = Math.max(...channels) - Math.min(...channels);
      const color = `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      scores.set(color, (scores.get(color) || 0) + 1 + saturation / 70);
    }
  }));
  const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1]).map(([color]) => color);
  const selected: string[] = [];
  for (const color of ranked) {
    if (selected.every((existing) => colorDistance(existing, color) > 72)) selected.push(color);
    if (selected.length === 5) break;
  }
  if (selected.length === 1) selected.push(derivedAccent(selected[0]));
  return selected;
}

function colorDistance(first: string, second: string) { const a = [1, 3, 5].map((index) => Number.parseInt(first.slice(index, index + 2), 16)); const b = [1, 3, 5].map((index) => Number.parseInt(second.slice(index, index + 2), 16)); return Math.sqrt(a.reduce((total, channel, index) => total + (channel - b[index]) ** 2, 0)); }
function derivedAccent(color: string) { const channels = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16)); const next = [channels[1], channels[2], channels[0]].map((channel, index) => Math.max(32, Math.min(232, index === 0 ? 255 - channel : channel + 48))); return `#${next.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`.toUpperCase(); }

function AgentStudio({ profile, onSetup, onGenerated, onNotify }: { profile: AgentProfile; onSetup: () => void; onGenerated: (proposal: Proposal) => void; onNotify: (message: string) => void }) {
  return <ProposalWorkflow profile={profile} onSetup={onSetup} onGenerated={onGenerated} onNotify={onNotify} initialTemplate={proposalTemplates[0].value} renderTemplates={(selected, onSelect) => <ProposalTemplatePicker selected={selected} onSelect={onSelect} brandColors={[profile.primaryColor, profile.secondaryColor]} />} />;
}

function AgentMessage({ children }: { children: ReactNode }) { return <div className="flex max-w-[90%] gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-xl bg-black text-white"><Sparkles className="size-3.5" /></span><div className="rounded-[20px] rounded-tl-[6px] bg-[#f5f5f7] px-4 py-3 text-xs leading-5 text-[#3a3a3c]">{children}</div></div>; }
function BadgePill({ label }: { label: string }) { return <span className="ml-auto rounded-full bg-[#f1f1f3] px-2.5 py-1 text-[9px] font-medium text-[#6e6e73]">{label}</span>; }
function BriefCard({ icon: Icon, label, value }: { icon: typeof Users2; label: string; value: string }) { return <div className="rounded-2xl bg-[#f7f7f9] p-4"><Icon className="size-4 text-[#6e6e73]" /><span className="mt-4 block text-[9px] text-[#8e8e93]">{label}</span><strong className="mt-1 block text-[11px] font-medium leading-4">{value}</strong></div>; }
function BriefBlock({ title, items }: { title: string; items: string[] }) { return <div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8e8e93]">{title}</p><div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full border border-black/[0.07] px-2.5 py-1.5 text-[10px] text-[#5c5c62]">{item}</span>)}</div></div>; }
function AgentStep({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-4"><span className="text-[10px] text-white/25">{number}</span><div><strong className="block text-[13px] font-medium">{title}</strong><p className="mt-1 max-w-xs text-[10px] leading-4 text-white/40">{text}</p></div></div>; }

function ProposalEditor({ proposal, onBack, onNotify }: { proposal: Proposal; onBack: () => void; onNotify: (message: string) => void }) {
  const [slide, setSlide] = useState(0);
  const [zoom, setZoom] = useState(72);
  const [title, setTitle] = useState(proposal.project);
  const [client, setClient] = useState(proposal.client);
  const [value, setValue] = useState(proposal.value);
  const [template, setTemplate] = useState(proposal.template);
  const [content, setContent] = useState<AgentResult['proposal']>(() => ({
    brand_name: proposal.content?.brand_name || 'SOMUS',
    logo_url: proposal.content?.logo_url,
    hero_image_url: proposal.content?.hero_image_url,
    primary_color: proposal.content?.primary_color,
    secondary_color: proposal.content?.secondary_color,
    company: proposal.content?.company,
    portfolio_images: proposal.content?.portfolio_images,
    title: proposal.content?.title || proposal.project,
    subtitle: proposal.content?.subtitle || 'Uma solução construída com clareza, intenção e alto padrão de entrega.',
    slides: proposal.content?.slides?.length ? proposal.content.slides : createFallbackProposalSections(proposal),
  }));
  const [tool, setTool] = useState('Design');
  const [publishing, setPublishing] = useState(false);
  const slides = content.slides.map((item) => item.eyebrow || item.title);
  const section = content.slides[slide] ?? content.slides[0];
  const backgroundPresets = ['#F7F1E8', '#E9DED0', '#F0EEE8', '#172A25', '#0B0B0C', '#3434D8', '#B86538', '#FF5D45', '#E9FF70'];
  function copyLink() { void navigator.clipboard?.writeText(`${window.location.origin}/p/${proposal.slug}`); onNotify('Link público copiado'); }
  function openSection(index: number) { setSlide(index); window.requestAnimationFrame(() => document.getElementById(`editor-proposal-section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
  function updateSection(field: 'eyebrow' | 'title' | 'body' | 'bullets' | 'backgroundColor', next: string | string[]) {
    setContent((current) => ({ ...current, slides: current.slides.map((item, index) => index === slide ? { ...item, [field]: next } : item) }));
  }
  function addSection() {
    const insertAt = Math.max(1, content.slides.length - 1);
    const nextSection = { type: 'custom', eyebrow: `${String(insertAt).padStart(2, '0')} · Nova seção`, title: 'Uma nova ideia para esta proposta.', body: 'Descreva aqui o conteúdo que deve conduzir o cliente ao próximo passo.', bullets: ['Ponto principal', 'Diferencial', 'Resultado esperado'] };
    setContent((current) => ({ ...current, slides: [...current.slides.slice(0, insertAt), nextSection, ...current.slides.slice(insertAt)] }));
    setSlide(insertAt);
    window.requestAnimationFrame(() => document.getElementById(`editor-proposal-section-${insertAt}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    onNotify('Nova seção adicionada à one page');
  }
  function deleteSection() {
    if (slide === 0 || slide === content.slides.length - 1) { onNotify('A capa e o encerramento são seções essenciais'); return; }
    const nextIndex = Math.max(0, slide - 1);
    setContent((current) => ({ ...current, slides: current.slides.filter((_, index) => index !== slide) }));
    setSlide(nextIndex);
    onNotify('Seção removida');
  }
  async function publish() {
    setPublishing(true);
    const nextContent = { ...content, title };
    setContent(nextContent);
    const response = await fetch('/api/proposals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: proposal.id, project: title, client, value, template, content: nextContent }) }).catch(() => null);
    setPublishing(false);
    onNotify(response?.ok ? 'One page publicada e link atualizado' : 'Não foi possível publicar a proposta');
  }
  return <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#e9e9ec] text-[#1d1d1f]">
    <header className="flex h-16 shrink-0 items-center gap-1.5 border-b border-black/[0.08] bg-white px-2.5 shadow-sm sm:gap-2 sm:px-3 md:px-4"><Button aria-label="Voltar para propostas" variant="ghost" size="icon" className="rounded-xl" onClick={onBack}><ArrowLeft /></Button><div className="ml-1 hidden min-w-0 sm:block"><strong className="block truncate text-xs font-semibold">{title}</strong><span className="block text-[9px] text-[#8e8e93]">{proposal.code} · Editor de site one page</span></div><div className="ml-auto flex items-center gap-1.5"><Button variant="ghost" size="sm" className="hidden rounded-xl md:flex" onClick={() => window.open(`/p/${proposal.slug}`, '_blank')}><Eye /> Visualizar</Button><Button aria-label="Copiar link da proposta" variant="outline" size="sm" className="rounded-xl border-black/10 bg-white px-3" onClick={copyLink}><Link2 /><span className="hidden sm:inline">Compartilhar</span></Button><Button aria-label="Publicar proposta" disabled={publishing} size="sm" className="rounded-xl bg-black px-3 text-white sm:px-4" onClick={() => void publish()}><Send /><span className="hidden sm:inline">{publishing ? 'Publicando...' : 'Publicar'}</span></Button></div></header>
    <div className="grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[64px_190px_minmax(0,1fr)_310px]">
      <aside className="border-r border-black/[0.08] bg-white p-2">{[[PanelLeftClose, 'Seções'], [Grid2X2, 'Layouts'], [Type, 'Texto'], [ImageIcon, 'Fotos'], [Shapes, 'Elementos'], [Upload, 'Uploads']].map(([Icon, label]) => <EditorTool key={label as string} icon={Icon as typeof Type} label={label as string} active={tool === label} onClick={() => setTool(label as string)} />)}</aside>
      <aside className="hidden overflow-y-auto border-r border-black/[0.08] bg-[#f8f8fa] p-3 xl:block"><div className="mb-3 flex items-center justify-between px-1"><span className="text-[10px] font-semibold text-[#6e6e73]">SEÇÕES DA ONE PAGE</span><Button aria-label="Adicionar seção" onClick={addSection} variant="ghost" size="icon-xs"><Plus /></Button></div><div className="space-y-3">{slides.map((item, index) => <button key={`${item}-${index}`} onClick={() => openSection(index)} className="block w-full text-left"><span className="mb-1.5 block truncate text-[9px] text-[#8e8e93]">{index + 1} · {item}</span><div className={`aspect-video overflow-hidden rounded-lg ${slide === index ? 'ring-2 ring-[#5b7fff] ring-offset-2' : 'ring-1 ring-black/10'}`}><ProposalThumbnail template={template} index={index} /></div></button>)}</div><button onClick={addSection} className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-black/15 py-2.5 text-[10px] text-[#6e6e73]"><Plus className="size-3" />Adicionar seção</button></aside>
      <main className="relative flex min-w-0 flex-col overflow-hidden"><div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-black/[0.07] bg-white/70 px-3 backdrop-blur"><span className="mr-2 hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8E8E93] sm:inline">Visualização do site</span><Button onClick={() => onNotify('Seletor de fonte aberto')} variant="ghost" size="sm" className="rounded-lg text-[11px]">Fonte <ChevronDown /></Button><Button onClick={() => onNotify('Peso Semibold selecionado')} variant="ghost" size="sm" className="rounded-lg text-[11px]">Semibold</Button><span className="mx-1 h-5 w-px shrink-0 bg-black/10" /><Button aria-label="Mais opções de texto" onClick={() => onNotify('Mais opções de texto')} variant="ghost" size="icon-sm"><MoreHorizontal /></Button></div><div className="flex-1 overflow-auto p-3 sm:p-5 md:p-8"><div className="mx-auto w-full max-w-[1060px]" style={{ width: `${zoom > 80 ? 100 : Math.max(64, zoom)}%` }}><div className="overflow-hidden rounded-xl bg-white shadow-[0_25px_70px_rgba(0,0,0,0.18)]"><ProposalOnePage preview idPrefix="editor-proposal" proposal={{ ...proposal, client, project: title, value, template, content }} /></div><div className="sticky bottom-4 mx-auto mt-5 flex w-fit items-center gap-1 rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg"><Button variant="ghost" size="icon-sm" onClick={() => setZoom((current) => Math.max(40, current - 10))}><ZoomOut /></Button><span className="w-12 text-center text-[10px] text-[#6e6e73]">{zoom}%</span><Button variant="ghost" size="icon-sm" onClick={() => setZoom((current) => Math.min(100, current + 10))}><ZoomIn /></Button></div></div></div></main>
      <aside className="hidden overflow-y-auto border-l border-black/[0.08] bg-white p-5 xl:block"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8e8e93]">Editar seção</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{slides[slide]}</h2></div>{slide > 0 && slide < content.slides.length - 1 && <Button aria-label="Excluir seção" variant="ghost" size="icon-sm" className="text-[#C03F32]" onClick={deleteSection}><Trash2 /></Button>}</div><div className="mt-6 space-y-5"><Field label="Nome interno da proposta"><Input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-xl border-black/10 bg-[#f7f7f9]" /></Field><Field label="Cliente"><Input value={client} onChange={(event) => setClient(event.target.value)} className="h-10 rounded-xl border-black/10 bg-[#f7f7f9]" /></Field>{section?.type === 'investment' && <Field label="Investimento"><Input value={value} onChange={(event) => setValue(Number(event.target.value))} type="number" className="h-10 rounded-xl border-black/10 bg-[#f7f7f9]" /></Field>}<Field label="Rótulo da seção"><Input value={section?.eyebrow || ''} onChange={(event) => updateSection('eyebrow', event.target.value)} className="h-10 rounded-xl border-black/10 bg-[#f7f7f9]" /></Field><Field label="Título da seção"><Input value={section?.title || ''} onChange={(event) => updateSection('title', event.target.value)} className="h-10 rounded-xl border-black/10 bg-[#f7f7f9]" /></Field><Field label="Texto de apoio"><textarea className="min-h-28 w-full resize-none rounded-xl border border-black/10 bg-[#f7f7f9] p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" value={slide === 0 ? content.subtitle : section?.body || ''} onChange={(event) => slide === 0 ? setContent((current) => ({ ...current, subtitle: event.target.value })) : updateSection('body', event.target.value)} /></Field>{slide > 0 && slide < content.slides.length - 1 && <Field label="Tópicos — um por linha"><textarea className="min-h-24 w-full resize-none rounded-xl border border-black/10 bg-[#f7f7f9] p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" value={(section?.bullets || []).join('\n')} onChange={(event) => updateSection('bullets', event.target.value.split('\n').filter(Boolean))} /></Field>}<Button variant="outline" className="h-10 w-full rounded-xl border-black/10 bg-white" onClick={() => onNotify('Texto preparado para refinamento com IA')}><Sparkles /> Refinar com IA</Button></div><div className="mt-8 border-t border-black/[0.07] pt-5"><div className="flex items-center gap-2"><Palette className="size-3.5 text-[#8E8E93]" /><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8e8e93]">Fundo da seção</p></div><div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={() => updateSection('backgroundColor', '')} className={`grid size-8 place-items-center rounded-full border bg-white text-[8px] text-[#8E8E93] ${!section?.backgroundColor ? 'ring-2 ring-black ring-offset-2' : 'border-black/10'}`} aria-label="Usar fundo do layout">Auto</button>{backgroundPresets.map((color) => <button key={color} onClick={() => updateSection('backgroundColor', color)} className={`size-8 rounded-full border border-black/10 ${section?.backgroundColor === color ? 'ring-2 ring-black ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Aplicar fundo ${color}`} />)}<NativeColorInput value={section?.backgroundColor || '#F7F1E8'} onChange={(color) => updateSection('backgroundColor', color)} ariaLabel="Abrir seletor de cor personalizada da seção" /></div><p className="mt-3 text-[9px] leading-4 text-[#8E8E93]">A cor é aplicada apenas nesta seção e permanece no link compartilhado.</p></div><div className="mt-8 border-t border-black/[0.07] pt-5"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8e8e93]">Identidade visual</p><div className="space-y-2">{proposalTemplates.map((option) => <button key={option.id} onClick={() => { setTemplate(option.value); onNotify(`${option.name} aplicado à proposta`); }} className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all ${template === option.value ? 'border-black bg-black text-white' : 'border-black/[0.07] bg-[#F7F7F9] hover:border-black/20'}`}><span className="h-12 w-20 shrink-0 overflow-hidden rounded-lg"><ProposalThumbnail template={option.value} /></span><span className="min-w-0"><strong className="block text-[10px]">{option.name}</strong><span className={`mt-0.5 block truncate text-[8px] ${template === option.value ? 'text-white/45' : 'text-[#8E8E93]'}`}>{option.description}</span></span></button>)}</div></div></aside>
    </div>
  </div>;
}

function EditorTool({ icon: Icon, label, active, onClick }: { icon: typeof Type; label: string; active?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`mb-1 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-[8px] ${active ? 'bg-[#f0f2ff] text-[#4f67c7]' : 'text-[#6e6e73] hover:bg-[#f5f5f7]'}`}><Icon className="size-[17px]" strokeWidth={1.7} />{label}</button>; }
function MemberDialog({ open, onOpenChange, onSubmit, error }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md rounded-[26px] p-5 sm:p-6"><DialogHeader><span className="mb-2 grid size-11 place-items-center rounded-2xl bg-[#172A25] text-white"><UserPlus /></span><DialogTitle className="text-xl font-semibold tracking-[-0.025em]">Adicionar usuário</DialogTitle><DialogDescription>Prepare o acesso ao workspace da Somus. Quando a pessoa entrar com este e-mail, ela verá os mesmos dados da equipe.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="space-y-4"><Field label="Nome completo"><Input name="name" required className="h-11 rounded-2xl" placeholder="Ex.: Ana Martins" /></Field><Field label="E-mail de acesso"><Input name="email" required type="email" className="h-11 rounded-2xl" placeholder="ana@empresa.com.br" /></Field><Field label="Função"><AppSelect name="role" defaultValue="Administrador" ariaLabel="Função do usuário" options={['Administrador', 'Comercial', 'Editor', 'Visualizador'].map((value) => ({ value, label: value }))} /></Field><div className="rounded-2xl bg-[#EEF0FF] p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 text-[#5164C9]" /><p className="text-[10px] leading-4 text-[#56608B]"><strong className="block text-[11px] text-[#344174]">Acesso seguro</strong>O usuário será reconhecido pelo e-mail usado no login com ChatGPT.</p></div></div>{error && <p className="text-[10px] font-medium text-[#C03F32]">{error}</p>}<DialogFooter className="-mx-5 -mb-5 rounded-b-[26px] sm:-mx-6 sm:-mb-6"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" className="bg-[#172A25] px-5 text-white">Adicionar à equipe</Button></DialogFooter></form></DialogContent></Dialog>;
}
function OpportunityDialog({ open, onOpenChange, opportunity, defaultStage, saving, error, onSave, onDelete }: { open: boolean; onOpenChange: (open: boolean) => void; opportunity: Opportunity | null; defaultStage: Stage; saving: boolean; error: string; onSave: (input: OpportunityInput) => Promise<boolean>; onDelete: (id: number) => Promise<boolean> }) {
  const [form, setForm] = useState<OpportunityInput>({ client: '', project: '', value: 0, stage: 'Novo contato', due: 'Hoje', source: 'Indicação', tags: [], customFields: {} });
  const [tagsText, setTagsText] = useState('');
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const next = opportunity ? { client: opportunity.client, project: opportunity.project, value: opportunity.value, stage: opportunity.stage, due: opportunity.due, source: opportunity.source, tags: opportunity.tags, customFields: opportunity.customFields } : { client: '', project: '', value: 0, stage: defaultStage, due: 'Hoje', source: 'Indicação', tags: [], customFields: {} };
    setForm(next); setTagsText(next.tags.join(', ')); setFields(Object.entries(next.customFields).map(([key, value]) => ({ key, value })));
  }, [defaultStage, open, opportunity]);

  function update<K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateField(index: number, key: 'key' | 'value', value: string) { setFields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tags = tagsText.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean);
    const customFields = Object.fromEntries(fields.map((field) => [field.key.trim(), field.value.trim()]).filter(([key, value]) => key && value));
    await onSave({ ...form, tags, customFields });
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-none max-w-2xl flex-col gap-0 overflow-hidden rounded-[26px] p-0 sm:h-[min(90dvh,860px)]">
      <DialogHeader className="shrink-0 border-b border-black/[0.06] px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pb-5 sm:pt-6">
        <span className="mb-2 grid size-11 place-items-center rounded-2xl bg-[#172A25] text-white">{opportunity ? <Pencil /> : <Plus />}</span>
        <DialogTitle className="text-xl font-semibold tracking-[-0.025em]">{opportunity ? 'Editar oportunidade' : 'Nova oportunidade'}</DialogTitle>
        <DialogDescription>Organize os dados comerciais, a etapa, as tags e os campos específicos deste negócio.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 overscroll-contain sm:px-6">
          <div className="grid gap-4 md:grid-cols-2"><Field label="Cliente"><Input required value={form.client} onChange={(event) => update('client', event.target.value)} className="h-11 rounded-xl" placeholder="Nome do cliente" /></Field><Field label="Oportunidade ou projeto"><Input required value={form.project} onChange={(event) => update('project', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Implantação comercial" /></Field></div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Valor estimado"><Input required min="0" type="number" value={form.value || ''} onChange={(event) => update('value', Number(event.target.value))} className="h-11 rounded-xl" /></Field><Field label="Etapa"><AppSelect value={form.stage} onValueChange={(value) => update('stage', value as Stage)} ariaLabel="Etapa da oportunidade" options={(['Novo contato', 'Diagnóstico', 'Proposta enviada', 'Negociação'] as Stage[]).map((value) => ({ value, label: value }))} /></Field></div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Próxima ação"><Input value={form.due} onChange={(event) => update('due', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Retornar sexta, 14h" /></Field><Field label="Origem"><Input value={form.source} onChange={(event) => update('source', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Indicação, site, evento" /></Field></div>
          <Field label="Tags"><div className="relative"><Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="h-11 rounded-xl pl-9" placeholder="Prioridade, alto valor, follow-up" /></div></Field>

          <section className="rounded-[20px] border border-black/[0.06] bg-[#F7F7F9] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-xs">Campos personalizados</strong><p className="mt-1 text-[9px] text-[#8E8E93]">Adicione qualquer informação importante para sua operação.</p></div><Button type="button" variant="outline" size="sm" className="self-start rounded-xl bg-white" onClick={() => setFields((items) => [...items, { key: '', value: '' }])}><Plus /> Adicionar campo</Button></div>
            <div className="mt-4 space-y-2">{fields.map((field, index) => <div key={index} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1.35fr_auto]"><Input aria-label={`Nome do campo ${index + 1}`} value={field.key} onChange={(event) => updateField(index, 'key', event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Ex.: Responsável" /><Input aria-label={`Valor do campo ${index + 1}`} value={field.value} onChange={(event) => updateField(index, 'value', event.target.value)} className="col-start-1 h-10 rounded-xl bg-white sm:col-start-2 sm:row-start-1" placeholder="Ex.: Ana" /><Button type="button" aria-label={`Remover campo ${index + 1}`} variant="ghost" size="icon" className="col-start-2 row-span-2 row-start-1 rounded-xl text-[#8E8E93] sm:col-start-3 sm:row-span-1" onClick={() => setFields((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}{fields.length === 0 && <p className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-5 text-center text-[10px] text-[#AEAEB2]">Nenhum campo personalizado adicionado.</p>}</div>
          </section>
          {error && <p className="rounded-xl bg-[#FFF0EE] px-4 py-3 text-[10px] font-medium text-[#B54336]">{error}</p>}
        </div>
        <DialogFooter className="m-0 shrink-0 rounded-none rounded-b-[24px] border-t border-black/[0.06] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.04)] sm:flex-col-reverse sm:px-6 md:flex-row md:items-center md:justify-between">
          {opportunity && <Button type="button" variant="ghost" disabled={deleting} className="w-full justify-center text-[#B54336] hover:bg-[#FFF0EE] hover:text-[#9D3127] md:w-auto" onClick={async () => { if (!window.confirm(`Excluir a oportunidade “${opportunity.project}”? Esta ação não poderá ser desfeita.`)) return; setDeleting(true); await onDelete(opportunity.id); setDeleting(false); }}>{deleting ? 'Excluindo...' : <><Trash2 />Excluir oportunidade</>}</Button>}
          <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto">
            <Button type="button" variant="ghost" className="w-full md:w-auto" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={saving || deleting} type="submit" className="w-full whitespace-nowrap bg-black px-5 text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] md:w-auto">{saving ? 'Salvando...' : opportunity ? 'Salvar alterações' : 'Criar oportunidade'}</Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function TaskDialog({ open, onOpenChange, task, defaultStatus, saving, error, members, userName, onSave, onDelete }: { open: boolean; onOpenChange: (open: boolean) => void; task: ActionTask | null; defaultStatus: TaskStatus; saving: boolean; error: string; members: Member[]; userName: string; onSave: (input: TaskInput) => Promise<boolean>; onDelete: (id: number) => Promise<boolean> }) {
  const [form, setForm] = useState<TaskInput>({ title: '', description: '', status: defaultStatus, priority: 'Média', dueDate: localDateKey(), assignee: userName, project: '', position: Date.now() });
  const [deleting, setDeleting] = useState(false);
  const assignees = Array.from(new Set([userName, ...members.map((member) => member.name)].filter(Boolean)));

  useEffect(() => {
    setForm(task ? { title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate, assignee: task.assignee, project: task.project, position: task.position } : { title: '', description: '', status: defaultStatus, priority: 'Média', dueDate: localDateKey(), assignee: userName, project: '', position: Date.now() });
    setDeleting(false);
  }, [defaultStatus, open, task, userName]);

  function update<K extends keyof TaskInput>(key: K, value: TaskInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await onSave(form); }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-none max-w-xl flex-col gap-0 overflow-hidden rounded-[26px] p-0 sm:h-auto sm:max-h-[min(90dvh,760px)]">
      <DialogHeader className="shrink-0 border-b border-black/[0.06] px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pb-5 sm:pt-6">
        <span className="mb-2 grid size-11 place-items-center rounded-2xl bg-[#172A25] text-white">{task ? <Pencil /> : <ListTodo />}</span>
        <DialogTitle className="text-xl font-semibold tracking-[-0.025em]">{task ? 'Editar ação' : 'Nova ação'}</DialogTitle>
        <DialogDescription>Defina o próximo passo, o prazo e quem será responsável por fazer acontecer.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 overscroll-contain sm:px-6">
          <Field label="O que precisa ser feito?"><Input autoFocus required value={form.title} onChange={(event) => update('title', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Enviar revisão da proposta" /></Field>
          <Field label="Detalhes"><textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="min-h-24 w-full resize-y rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder="Contexto, orientação ou resultado esperado." /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Status"><AppSelect value={form.status} onValueChange={(value) => update('status', value as TaskStatus)} ariaLabel="Status da ação" options={(['Entrada', 'Em andamento', 'Aguardando', 'Concluída'] as TaskStatus[]).map((value) => ({ value, label: value }))} /></Field><Field label="Prioridade"><AppSelect value={form.priority} onValueChange={(value) => update('priority', value as TaskPriority)} ariaLabel="Prioridade da ação" options={(['Alta', 'Média', 'Baixa'] as TaskPriority[]).map((value) => ({ value, label: value }))} /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Prazo"><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} className="h-11 rounded-xl pl-9" /></div></Field><Field label="Responsável"><AppSelect value={form.assignee || '__none'} onValueChange={(value) => update('assignee', value === '__none' ? '' : value)} ariaLabel="Responsável pela ação" options={[{ value: '__none', label: 'Sem responsável' }, ...assignees.map((value) => ({ value, label: value }))]} /></Field></div>
          <Field label="Cliente, projeto ou frente"><Input value={form.project} onChange={(event) => update('project', event.target.value)} className="h-11 rounded-xl" placeholder="Ex.: Casa Serra ou Marketing" /></Field>
          {error && <p className="rounded-xl bg-[#FFF0EE] px-4 py-3 text-[10px] font-medium text-[#B54336]">{error}</p>}
        </div>
        <DialogFooter className="m-0 shrink-0 rounded-none rounded-b-[24px] border-t border-black/[0.06] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.04)] sm:flex-col-reverse sm:px-6 md:flex-row md:items-center md:justify-between">
          {task && <Button type="button" variant="ghost" disabled={deleting} className="w-full justify-center text-[#B54336] hover:bg-[#FFF0EE] hover:text-[#9D3127] md:w-auto" onClick={async () => { if (!window.confirm(`Excluir a ação “${task.title}”?`)) return; setDeleting(true); await onDelete(task.id); setDeleting(false); }}>{deleting ? 'Excluindo...' : <><Trash2 />Excluir ação</>}</Button>}
          <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto"><Button type="button" variant="ghost" className="w-full md:w-auto" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving || deleting} type="submit" className="w-full whitespace-nowrap bg-black px-5 text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] md:w-auto">{saving ? 'Salvando...' : task ? 'Salvar alterações' : 'Adicionar ação'}</Button></div>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function ClientDialog({ open, onOpenChange, client, saving, error, onSave, onDelete }: { open: boolean; onOpenChange: (open: boolean) => void; client: Client | null; saving: boolean; error: string; onSave: (input: ClientInput) => Promise<boolean>; onDelete: (id: number) => Promise<boolean> }) {
  const empty: ClientInput = { name: '', company: '', email: '', phone: '', document: '', status: 'Ativo', contractValue: 0, tags: [], notes: '', customFields: {} };
  const [form, setForm] = useState<ClientInput>(empty);
  const [tagsText, setTagsText] = useState('');
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const next = client ? { name: client.name, company: client.company, email: client.email, phone: client.phone, document: client.document, status: client.status, contractValue: client.contractValue, tags: client.tags, notes: client.notes, customFields: client.customFields } : empty;
    setForm(next); setTagsText(next.tags.join(', ')); setFields(Object.entries(next.customFields).map(([key, value]) => ({ key, value }))); setDeleting(false);
  }, [client, open]);

  function update<K extends keyof ClientInput>(key: K, value: ClientInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updateField(index: number, key: 'key' | 'value', value: string) { setFields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tags = tagsText.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean);
    const customFields = Object.fromEntries(fields.map((field) => [field.key.trim(), field.value.trim()]).filter(([key, value]) => key && value));
    await onSave({ ...form, tags, customFields });
  }

  async function remove() {
    if (!client || !window.confirm(`Excluir o cadastro de “${client.name}”? As oportunidades existentes permanecerão no CRM.`)) return;
    setDeleting(true); await onDelete(client.id); setDeleting(false);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-none max-w-2xl flex-col gap-0 overflow-hidden rounded-[26px] p-0 sm:h-[min(90dvh,860px)]">
      <DialogHeader className="shrink-0 border-b border-black/[0.06] px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pb-5 sm:pt-6">
        <span className="mb-2 grid size-11 place-items-center rounded-2xl bg-[#172A25] text-white">{client ? <Pencil /> : <UserPlus />}</span>
        <DialogTitle className="text-xl font-semibold tracking-[-0.025em]">{client ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        <DialogDescription>Todos os dados podem ser alterados a qualquer momento, incluindo contrato, contatos, tags e campos próprios.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 overscroll-contain sm:px-6">
          <div className="grid gap-4 md:grid-cols-2"><Field label="Nome do cliente"><Input required value={form.name} onChange={(event) => update('name', event.target.value)} className="h-11 rounded-xl" placeholder="Nome completo ou contato principal" /></Field><Field label="Empresa"><div className="relative"><Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input value={form.company} onChange={(event) => update('company', event.target.value)} className="h-11 rounded-xl pl-9" placeholder="Razão social ou nome fantasia" /></div></Field></div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="E-mail"><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="h-11 rounded-xl pl-9" placeholder="cliente@empresa.com.br" /></div></Field><Field label="Telefone"><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="h-11 rounded-xl pl-9" placeholder="(31) 99999-9999" /></div></Field></div>
          <div className="grid gap-4 md:grid-cols-3"><Field label="CPF ou CNPJ"><Input value={form.document} onChange={(event) => update('document', event.target.value)} className="h-11 rounded-xl" placeholder="Documento" /></Field><Field label="Status"><AppSelect value={form.status} onValueChange={(value) => update('status', value as Client['status'])} ariaLabel="Status do cliente" options={(['Lead', 'Ativo', 'Inativo', 'Arquivado'] as Client['status'][]).map((value) => ({ value, label: value }))} /></Field><Field label="Valor do contrato"><div className="relative"><WalletCards className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input required min="0" step="0.01" type="number" value={form.contractValue || ''} onChange={(event) => update('contractValue', Number(event.target.value))} className="h-11 rounded-xl pl-9" placeholder="0,00" /></div></Field></div>
          <Field label="Tags"><div className="relative"><Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8E8E93]" /><Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="h-11 rounded-xl pl-9" placeholder="VIP, recorrente, parceiro" /></div></Field>
          <Field label="Observações"><textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className="min-h-24 w-full resize-y rounded-xl border border-input bg-white p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-black/10" placeholder="Preferências, histórico, próximos passos ou qualquer informação relevante." /></Field>
          <section className="rounded-[20px] border border-black/[0.06] bg-[#F7F7F9] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-xs">Campos personalizados</strong><p className="mt-1 text-[9px] text-[#8E8E93]">Crie informações específicas para a sua operação.</p></div><Button type="button" variant="outline" size="sm" className="self-start rounded-xl bg-white" onClick={() => setFields((items) => [...items, { key: '', value: '' }])}><Plus /> Adicionar campo</Button></div><div className="mt-4 space-y-2">{fields.map((field, index) => <div key={index} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1.35fr_auto]"><Input aria-label={`Nome do campo ${index + 1}`} value={field.key} onChange={(event) => updateField(index, 'key', event.target.value)} className="h-10 rounded-xl bg-white" placeholder="Ex.: Responsável" /><Input aria-label={`Valor do campo ${index + 1}`} value={field.value} onChange={(event) => updateField(index, 'value', event.target.value)} className="col-start-1 h-10 rounded-xl bg-white sm:col-start-2 sm:row-start-1" placeholder="Ex.: Ana" /><Button type="button" aria-label={`Remover campo ${index + 1}`} variant="ghost" size="icon" className="col-start-2 row-span-2 row-start-1 rounded-xl text-[#8E8E93] sm:col-start-3 sm:row-span-1" onClick={() => setFields((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}{fields.length === 0 && <p className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-5 text-center text-[10px] text-[#AEAEB2]">Nenhum campo personalizado adicionado.</p>}</div></section>
          {error && <p className="rounded-xl bg-[#FFF0EE] px-4 py-3 text-[10px] font-medium text-[#B54336]">{error}</p>}
        </div>
        <DialogFooter className="m-0 shrink-0 rounded-none rounded-b-[24px] border-t border-black/[0.06] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.04)] sm:flex-col-reverse sm:px-6 md:flex-row md:items-center md:justify-between">
          {client && <Button type="button" variant="ghost" disabled={deleting} className="w-full justify-center text-[#B54336] hover:bg-[#FFF0EE] hover:text-[#9D3127] md:w-auto" onClick={() => void remove()}>{deleting ? 'Excluindo...' : <><Trash2 />Excluir cliente</>}</Button>}
          <div className="grid w-full grid-cols-2 gap-2 md:ml-auto md:flex md:w-auto">
            <Button type="button" variant="ghost" className="w-full md:w-auto" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={saving || deleting} type="submit" className="w-full whitespace-nowrap bg-black px-5 text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] md:w-auto">{saving ? 'Salvando...' : client ? 'Salvar alterações' : 'Adicionar cliente'}</Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
function ProposalDialog({ open, onOpenChange, onSubmit, opportunities }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; opportunities: Opportunity[] }) {
  const opportunityOptions = opportunities.map((item) => ({ value: String(item.id), label: `${item.client} · ${item.project}` }));
  const templateOptions = proposalTemplates.map((template) => ({ value: template.value, label: template.name }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg rounded-[26px] p-5 sm:p-6"><DialogHeader><span className="mb-2 grid size-11 place-items-center rounded-2xl bg-black text-white"><Sparkles /></span><DialogTitle className="text-xl font-semibold tracking-[-0.025em]">Criar nova proposta</DialogTitle><DialogDescription>Escolha o projeto. O Synky Sales monta uma proposta-site one page para você editar.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="space-y-4"><Field label="Cliente e projeto"><AppSelect name="opportunity" defaultValue={opportunityOptions[0]?.value} ariaLabel="Cliente e projeto" options={opportunityOptions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Template"><AppSelect name="template" defaultValue={templateOptions[0]?.value} ariaLabel="Template da proposta" options={templateOptions} /></Field><Field label="Validade"><Input name="validity" type="date" defaultValue="2026-09-30" className="h-11 rounded-2xl" /></Field></div><div className="rounded-2xl bg-[#f3f4fb] p-4"><div className="flex gap-3"><Sparkles className="mt-0.5 size-4 text-[#596fc6]" /><div><strong className="block text-xs">Texto inteligente ativado</strong><p className="mt-1 text-[10px] leading-4 text-[#6e6e73]">A one page será preenchida com uma narrativa comercial baseada no projeto.</p></div></div></div><DialogFooter className="-mx-5 -mb-5 rounded-b-[26px] sm:-mx-6 sm:-mb-6"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" className="bg-black px-5 text-white">Criar proposta-site</Button></DialogFooter></form></DialogContent></Dialog>;
}
function AppSelect({ value, defaultValue, name, onValueChange, options, ariaLabel, className = '', compact = false, dark = false }: { value?: string; defaultValue?: string; name?: string; onValueChange?: (value: string) => void; options: Array<{ value: string; label: string }>; ariaLabel: string; className?: string; compact?: boolean; dark?: boolean }) {
  return <Select<string> name={name} value={value} defaultValue={defaultValue} items={options} onValueChange={(next) => { if (next !== null) onValueChange?.(next); }}>
    <SelectTrigger aria-label={ariaLabel} className={`${compact ? 'h-8 rounded-xl px-2.5 text-[9px]' : 'h-11 rounded-2xl px-3.5 text-[12px]'} w-full border-black/[0.08] ${dark ? 'border-white/15 bg-black/70 text-white shadow-lg backdrop-blur hover:bg-black/80 [&_svg]:text-white/60' : 'bg-[#F8F8FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:border-black/15 hover:bg-white'} ${className}`}><SelectValue /></SelectTrigger>
    <SelectContent align="start" sideOffset={6} className="rounded-2xl bg-white p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.18)] ring-black/[0.08]">
      {options.map((option) => <SelectItem key={option.value} value={option.value} className="min-h-10 rounded-xl px-3 text-[12px] focus:bg-[#EEF3F1] focus:text-[#183D31]">{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#5d5d62]">{label}</span>{children}</label>; }
