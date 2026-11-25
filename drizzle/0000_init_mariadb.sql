CREATE TABLE `admin_sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`name` varchar(120) NOT NULL DEFAULT '',
	`password_hash` varchar(255) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `hero_slides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eyebrow` varchar(200) NOT NULL DEFAULT '',
	`title` varchar(200) NOT NULL,
	`title_accent` varchar(200) NOT NULL DEFAULT '',
	`description` text NOT NULL DEFAULT (''),
	`media_type` varchar(10) NOT NULL DEFAULT 'image',
	`media_url` varchar(255) NOT NULL,
	`poster_url` varchar(255),
	`has_audio` boolean NOT NULL DEFAULT false,
	`aspect` double,
	`focus` varchar(10) NOT NULL DEFAULT 'center',
	`stone` varchar(120) NOT NULL DEFAULT '',
	`product_id` varchar(120),
	`product_ids` json NOT NULL DEFAULT ('[]'),
	`position` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `hero_slides_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(254) NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`product_id` varchar(120) NOT NULL,
	`product_name` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(64) NOT NULL,
	`number` varchar(40) NOT NULL,
	`email` varchar(254) NOT NULL,
	`customer_name` varchar(200) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`address` json NOT NULL,
	`delivery` varchar(40) NOT NULL,
	`subtotal` int NOT NULL,
	`shipping` int NOT NULL,
	`total` int NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'awaiting_confirmation',
	`payment_provider` varchar(40) NOT NULL DEFAULT 'manual',
	`payment_status` varchar(40) NOT NULL DEFAULT 'unpaid',
	`payment_ref` varchar(191),
	`shipping_provider` varchar(40) NOT NULL DEFAULT 'manual',
	`shipping_ref` varchar(191),
	`tracking_number` varchar(100),
	`admin_note` text NOT NULL DEFAULT (''),
	`terms_accepted_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`number`),
	CONSTRAINT `orders_payment_ref_unique` UNIQUE(`payment_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `pages` (
	`slug` varchar(60) NOT NULL,
	`eyebrow` varchar(200) NOT NULL DEFAULT '',
	`title` varchar(200) NOT NULL,
	`title_accent` varchar(200) NOT NULL DEFAULT '',
	`intro` text NOT NULL DEFAULT (''),
	`body` text NOT NULL DEFAULT (''),
	`images` json NOT NULL DEFAULT ('[]'),
	`teaser_image` varchar(255),
	`teaser_title` varchar(200) NOT NULL DEFAULT '',
	`teaser_accent` varchar(200) NOT NULL DEFAULT '',
	`teaser_text` text NOT NULL DEFAULT (''),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `pages_slug` PRIMARY KEY(`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(120) NOT NULL,
	`name` varchar(160) NOT NULL,
	`subtitle` varchar(200) NOT NULL DEFAULT '',
	`category_id` int,
	`stones` json NOT NULL DEFAULT ('[]'),
	`material` varchar(200) NOT NULL DEFAULT 'Złocona stal szlachetna',
	`size` varchar(200) NOT NULL DEFAULT '',
	`price` int NOT NULL,
	`compare_at_price` int,
	`image` varchar(255) NOT NULL DEFAULT '',
	`images` json NOT NULL DEFAULT ('[]'),
	`badge` varchar(200),
	`description` text NOT NULL DEFAULT (''),
	`stock` int NOT NULL DEFAULT 0,
	`position` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `stones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`caption` varchar(200) NOT NULL DEFAULT '',
	`description` text NOT NULL DEFAULT (''),
	`images` json NOT NULL DEFAULT ('[]'),
	`show_on_home` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `stones_id` PRIMARY KEY(`id`),
	CONSTRAINT `stones_name_unique` UNIQUE(`name`),
	CONSTRAINT `stones_slug_unique` UNIQUE(`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`source` varchar(60) NOT NULL DEFAULT 'newsletter-form',
	`consent_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_user_id_admin_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `products_listing_idx` ON `products` (`category_id`,`is_active`,`position`);