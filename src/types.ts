export interface Comment {
  userName: string;
  userImage: string; // Added this for your wireframe
  text: string;
  date: string;
}

export interface BlogPost {
  post_id: string; 
  title: string;
  description: string;
  postImage: string;
  authorName: string;
  authorImage: string;
  commentCount: number;
  date: string;
  link: string;
  comments: Comment[];
}