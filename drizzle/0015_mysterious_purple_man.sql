ALTER TABLE `products` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `exclusiveSlug` varchar(200);--> statement-breakpoint
ALTER TABLE `products` ADD `exclusiveImageUrl` text;--> statement-breakpoint
ALTER TABLE `sop_documents` ADD `display_order` int DEFAULT 0 NOT NULL;