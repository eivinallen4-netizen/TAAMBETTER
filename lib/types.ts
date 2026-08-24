export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';

export interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  username_hash: string;
  email_hash: string;
  password_hash: string;
  username_salt: string;
  email_salt: string;
  password_salt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaAccountInput {
  platform: SocialPlatform;
  username: string;
  email: string;
  password: string;
}
