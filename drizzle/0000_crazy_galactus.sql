CREATE TABLE `opportunities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`client_name` text NOT NULL,
	`project_name` text NOT NULL,
	`value_cents` integer NOT NULL,
	`stage` text NOT NULL,
	`next_action` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_opportunities_workspace_stage` ON `opportunities` (`workspace_id`,`stage`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`code` text NOT NULL,
	`client_name` text NOT NULL,
	`project_name` text NOT NULL,
	`value_cents` integer NOT NULL,
	`status` text NOT NULL,
	`validity` text NOT NULL,
	`template` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_proposals_workspace_status` ON `proposals` (`workspace_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_proposals_workspace_code` ON `proposals` (`workspace_id`,`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_proposals_slug` ON `proposals` (`slug`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_workspaces_owner_user_id` ON `workspaces` (`owner_user_id`);