/**
 * <JsonLd> — drop this anywhere in a Server Component (page, layout, etc.)
 * to inject a <script type="application/ld+json"> block into the page <head>.
 *
 * Usage:
 *   import { JsonLd } from '@/components/shared/json-ld';
 *   import { buildOrganizationSchema } from '@/lib/structured-data';
 *
 *   export default function Page() {
 *     return (
 *       <>
 *         <JsonLd data={buildOrganizationSchema()} />
 *         ...page JSX...
 *       </>
 *     );
 *   }
 *
 * Multiple schemas on the same page:
 *   <JsonLd data={buildSoftwareApplicationSchema()} />
 *   <JsonLd data={buildOrganizationSchema()} />
 *   <JsonLd data={buildHomepageFAQSchema()} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 0) }}
    />
  );
}
