import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readTime: string;
  content: string; // rendered HTML
  excerpt: string; // plain text excerpt
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readTime: string;
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
    const { data } = matter(raw);
    return {
      slug,
      title: data.title ?? '',
      description: data.description ?? '',
      date: data.date ?? '',
      author: data.author ?? 'API Lens Team',
      tags: data.tags ?? [],
      readTime: data.readTime ?? '',
    } as BlogPostMeta;
  });

  // Sort newest first
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content: markdown } = matter(raw);

  const processed = await remark().use(remarkHtml, { sanitize: false }).process(markdown);
  const content = processed.toString();

  // Plain text excerpt (first ~160 chars of markdown)
  const excerpt = markdown.replace(/[#*`>\[\]]/g, '').trim().slice(0, 160);

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    author: data.author ?? 'API Lens Team',
    tags: data.tags ?? [],
    readTime: data.readTime ?? '',
    content,
    excerpt,
  };
}
