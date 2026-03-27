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
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { RevealOnScroll } from '@/components/landing/reveal-on-scroll';

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
        .blog-prose h2 { font-size: 1.875rem; font-weight: 800; color: white; margin-top: 3.5rem; margin-bottom: 1.5rem; letter-spacing: -0.025em; }
        .blog-prose h3 { font-size: 1.5rem; font-weight: 700; color: white; margin-top: 2.5rem; margin-bottom: 1rem; letter-spacing: -0.01em; }
        .blog-prose p { color: rgb(161 161 170); line-height: 1.8; margin-bottom: 1.5rem; font-size: 1.125rem; }
        .blog-prose strong { color: white; font-weight: 700; }
        .blog-prose a { color: #60a5fa; text-decoration: underline; text-underline-offset: 4px; font-weight: 500; }
        .blog-prose a:hover { color: #93c5fd; }
        .blog-prose ul { list-style: none; padding-left: 0; margin-bottom: 1.5rem; color: rgb(161 161 170); }
        .blog-prose ul li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .blog-prose ul li::before { content: ""; position: absolute; left: 0; top: 0.7rem; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }
        .blog-prose ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; color: rgb(161 161 170); }
        .blog-prose li { margin-bottom: 0.5rem; line-height: 1.8; }
        .blog-prose hr { border-color: rgba(255,255,255,0.06); margin: 3rem 0; }
        .blog-prose code { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); border-radius: 6px; padding: 0.2rem 0.4rem; font-size: 0.9em; color: #93c5fd; font-family: ui-monospace, monospace; }
        .blog-prose pre { background: rgb(9 9 11); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; overflow-x: auto; margin: 2rem 0; position: relative; }
        .blog-prose pre code { background: none; border: none; padding: 0; color: #d4d4d8; font-size: 0.9rem; }
        .blog-prose table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
        .blog-prose th { background: rgba(255,255,255,0.03); color: white; font-weight: 700; padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .blog-prose td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); color: rgb(161 161 170); }
        .blog-prose tr:last-child td { border-bottom: none; }
        .blog-prose blockquote { border-left: 4px solid #3b82f6; padding: 1rem 1.5rem; margin: 2.5rem 0; background: rgba(59,130,246,0.03); border-radius: 0 12px 12px 0; color: rgb(212 212 216); font-style: italic; font-size: 1.125rem; }
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
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="https://app.apilens.tech/signin"
                className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="https://apilens.tech/signup"
                className="text-sm font-bold bg-white dark:bg-zinc-100 text-black px-4 py-1.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </nav>

        {/* Page body */}
        <div className="pt-24 pb-24 px-6 relative overflow-hidden">
          {/* Background Mesh */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-600/5 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">

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
              {/* Header */}
              <header className="mb-14">
                <RevealOnScroll>
                  {/* Date + read time */}
                  <div className="flex items-center gap-4 mb-6 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    {formattedDate && (
                      <time dateTime={post.date}>{formattedDate}</time>
                    )}
                    {formattedDate && post.readTime && (
                      <span aria-hidden="true" className="w-1 h-1 rounded-full bg-zinc-800" />
                    )}
                    {post.readTime && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 lowercase italic font-medium">
                        {post.readTime}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1
                    className="text-white font-black leading-[1.1] mb-8 tracking-tight"
                    style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
                  >
                    {post.title}
                  </h1>

                  {/* Description */}
                  <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed mb-10 max-w-3xl">
                    {post.description}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md bg-brand-500/5 text-brand-400 border border-brand-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="w-full h-px bg-gradient-to-r from-zinc-800/0 via-zinc-800/50 to-zinc-800/0 mb-12" />
                </RevealOnScroll>
              </header>

              {/* Body */}
              <RevealOnScroll>
                <div
                  className="blog-prose"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </RevealOnScroll>
            </article>

            {/* CTA */}
            {/* CTA */}
            <RevealOnScroll>
              <div className="mt-20 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/0 to-brand-500/0 group-hover:from-brand-500/20 group-hover:to-blue-500/10 rounded-3xl blur transition-all duration-500" />
                <div className="relative bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-10 md:p-14 text-center">
                  <h2 className="text-white font-black text-3xl md:text-4xl mb-4 tracking-tight">
                    Optimise your AI spend
                  </h2>
                  <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                    Join 2,000+ teams using API Lens to monitor, budget, and attribute costs across 14+ AI providers.
                  </p>
                  <Link
                    href="https://apilens.tech/signup"
                    className="inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                  >
                    Get Started Now
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <p className="mt-6 text-xs text-zinc-600 font-medium">Free 7-day trial · No credit card required</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Back to blog */}
            <div className="mt-16 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-brand-400 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-all">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Return to Insights
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
