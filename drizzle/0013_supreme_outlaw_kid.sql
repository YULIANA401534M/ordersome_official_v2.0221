ALTER TABLE `orders` ADD `invoiceType` enum('personal','company') DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `companyTaxId` varchar(8);--> statement-breakpoint
ALTER TABLE `orders` ADD `companyName` varchar(200);