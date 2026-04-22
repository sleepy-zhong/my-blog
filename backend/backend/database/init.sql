-- Legacy simplified initialization schema
CREATE DATABASE IF NOT EXISTS techblogdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE techblogdb;

CREATE TABLE IF NOT EXISTS users (
  id int AUTO_INCREMENT PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  email varchar(100) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  avatar varchar(255) DEFAULT NULL,
  role enum('admin', 'editor', 'user') DEFAULT 'user',
  status enum('active', 'inactive') DEFAULT 'active',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id int AUTO_INCREMENT PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  description text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tags (
  id int AUTO_INCREMENT PRIMARY KEY,
  name varchar(50) NOT NULL UNIQUE,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
  id int AUTO_INCREMENT PRIMARY KEY,
  title varchar(255) NOT NULL,
  content longtext,
  summary text,
  author_id int,
  category_id int,
  status enum('draft', 'published', 'archived') DEFAULT 'draft',
  views int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_tags (
  id int AUTO_INCREMENT PRIMARY KEY,
  article_id int,
  tag_id int,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_article_tag (article_id, tag_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id int AUTO_INCREMENT PRIMARY KEY,
  article_id int,
  user_id int,
  parent_id int DEFAULT NULL,
  content text NOT NULL,
  status enum('approved', 'pending', 'rejected') DEFAULT 'pending',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_likes (
  article_id int NOT NULL,
  user_id int NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id, user_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_favorites (
  article_id int NOT NULL,
  user_id int NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id, user_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO users (username, email, password, role) VALUES
('admin', 'admin@sleepyzhong.top', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

INSERT IGNORE INTO categories (name, description) VALUES
('Tech', 'Technical articles'),
('Life', 'Daily notes'),
('Study', 'Study notes');

INSERT IGNORE INTO tags (name) VALUES
('JavaScript'), ('Vue.js'), ('Node.js'), ('MySQL'), ('Docker');

INSERT IGNORE INTO articles (title, content, summary, author_id, category_id, status) VALUES
('Welcome to the blog system', '# Welcome to the blog system\n\nThis is your first article.\n\n## Features\n\n- Markdown editing\n- Responsive layout\n- User management\n- Comment system\n', 'The first article of the blog system.', 1, 1, 'published');

FLUSH PRIVILEGES;
