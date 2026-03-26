import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/shared/json-ld';
import {
  buildBlogPostingSchema,
  buildBlogPostBreadcrumbSchema,
  type BlogPostingInput,
} from '@/lib/structured-data';
import { getPostBySlug, getAllPosts } from '@/lib/blog';

// ─────────────────────────────────────────────────────────────────────────────
// Static params
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = `https://apilens.tech/blog/${slug}`;
  const imageUrl = `https://apilens.tech/og.png`;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: 'API Lens',
      type: 'article',
      publishedTime: post.date,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const postUrl = `https://apilens.tech/blog/${slug}`;
  const imageUrl = `https://apilens.tech/og.png`;

  const blogPostingInput: BlogPostingInput = {
    headline: post.title,
    description: post.description,
    authorName: post.author,
    authorUrl: 'https://apilens.tech',
    datePublished: post.date,
    dateModified: post.date,
    imageUrl,
    url: postUrl,
    keywords: post.tags,
    articleBodySummary: post.excerpt,
  };

  const blogPostingSchema = buildBlogPostingSchema(blogPostingInput);
  const breadcrumbSchema = buildBlogPostBreadcrumbSchema(post.title, postUrl);

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />

      <style>{`
        .blog-prose h2 { font-size: 1.5rem; font-weight: 700; color: white; margin-top: 2.5rem; margin-bottom: 1rem; }
        .blog-prose h3 { font-size: 1.2rem; font-weight: 600; color: white; margin-top: 2rem; margin-bottom: 0.75rem; }
        .blog-prose p { color: rgb(212 212 216); line-height: 1.75; margin-bottom: 1.25rem; font-size: 1rem; }
        .blog-prose strong { color: white; font-weight: 600; }
        .blog-prose a { color: #60a5fa; text-decoration: underline; }
        .blog-prose a:hover { color: #93c5fd; }
        .blog-prose ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: rgb(212 212 216); }
        .blog-prose ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; color: rgb(212 212 216); }
        .blog-prose li { margin-bottom: 0.4rem; line-height: 1.7; }
        .blog-prose hr { border-color: rgb(39 39 42); margin: 2.5rem 0; }
        .blog-prose code { background: rgb(24 24 27); border: 1px solid rgb(39 39 42); border-radius: 4px; padding: 0.15rem 0.4rem; font-size: 0.875rem; color: #93c5fd; }
        .blog-prose pre { background: rgb(12 12 15); border: 1px solid rgb(39 39 42); border-radius: 12px; padding: 1.25rem; overflow-x: auto; margin-bottom: 1.5rem; }
        .blog-prose pre code { background: none; border: none; padding: 0; color: #a1a1aa; font-size: 0.875rem; }
        .blog-prose table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem; }
        .blog-prose th { background: rgb(24 24 27); color: white; font-weight: 600; padding: 0.6rem 1rem; text-align: left; border: 1px solid rgb(39 39 42); }
        .blog-prose td { padding: 0.6rem 1rem; border: 1px solid rgb(39 39 42); color: rgb(212 212 216); }
        .blog-prose tr:nth-child(even) td { background: rgb(18 18 21); }
        .blog-prose blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; margin: 1.5rem 0; color: rgb(161 161 170); font-style: italic; }
      `}</style>

      <div className="min-h-screen bg-black text-zinc-300">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3" fill="white" />
                  <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <span className="text-white font-bold text-base tracking-tight">API Lens</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="https://app.apilens.tech/signin"
                className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="https://apilens.tech/signup"
                className="text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </nav>

        {/* Page body */}
        <div className="pt-24 pb-20 px-6">
          <div className="max-w-2xl mx-auto">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center gap-1.5 text-xs text-zinc-500 flex-wrap">
                <li>
                  <Link href="/" className="hover:text-zinc-300 transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline">
                    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-zinc-300 transition-colors">
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline">
                    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </li>
                <li className="text-zinc-400 truncate max-w-[240px]">{post.title}</li>
              </ol>
            </nav>

            {/* Article */}
            <article>
              {/* Header */}
              <header className="mb-10">
                {/* Date + read time */}
                <div className="flex items-center gap-3 mb-4 text-xs text-zinc-500">
                  {formattedDate && (
                    <time dateTime={post.date}>{formattedDate}</time>
                  )}
                  {formattedDate && post.readTime && (
                    <span aria-hidden="true">·</span>
                  )}
                  {post.readTime && <span>{post.readTime}</span>}
                </div>

                {/* Title */}
                <h1
                  className="text-white font-bold leading-tight mb-4"
                  style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
                >
                  {post.title}
                </h1>

                {/* Description */}
                <p className="text-zinc-400 max-w-2xl" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  {post.description}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <hr className="mt-8 mb-0 border-zinc-800/60" />
              </header>

              {/* Body */}
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            {/* CTA */}
            <div className="mt-14 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 text-center">
              <h2 className="text-white font-bold text-xl mb-2">
                Track your AI API costs in one place
              </h2>
              <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Monitor spend across OpenAI, Anthropic, Gemini, and 9+ providers. Set budgets, get alerts, and stop bill shock before it happens.
              </p>
              <Link
                href="https://apilens.tech/signup"
                className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Start Free Trial — No credit card required
              </Link>
            </div>

            {/* Back to blog */}
            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
