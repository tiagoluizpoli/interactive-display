CREATE TABLE `config_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `config_sets_name_unique` ON `config_sets` (`name`);--> statement-breakpoint
CREATE TABLE `config_values` (
	`config_set_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`config_set_id`, `key`),
	FOREIGN KEY (`config_set_id`) REFERENCES `config_sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `presentation_styles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `style_properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`style_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`style_id`) REFERENCES `presentation_styles`(`id`) ON UPDATE no action ON DELETE no action
);
