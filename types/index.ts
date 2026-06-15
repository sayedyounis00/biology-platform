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
