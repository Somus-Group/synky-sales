CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Entrada' NOT NULL,
	`priority` text DEFAULT 'Média' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`project` text DEFAULT '' NOT NULL,
	`completed_at` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_workspace_status_position` ON `tasks` (`workspace_id`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_tasks_workspace_due_date` ON `tasks` (`workspace_id`,`due_date`);