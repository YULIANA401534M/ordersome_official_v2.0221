CREATE TABLE `daily_checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklist_id` int NOT NULL,
	`item_name` varchar(100) NOT NULL,
	`is_checked` boolean NOT NULL DEFAULT false,
	`notes` text,
	CONSTRAINT `daily_checklist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`store_id` int NOT NULL,
	`checklist_type` enum('opening','closing') NOT NULL,
	`checked_by` int NOT NULL,
	`check_date` date NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment_repairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`store_id` int NOT NULL,
	`equipment_name` varchar(100) NOT NULL,
	`issue_description` text NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`image_url` text,
	`reported_by` int NOT NULL,
	`status` enum('pending','in_progress','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`resolved_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_repairs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`display_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sop_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`pdf_url` text,
	`version` varchar(20) DEFAULT '1.0',
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`author_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sop_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_read_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`user_id` int NOT NULL,
	`read_at` timestamp NOT NULL DEFAULT (now()),
	`acknowledged` boolean DEFAULT false,
	CONSTRAINT `sop_read_receipts_id` PRIMARY KEY(`id`)
);
