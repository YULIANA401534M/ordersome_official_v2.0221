CREATE TABLE `sop_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target_type` enum('role','user') NOT NULL,
	`target_role` varchar(50),
	`target_user_id` int,
	`scope_type` enum('category','document') NOT NULL,
	`category_id` int,
	`document_id` int,
	`is_granted` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sop_permissions_id` PRIMARY KEY(`id`)
);
