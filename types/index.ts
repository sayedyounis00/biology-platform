export interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  is_published: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string | null;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number | null;
  attachment_urls?: string[] | null;
  created_at: string;
}
