import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';
import { getWorkspaceForUser } from '@/db/workspace';

const emptyProfile = {
  businessName: '',
  legalName: '',
  segment: '',
  description: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  instagram: '',
  primaryColor: '#172A25',
  secondaryColor: '#B86538',
  services: [] as string[],
  audience: '',
  tone: 'Consultivo, claro e confiante',
  differentiators: '',
  proposalStructure: 'Capa, contexto, solução, escopo, investimento e próximos passos',
  instructions: '',
  status: 'draft',
};

type StoredProfile = Omit<typeof emptyProfile, 'services'> & { servicesJson: string; updatedAt: number };

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const profile = await getD1().prepare(`SELECT business_name AS businessName, legal_name AS legalName, segment, description, website, email, phone, address, instagram, primary_color AS primaryColor, secondary_color AS secondaryColor, services_json AS servicesJson, audience, tone, differentiators, proposal_structure AS proposalStructure, instructions, status, updated_at AS updatedAt FROM agent_profiles WHERE workspace_id = ? LIMIT 1`).bind(workspaceId).first<StoredProfile>();
    if (!profile) return Response.json({ profile: emptyProfile });
    const { servicesJson, ...rest } = profile;
    return Response.json({ profile: { ...rest, services: JSON.parse(servicesJson || '[]') } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar a configuração.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: 'Autenticação necessária.' }, { status: 401 });
    const workspaceId = await getWorkspaceForUser(user);
    const payload = await request.json() as typeof emptyProfile;
    const services = Array.isArray(payload.services) ? payload.services.map((item) => String(item).trim()).filter(Boolean).slice(0, 30) : [];
    if (!payload.businessName?.trim() || !payload.segment?.trim() || !payload.audience?.trim() || services.length === 0) return Response.json({ error: 'Preencha empresa, segmento, público e pelo menos um serviço.' }, { status: 400 });
    const colorPattern = /^#[0-9a-f]{6}$/i;
    const profile = {
      businessName: payload.businessName.trim(),
      legalName: payload.legalName?.trim() || '',
      segment: payload.segment.trim(),
      description: payload.description?.trim() || '',
      website: payload.website?.trim() || '',
      email: payload.email?.trim() || '',
      phone: payload.phone?.trim() || '',
      address: payload.address?.trim() || '',
      instagram: payload.instagram?.trim() || '',
      primaryColor: colorPattern.test(payload.primaryColor || '') ? payload.primaryColor : emptyProfile.primaryColor,
      secondaryColor: colorPattern.test(payload.secondaryColor || '') ? payload.secondaryColor : emptyProfile.secondaryColor,
      services,
      audience: payload.audience.trim(),
      tone: payload.tone?.trim() || emptyProfile.tone,
      differentiators: payload.differentiators?.trim() || '',
      proposalStructure: payload.proposalStructure?.trim() || emptyProfile.proposalStructure,
      instructions: payload.instructions?.trim() || '',
      status: 'configured',
      updatedAt: Date.now(),
    };
    await getD1().prepare(`INSERT INTO agent_profiles (workspace_id, business_name, legal_name, segment, description, website, email, phone, address, instagram, primary_color, secondary_color, services_json, audience, tone, differentiators, proposal_structure, instructions, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(workspace_id) DO UPDATE SET business_name = excluded.business_name, legal_name = excluded.legal_name, segment = excluded.segment, description = excluded.description, website = excluded.website, email = excluded.email, phone = excluded.phone, address = excluded.address, instagram = excluded.instagram, primary_color = excluded.primary_color, secondary_color = excluded.secondary_color, services_json = excluded.services_json, audience = excluded.audience, tone = excluded.tone, differentiators = excluded.differentiators, proposal_structure = excluded.proposal_structure, instructions = excluded.instructions, status = excluded.status, updated_at = excluded.updated_at`)
      .bind(workspaceId, profile.businessName, profile.legalName, profile.segment, profile.description, profile.website, profile.email, profile.phone, profile.address, profile.instagram, profile.primaryColor, profile.secondaryColor, JSON.stringify(services), profile.audience, profile.tone, profile.differentiators, profile.proposalStructure, profile.instructions, profile.status, profile.updatedAt).run();
    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao salvar a configuração.' }, { status: 500 });
  }
}
