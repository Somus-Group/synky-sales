CREATE TABLE `agent_profiles` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`segment` text NOT NULL,
	`services_json` text NOT NULL,
	`audience` text NOT NULL,
	`tone` text NOT NULL,
	`differentiators` text NOT NULL,
	`proposal_structure` text NOT NULL,
	`instructions` text NOT NULL,
	`status` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposal_references` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_proposal_references_workspace` ON `proposal_references` (`workspace_id`);