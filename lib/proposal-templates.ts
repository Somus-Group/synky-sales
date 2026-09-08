export type ProposalTemplateTheme = 'editorial' | 'noir' | 'prisma';
export type ProposalNiche = 'Consultoria' | 'Arquitetura' | 'Marketing' | 'Design';

export type ProposalTemplateDefinition = {
  id: string;
  value: string;
  name: string;
  niche: ProposalNiche;
  description: string;
  theme: ProposalTemplateTheme;
  swatches: [string, string, string];
  focus: string;
  structure: string;
};

export const proposalNiches: ProposalNiche[] = ['Consultoria', 'Arquitetura', 'Marketing', 'Design'];

export const proposalTemplates: ProposalTemplateDefinition[] = [
  { id: 'strategy-board', value: 'Consultoria · Strategy Board', name: 'Strategy Board', niche: 'Consultoria', description: 'Diagnóstico executivo e tese estratégica.', theme: 'noir', swatches: ['#101113', '#D7FF38', '#F0EEE8'], focus: 'clareza executiva, diagnóstico e decisão', structure: 'tese central, cenário, diagnóstico, prioridades, plano estratégico, governança, cronograma, investimento e decisão' },
  { id: 'transformation-roadmap', value: 'Consultoria · Transformation Roadmap', name: 'Transformation Roadmap', niche: 'Consultoria', description: 'Mudança organizacional em etapas claras.', theme: 'prisma', swatches: ['#3434D8', '#FF6B4A', '#E9FF70'], focus: 'transformação, marcos e evolução mensurável', structure: 'ambição, estado atual, lacunas, visão futura, frentes de transformação, roadmap, indicadores, investimento e mobilização' },
  { id: 'executive-advisory', value: 'Consultoria · Executive Advisory', name: 'Executive Advisory', niche: 'Consultoria', description: 'Assessoria premium para alta liderança.', theme: 'editorial', swatches: ['#2F241E', '#B86538', '#E9DED0'], focus: 'confiança, senioridade e aconselhamento próximo', structure: 'contexto executivo, questão crítica, ponto de vista, agenda de trabalho, rituais, entregáveis, confidencialidade, investimento e início' },
  { id: 'performance-sprint', value: 'Consultoria · Performance Sprint', name: 'Performance Sprint', niche: 'Consultoria', description: 'Resultado rápido, objetivo e mensurável.', theme: 'noir', swatches: ['#111111', '#39E58C', '#F5F5F0'], focus: 'velocidade, performance e indicadores', structure: 'meta, gargalo, hipótese, sprint, plano de ação, responsáveis, métricas, investimento e kickoff' },
  { id: 'diagnostic-premium', value: 'Consultoria · Diagnostic Premium', name: 'Diagnostic Premium', niche: 'Consultoria', description: 'Leitura profunda antes da recomendação.', theme: 'editorial', swatches: ['#23332D', '#C8925A', '#F2EEE8'], focus: 'investigação, evidências e recomendação', structure: 'pergunta central, contexto, evidências, riscos, oportunidades, método diagnóstico, síntese executiva, investimento e próximos passos' },

  { id: 'atelier-editorial', value: 'Arquitetura · Atelier Editorial', name: 'Atelier Editorial', niche: 'Arquitetura', description: 'Conceito autoral com linguagem editorial.', theme: 'editorial', swatches: ['#2F241E', '#B86538', '#F7F1E8'], focus: 'conceito, atmosfera, materialidade e autoria', structure: 'capa, leitura do lugar, conceito, atmosfera, programa, materialidade, processo, investimento e convite' },
  { id: 'interiors-cinematic', value: 'Arquitetura · Interiors Cinematic', name: 'Interiors Cinematic', niche: 'Arquitetura', description: 'Interiores apresentados como experiência.', theme: 'editorial', swatches: ['#332D2B', '#9A745D', '#E8DED3'], focus: 'experiência, sensorialidade e narrativa espacial', structure: 'abertura emocional, rotina do cliente, intenção, narrativa espacial, ambientes, materiais, etapas, investimento e próximo encontro' },
  { id: 'real-estate-concept', value: 'Arquitetura · Real Estate Concept', name: 'Real Estate Concept', niche: 'Arquitetura', description: 'Conceito de valor para empreendimentos.', theme: 'noir', swatches: ['#0C0D0E', '#D6FF3F', '#EDEAE3'], focus: 'produto imobiliário, diferenciação e percepção de valor', structure: 'oportunidade, público, território, conceito do produto, experiência, diferenciais, escopo, investimento e decisão' },
  { id: 'residential-story', value: 'Arquitetura · Residential Story', name: 'Residential Story', niche: 'Arquitetura', description: 'Uma casa contada a partir de quem vive.', theme: 'prisma', swatches: ['#4951C7', '#E97858', '#E4F39B'], focus: 'vida cotidiana, identidade e pertencimento', structure: 'história dos moradores, desejos, leitura do espaço, conceito, ambientes, escolhas, jornada de projeto, investimento e começo' },
  { id: 'corporate-spaces', value: 'Arquitetura · Corporate Spaces', name: 'Corporate Spaces', niche: 'Arquitetura', description: 'Espaços de trabalho ligados à estratégia.', theme: 'noir', swatches: ['#14201D', '#7DE2B8', '#F1F0EB'], focus: 'cultura, produtividade e experiência de marca', structure: 'negócio, cultura, desafios do espaço, princípios, programa, experiência, implantação, investimento e alinhamento' },

  { id: 'growth-campaign', value: 'Marketing · Growth Campaign', name: 'Growth Campaign', niche: 'Marketing', description: 'Campanha orientada a aquisição e escala.', theme: 'prisma', swatches: ['#3434D8', '#FF5D45', '#E9FF70'], focus: 'crescimento, canais, testes e conversão', structure: 'oportunidade, audiência, objetivo, grande ideia, estratégia de canais, plano de campanha, métricas, investimento e lançamento' },
  { id: 'positioning-launch', value: 'Marketing · Positioning Launch', name: 'Positioning Launch', niche: 'Marketing', description: 'Posicionamento e lançamento de alto impacto.', theme: 'noir', swatches: ['#111113', '#D7FF38', '#F0EEE8'], focus: 'posicionamento, mensagem e entrada no mercado', structure: 'tensão de mercado, público, posicionamento, promessa, narrativa, lançamento, plano de ativação, investimento e movimento' },
  { id: 'content-engine', value: 'Marketing · Content Engine', name: 'Content Engine', niche: 'Marketing', description: 'Conteúdo recorrente com método e consistência.', theme: 'editorial', swatches: ['#3A2A25', '#C86D47', '#F5EEE5'], focus: 'autoridade, recorrência e sistema editorial', structure: 'território, audiência, pilares, formatos, calendário, produção, distribuição, investimento e início editorial' },
  { id: 'performance-media', value: 'Marketing · Performance Media', name: 'Performance Media', niche: 'Marketing', description: 'Mídia paga com foco em resultado.', theme: 'noir', swatches: ['#101010', '#63F29A', '#ECEDEA'], focus: 'mídia, funil, conversão e otimização', structure: 'meta comercial, diagnóstico do funil, audiência, estratégia de mídia, campanhas, otimização, indicadores, investimento e ativação' },
  { id: 'brand-experience', value: 'Marketing · Brand Experience', name: 'Brand Experience', niche: 'Marketing', description: 'Experiências que transformam marca em presença.', theme: 'prisma', swatches: ['#5837C7', '#FF795A', '#F1F56B'], focus: 'experiência de marca, engajamento e memória', structure: 'contexto cultural, público, ideia central, jornada, pontos de contato, ativações, produção, investimento e convite' },

  { id: 'branding-manifesto', value: 'Design · Branding Manifesto', name: 'Branding Manifesto', niche: 'Design', description: 'Marca construída por ideia e significado.', theme: 'editorial', swatches: ['#302620', '#B86538', '#F0E7DB'], focus: 'essência, posicionamento e expressão de marca', structure: 'manifesto, contexto, essência, posicionamento, conceito criativo, sistema visual, aplicações, investimento e nova fase' },
  { id: 'identity-system', value: 'Design · Identity System', name: 'Identity System', niche: 'Design', description: 'Identidade visual completa e consistente.', theme: 'noir', swatches: ['#0D0D0E', '#D7FF38', '#F2F0E9'], focus: 'sistema visual, consistência e aplicações', structure: 'desafio, estratégia de marca, conceito, logotipo, cores e tipografia, universo visual, entregáveis, investimento e implantação' },
  { id: 'product-design', value: 'Design · Product Design', name: 'Product Design', niche: 'Design', description: 'Produto digital centrado na experiência.', theme: 'prisma', swatches: ['#3434D8', '#FF5D45', '#E9FF70'], focus: 'produto, usuário, jornada e valor de negócio', structure: 'oportunidade, usuários, problema, visão do produto, jornada, solução, processo e entregáveis, investimento e discovery' },
  { id: 'ux-case', value: 'Design · UX Case', name: 'UX Case', niche: 'Design', description: 'UX estratégico com lógica de case study.', theme: 'noir', swatches: ['#151719', '#58D7FF', '#F0F2F3'], focus: 'pesquisa, experiência e validação', structure: 'contexto, problema do usuário, evidências, princípios, arquitetura da experiência, prototipação, testes, investimento e início' },
  { id: 'creative-retainer', value: 'Design · Creative Retainer', name: 'Creative Retainer', niche: 'Design', description: 'Parceria criativa contínua e flexível.', theme: 'editorial', swatches: ['#24342F', '#D49A62', '#F4EFE7'], focus: 'parceria, cadência e capacidade criativa', structure: 'contexto, demanda recorrente, modelo de parceria, frentes criativas, fluxo, capacidade, governança, investimento e onboarding' },
];

export function getProposalTemplate(value?: string) {
  const normalized = (value || '').toLowerCase();
  return proposalTemplates.find((template) => template.id === normalized || template.value.toLowerCase() === normalized) || proposalTemplates[5];
}
