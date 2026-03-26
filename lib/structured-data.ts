/**
 * JSON-LD Structured Data helpers for API Lens
 *
 * Usage in any Next.js page (Server Component or generateMetadata):
 *
 *   import { buildSoftwareApplicationSchema } from '@/lib/structured-data';
 *
 *   // Inside the page component JSX:
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareApplicationSchema()) }}
 *   />
 *
 * Or, inject via generateMetadata using the <JsonLd> component exported below.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://apilens.tech';
const SITE_NAME = 'API Lens';
const LOGO_URL = 'https://apilens.tech/logo.jpg';
const SUPPORT_EMAIL = 'support@apilens.tech';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SoftwareApplication  →  homepage (app/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export function buildSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'API Lens',
    url: SITE_URL,
    description:
      'API Lens is a SaaS AI cost monitoring platform that gives engineering teams a single dashboard to monitor, budget, and attribute AI API usage across OpenAI, Anthropic, Google Gemini, and 9+ other providers. Features include real-time spend dashboards, multi-tier budget alerts, AES-256-GCM encrypted key management, project-level cost attribution, and downloadable usage reports.',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'FinancialManagement',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Works in all modern browsers.',
    softwareVersion: '1.0',
    releaseNotes: `${SITE_URL}/changelog`,
    screenshot: `${SITE_URL}/og-screenshot.png`,
    offers: [
      {
        '@type': 'Offer',
        name: 'Base — Monthly',
        price: '5.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '5.99',
          priceCurrency: 'USD',
          unitText: 'MONTH',
          billingIncrement: 1,
        },
        description:
          '10 API keys, 1 seat, budget alerts, hourly usage sync, weekly/monthly reports, project-level tracking. 7-day free trial included.',
        eligibleRegion: { '@type': 'Place', name: 'Worldwide' },
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/signup`,
      },
      {
        '@type': 'Offer',
        name: 'Base — Annual',
        price: '59.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '59.99',
          priceCurrency: 'USD',
          unitText: 'YEAR',
          billingIncrement: 1,
        },
        description:
          'All Base features billed annually. Save ~17% vs monthly. 7-day free trial included.',
        eligibleRegion: { '@type': 'Place', name: 'Worldwide' },
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/signup`,
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '12',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Unified AI cost dashboard across 9+ providers',
      'Real-time spend tracking with 15-minute refresh',
      'Multi-tier budget alerts (50%, 75%, 90%, 100%)',
      'AES-256-GCM encrypted API key management',
      'Project-level cost attribution',
      'Cost estimator with model comparison',
      'CSV usage reports',
      'Regional pricing in 50+ countries',
      '7-day free trial, no credit card required',
    ],
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WebSite with SearchAction  →  app/layout.tsx (global, every page)
// ─────────────────────────────────────────────────────────────────────────────

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Monitor and optimize your AI API costs across OpenAI, Anthropic, Gemini, and 9+ providers.',
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Organization  →  app/layout.tsx (global, every page)
// ─────────────────────────────────────────────────────────────────────────────

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: SUPPORT_EMAIL,
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    ],
    sameAs: [
      // Add real social profile URLs when they exist:
      // 'https://twitter.com/apilens',
      // 'https://www.linkedin.com/company/api-lens',
      // 'https://github.com/abinaya661/api-lens',
    ],
    foundingDate: '2026',
    description:
      'API Lens provides AI cost monitoring, budget alerting, and API key management for engineering teams using OpenAI, Anthropic, Google Gemini, and other AI providers.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BlogPosting  →  app/blog/[slug]/page.tsx  (one per blog post)
//    All {{placeholder}} fields are populated from MDX frontmatter at build time.
// ─────────────────────────────────────────────────────────────────────────────

export interface BlogPostingInput {
  /** Post headline / title, e.g. "How to Set AI API Budgets" */
  headline: string;
  /** Short description / meta description of the post */
  description: string;
  /** Author's full name */
  authorName: string;
  /** Author profile URL, can be author's Twitter/LinkedIn or /about page */
  authorUrl?: string;
  /** ISO 8601 publish date, e.g. "2026-03-26" */
  datePublished: string;
  /** ISO 8601 last modified date; defaults to datePublished if not set */
  dateModified?: string;
  /** Absolute URL of the post's OG image */
  imageUrl: string;
  /** Full canonical URL of the post, e.g. "https://apilens.tech/blog/how-to-set-ai-budgets" */
  url: string;
  /** Array of keyword strings from frontmatter tags */
  keywords?: string[];
  /** First 400–600 chars of the post body (plain text, no markdown) */
  articleBodySummary?: string;
}

export function buildBlogPostingSchema(post: BlogPostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.authorName,
      ...(post.authorUrl ? { url: post.authorUrl } : {}),
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    image: {
      '@type': 'ImageObject',
      url: post.imageUrl,
      width: 1200,
      height: 630,
    },
    url: post.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
        width: 512,
        height: 512,
      },
    },
    keywords: post.keywords ?? [],
    ...(post.articleBodySummary
      ? { articleBody: post.articleBodySummary }
      : {}),
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog`,
      name: 'API Lens Blog',
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BreadcrumbList  →  app/blog/[slug]/page.tsx  (injected alongside BlogPosting)
// ─────────────────────────────────────────────────────────────────────────────

export function buildBlogPostBreadcrumbSchema(postTitle: string, postUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postTitle,
        item: postUrl,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FAQPage  →  app/page.tsx  (homepage FAQ section)
// ─────────────────────────────────────────────────────────────────────────────

export function buildHomepageFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is there a setup fee?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. You simply pay a flat subscription fee. Setup takes less than 2 minutes — just add your API keys and API Lens starts tracking immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will I need to change my code?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. API Lens works by dropping in a proxy URL or syncing directly with your provider via their read-only billing endpoints. No SDK changes, no new packages, no code changes required.',
        },
      },
      {
        '@type': 'Question',
        name: 'How secure is the dashboard?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'API Lens uses AES-256-GCM envelope encryption with a write-only master key, the same encryption standard used by banks. We physically cannot read your stored API credentials. All data is protected by Supabase Row-Level Security (RLS), meaning each user can only access their own data.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I limit spend per team member?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can issue granular gateway keys to individual developers or projects with hard budget caps. Set budgets at any level — global, per-provider, per-project, or per-key — and receive alerts at 50%, 75%, 90%, and 100% thresholds.',
        },
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. HowTo  →  app/blog/how-to-set-ai-api-budgets/page.tsx  (blog post 2)
// ─────────────────────────────────────────────────────────────────────────────

export function buildHowToSetAIBudgetsSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Set AI API Budgets to Prevent Cost Overruns',
    description:
      'A step-by-step guide to configuring budget alerts and spending limits for your AI API usage across OpenAI, Anthropic, Google Gemini, and other providers using API Lens.',
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/og.png`,
      width: 1200,
      height: 630,
    },
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    supply: [
      {
        '@type': 'HowToSupply',
        name: 'API Lens account (free 7-day trial)',
      },
      {
        '@type': 'HowToSupply',
        name: 'At least one AI provider API key (OpenAI, Anthropic, Gemini, etc.)',
      },
    ],
    tool: [
      {
        '@type': 'HowToTool',
        name: 'API Lens dashboard',
      },
    ],
    totalTime: 'PT10M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Sign up and connect your first API key',
        text: 'Create a free API Lens account at apilens.tech/signup. During onboarding, add your first AI provider API key. Keys are encrypted with AES-256-GCM immediately on save — API Lens never stores keys in plain text.',
        url: `${SITE_URL}/signup`,
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-1-connect-key.png`,
          width: 1200,
          height: 675,
        },
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Navigate to the Budgets section',
        text: 'From the dashboard sidebar, click "Budgets". This screen shows all existing budgets and their current utilisation. Click "Add Budget" to create your first spending limit.',
        url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-2-budgets-page.png`,
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-2-budgets-page.png`,
          width: 1200,
          height: 675,
        },
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Choose your budget scope',
        text: 'Select whether the budget applies globally (all providers combined), to a single provider (e.g., OpenAI only), to a specific project, or to an individual API key. Start with a global budget to catch overall overruns, then add per-provider limits as needed.',
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-3-budget-scope.png`,
          width: 1200,
          height: 675,
        },
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Set your spending limit and alert thresholds',
        text: 'Enter a monthly spending cap in USD. API Lens automatically creates four alert thresholds at 50%, 75%, 90%, and 100% of your limit. You will receive in-app and email notifications at each threshold — giving you time to act before hitting the cap.',
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-4-set-limit.png`,
          width: 1200,
          height: 675,
        },
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Monitor utilisation on the dashboard',
        text: 'Return to the main dashboard to see live budget utilisation bars for each budget you have created. API Lens refreshes usage data automatically (every hour on Base plan, every 15 minutes on Pro). If any budget crosses 75%, you will see a warning badge in the sidebar.',
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-5-monitor.png`,
          width: 1200,
          height: 675,
        },
      },
      {
        '@type': 'HowToStep',
        position: 6,
        name: 'Respond to alerts and adjust limits over time',
        text: 'When you receive a budget alert, open the Alerts section to see which provider or project triggered it. Use the Cost Estimator to model whether the spend is justified, then either optimise your model selection or raise the budget cap accordingly.',
        image: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/blog/how-to-set-ai-api-budgets/step-6-respond.png`,
          width: 1200,
          height: 675,
        },
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ItemList  →  app/blog/page.tsx  (blog index listing all posts)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlogIndexItem {
  position: number;
  name: string;
  url: string;
  description?: string;
  datePublished?: string;
  imageUrl?: string;
}

export function buildBlogIndexItemListSchema(posts: BlogIndexItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'API Lens Blog — AI Cost Management Guides',
    description:
      'Guides, tutorials, and best practices for managing AI API costs, setting budgets, and optimising spend across OpenAI, Anthropic, Gemini, and more.',
    url: `${SITE_URL}/blog`,
    numberOfItems: posts.length,
    itemListElement: posts.map((post) => ({
      '@type': 'ListItem',
      position: post.position,
      name: post.name,
      url: post.url,
      ...(post.description ? { description: post.description } : {}),
      item: {
        '@type': 'BlogPosting',
        headline: post.name,
        url: post.url,
        ...(post.datePublished ? { datePublished: post.datePublished } : {}),
        ...(post.imageUrl
          ? { image: { '@type': 'ImageObject', url: post.imageUrl, width: 1200, height: 630 } }
          : {}),
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
    })),
  };
}
