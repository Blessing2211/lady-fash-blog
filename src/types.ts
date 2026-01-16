import type { User } from "@supabase/supabase-js";

export interface Comment {
  comment: string;
  created_at: string; 
  users: User;
}

export interface BlogPost {
  post_id: string; 
  title: string;
  content: string;
  image: string;
  users: User[];
  comment: Comment[];
  created_at: string;
  
}