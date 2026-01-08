CREATE TABLE `active_styles` (
	`code` text NOT NULL,
	`style_id` text NOT NULL,
	FOREIGN KEY (`style_id`) REFERENCES `styles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `active_styles_code_unique` ON `active_styles` (`code`);