ALTER TABLE `opportunities` ADD `source` text DEFAULT 'Não informado' NOT NULL;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `tags_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `custom_fields_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `updated_at` integer DEFAULT 0 NOT NULL;