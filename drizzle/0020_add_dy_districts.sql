CREATE TABLE `dy_districts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(50) NOT NULL,
	`deliveryDays` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dy_districts_id` PRIMARY KEY(`id`)
);
