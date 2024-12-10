export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  prompt: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'profile'>;
        Update: Partial<Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profile'>>;
      };
    };
  };
} 