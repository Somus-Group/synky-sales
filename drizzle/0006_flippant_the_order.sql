CREATE TABLE `brand_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`public_token` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_brand_assets_workspace_kind` ON `brand_assets` (`workspace_id`,`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_brand_assets_public_token` ON `brand_assets` (`public_token`);--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `legal_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `website` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `instagram` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `primary_color` text DEFAULT '#172A25' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_profiles` ADD `secondary_color` text DEFAULT '#B86538' NOT NULL;