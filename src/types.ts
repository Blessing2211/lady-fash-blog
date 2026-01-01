// src/types.ts
export interface BlogPost {
  post_id: string;
  title: string;
  description: string;
  postImage: string; // The main featured image
  authorName: string;
  authorImage: string;
  commentCount: number;
  date: string;
  link: string;
}