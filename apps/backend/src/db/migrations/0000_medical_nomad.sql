CREATE TABLE `config` (
	`id` text PRIMARY KEY NOT NULL,
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
CREATE TABLE `style_available_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`target` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `style_targets_type_target_unique` ON `style_available_targets` (`type`,`target`);--> statement-breakpoint
CREATE TABLE `style_targets_classes` (
	`style_target_id` text NOT NULL,
	`style_id` text NOT NULL,
	`classes` text NOT NULL,
	PRIMARY KEY(`style_target_id`, `style_id`),
	FOREIGN KEY (`style_target_id`) REFERENCES `style_available_targets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`style_id`) REFERENCES `styles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `styles` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `presentation_styles_name_type_unique` ON `styles` (`type`,`name`);