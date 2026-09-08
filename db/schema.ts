import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    ownerUserId: text('owner_user_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [uniqueIndex('idx_workspaces_owner_user_id').on(table.ownerUserId)],
);

export const opportunities = sqliteTable(
  'opportunities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    clientName: text('client_name').notNull(),
    projectName: text('project_name').notNull(),
    valueCents: integer('value_cents').notNull(),
    stage: text('stage').notNull(),
    nextAction: text('next_action').notNull(),
    source: text('source').notNull().default('Não informado'),
    tagsJson: text('tags_json').notNull().default('[]'),
    customFieldsJson: text('custom_fields_json').notNull().default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at').notNull().default(0),
  },
  (table) => [index('idx_opportunities_workspace_stage').on(table.workspaceId, table.stage)],
);

export const clients = sqliteTable(
  'clients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    name: text('name').notNull(),
    company: text('company').notNull().default(''),
    email: text('email').notNull().default(''),
    phone: text('phone').notNull().default(''),
    document: text('document').notNull().default(''),
    status: text('status').notNull().default('Ativo'),
    contractValueCents: integer('contract_value_cents').notNull().default(0),
    tagsJson: text('tags_json').notNull().default('[]'),
    notes: text('notes').notNull().default(''),
    customFieldsJson: text('custom_fields_json').notNull().default('{}'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('idx_clients_workspace_status').on(table.workspaceId, table.status)],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('Entrada'),
    priority: text('priority').notNull().default('Média'),
    dueDate: text('due_date').notNull().default(''),
    assignee: text('assignee').notNull().default(''),
    project: text('project').notNull().default(''),
    completedAt: integer('completed_at'),
    position: integer('position').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('idx_tasks_workspace_status_position').on(table.workspaceId, table.status, table.position),
    index('idx_tasks_workspace_due_date').on(table.workspaceId, table.dueDate),
  ],
);

export const proposals = sqliteTable(
  'proposals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    code: text('code').notNull(),
    clientName: text('client_name').notNull(),
    projectName: text('project_name').notNull(),
    valueCents: integer('value_cents').notNull(),
    status: text('status').notNull(),
    validity: text('validity').notNull(),
    template: text('template').notNull(),
    slug: text('slug').notNull(),
    briefJson: text('brief_json').notNull().default('{}'),
    contentJson: text('content_json').notNull().default('{}'),
    agentStatus: text('agent_status').notNull().default('ready'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_proposals_workspace_status').on(table.workspaceId, table.status),
    uniqueIndex('idx_proposals_workspace_code').on(table.workspaceId, table.code),
    uniqueIndex('idx_proposals_slug').on(table.slug),
  ],
);

export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    userId: text('user_id'),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull(),
    invitedByUserId: text('invited_by_user_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_workspace_members_workspace_email').on(table.workspaceId, table.email),
    index('idx_workspace_members_email').on(table.email),
  ],
);

export const agentProfiles = sqliteTable('agent_profiles', {
  workspaceId: text('workspace_id').primaryKey().references(() => workspaces.id),
  businessName: text('business_name').notNull(),
  legalName: text('legal_name').notNull().default(''),
  segment: text('segment').notNull(),
  description: text('description').notNull().default(''),
  website: text('website').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  address: text('address').notNull().default(''),
  instagram: text('instagram').notNull().default(''),
  primaryColor: text('primary_color').notNull().default('#172A25'),
  secondaryColor: text('secondary_color').notNull().default('#B86538'),
  servicesJson: text('services_json').notNull(),
  audience: text('audience').notNull(),
  tone: text('tone').notNull(),
  differentiators: text('differentiators').notNull(),
  proposalStructure: text('proposal_structure').notNull(),
  instructions: text('instructions').notNull(),
  status: text('status').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const brandAssets = sqliteTable(
  'brand_assets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    publicToken: text('public_token').notNull(),
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    caption: text('caption').notNull().default(''),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_brand_assets_workspace_kind').on(table.workspaceId, table.kind),
    uniqueIndex('idx_brand_assets_public_token').on(table.publicToken),
  ],
);

export const proposalReferences = sqliteTable(
  'proposal_references',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
    name: text('name').notNull(),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    status: text('status').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_proposal_references_workspace').on(table.workspaceId)],
);
