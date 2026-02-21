CREATE TABLE `franchise_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`location` varchar(200),
	`budget` varchar(100),
	`experience` text,
	`message` text,
	`status` enum('pending','contacted','meeting_scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `franchise_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `publishTargets` json DEFAULT ('["brand"]') NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `publishTarget`;