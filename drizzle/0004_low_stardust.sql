ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','manager','franchisee','staff','customer') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` ADD `birthday` date;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `accumulatedSpending` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `storeId` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `internalContact` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended') DEFAULT 'active' NOT NULL;