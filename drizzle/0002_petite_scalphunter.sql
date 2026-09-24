CREATE TABLE `recipe_components` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`component_id` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`component_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `recipes` ADD `kind` text DEFAULT 'meal' NOT NULL;