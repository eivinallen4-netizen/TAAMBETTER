-- Users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_token_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Social media accounts table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  submission_referrer_id TEXT,
  platform TEXT NOT NULL CHECK(platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter')),
  username_hash TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  username_salt TEXT NOT NULL,
  email_salt TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, platform)
);

-- Intake links table
CREATE TABLE IF NOT EXISTS intake_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Submissions tracking table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  intake_link_id TEXT NOT NULL,
  user_id TEXT,
  submitted_by_email TEXT,
  submitted_by_name TEXT,
  account_count INTEGER,
  platforms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intake_link_id) REFERENCES intake_links(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Free video offers table
CREATE TABLE IF NOT EXISTS free_video_offers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_name TEXT NOT NULL,
  sales_range TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table (for general inquiries)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  completion_status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source_page TEXT,
  biggest_challenge TEXT,
  services_interested TEXT,
  business_name TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_media_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_free_video_offers_created ON free_video_offers(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_timestamp ON contacts(timestamp);
