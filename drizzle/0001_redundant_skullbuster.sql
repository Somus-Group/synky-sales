ALTER TABLE `proposals` ADD `brief_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `content_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `agent_status` text DEFAULT 'ready' NOT NULL;