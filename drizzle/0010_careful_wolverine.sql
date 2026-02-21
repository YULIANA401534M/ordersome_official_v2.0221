ALTER TABLE `equipment_repairs` ADD `category` varchar(50) DEFAULT '其他' NOT NULL;--> statement-breakpoint
ALTER TABLE `sop_documents` ADD `is_visible_to_staff` boolean DEFAULT true NOT NULL;