# Skill 01 — Project Architecture & Conventions
# Expert: FSA — Senior Full-Stack Architect (15 years)

After 15 years of building production systems, the decisions made in
the first week either save you or haunt you forever. Architecture is
not something you fix later. You fix it now, when the cost is zero.

---

## Why Next.js 15 App Router

The App Router uses React Server Components. Data is fetched on the
server before HTML is sent — users see real content immediately, not
a loading spinner. For a dashboard where every page has data, this is
not optional. It is the correct choice.

We do not use a separate backend. Server Actions give us type-safe
server-side mutations without an extra API layer. API routes are only
for webhooks and cron jobs — external services that call us.

---

## TypeScript Configuration

// tsconfig.json — these settings are non-negotiable
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}

noUncheckedIndexedAccess is the one most developers miss.
Without it: arr[0] has type T even if the array is empty.
With it: arr[0] correctly has type T | undefined, forcing you to handle the empty case.
This catches an entire class of runtime errors at compile time.

---

## The Server Action Pattern — use this exactly

'use server'
import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z }              from 'zod'

// Step 1: Zod schema at the top — your input contract.
// If input does not match, reject before touching the database.
const CreateProjectSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
})

// Step 2: Discriminated union return type.
// ok: true/false works perfectly with useFormState.
// It is immediately obvious at the call site whether the action succeeded.
type ActionResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; field?: string }

export async function createProject(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // Step 3: Auth check FIRST — before any other operation.
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { ok: false, error: 'Session expired. Please log in again.' }
    }

    // Step 4: Parse and validate.
    // Object.fromEntries(formData) — do NOT use formData.get() per field.
    // That approach forgets to validate and misses fields silently.
    const parsed = CreateProjectSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: issue.message, field: issue.path[0]?.toString() }
    }

    const { name, description, color } = parsed.data

    // Step 5: Database write — only after auth and validation pass.
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name, description, color })
      .select('id, name')
      .single()

    if (error) throw error

    // Step 6: Revalidate only the paths that show this data.
    // Over-revalidating causes unnecessary re-renders.
    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return { ok: true, data }

  } catch (err) {
    // Step 7: Log server-side with context. Return clean message to user.
    // Never leak internal error details to the client.
    console.error('[createProject]', err instanceof Error ? err.message : err)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

---

## The cn() Utility — why not template literals

// /lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge }               from 'tailwind-merge'

// clsx handles conditional class logic.
// twMerge deduplicates Tailwind conflicts.
// Without twMerge: "p-4 p-2" keeps both — browser applies whichever
// comes last in the stylesheet — unpredictable.
// With twMerge: "p-4 p-2" correctly resolves to "p-2".
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

---

## Export Conventions

Named exports everywhere except page.tsx and layout.tsx.
Reason: named exports are refactoring-safe. IDEs can reliably
rename them across files. Default exports cannot be reliably renamed.
Next.js requires default exports only for page.tsx and layout.tsx.

File names: kebab-case (user-profile.tsx)
Component names: PascalCase (UserProfile)
Function names: camelCase (getUserProfile)
Constants: SCREAMING_SNAKE_CASE (MAX_RETRY_COUNT)