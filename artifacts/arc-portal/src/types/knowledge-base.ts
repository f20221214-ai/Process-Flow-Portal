export interface KbArticle {
  id: number;
  title: string;
  category: string;
  tags: string[];
  content: string;
  externalUrl: string | null;
  owner: string;
  technologies: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}
