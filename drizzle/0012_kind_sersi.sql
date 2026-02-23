CREATE TABLE `store_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`baseShippingFee` int NOT NULL DEFAULT 100,
	`freeShippingThreshold` int NOT NULL DEFAULT 1000,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `specDetails` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shippingDetails` text;