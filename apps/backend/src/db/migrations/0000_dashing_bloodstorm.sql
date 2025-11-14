CREATE TABLE `config` (
	`id` text NOT NULL,
	`code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `config_code_unique` ON `config` (`code`);--> statement-breakpoint
CREATE TABLE `config_values` (
	`config_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`config_id`, `key`),
	FOREIGN KEY (`config_id`) REFERENCES `config`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `presentation_styles` (
	`id` text,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `style_targets` (
	`id` text,
	`style_id` text NOT NULL,
	`target` text NOT NULL,
	`classes` text NOT NULL,
	FOREIGN KEY (`style_id`) REFERENCES `presentation_styles`(`id`) ON UPDATE no action ON DELETE no action
);
