CREATE TABLE `dy_work_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`driverId` int NOT NULL,
	`workDate` date NOT NULL,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalCollected` decimal(10,2) NOT NULL DEFAULT '0',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dy_work_logs_id` PRIMARY KEY(`id`)
);
