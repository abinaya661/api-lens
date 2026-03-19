-- Migration 003: Fix overly permissive RLS policies
-- Tightens INSERT/UPDATE/SELECT policies across several tables so that
-- each operation is scoped to the authenticated user's own data and
-- privileged writes are restricted to the service_role only.

-- ─────────────────────────────────────────────
-- 1. usage_records — INSERT scoped to user's own api_keys
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "insert_usage_records" ON public.usage_records;
CREATE POLICY "insert_usage_records" ON public.usage_records
  FOR INSERT
  WITH CHECK (
    key_id IN (
      SELECT id FROM public.api_keys
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────
-- 2. alerts — INSERT scoped to user's own company
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "insert_alerts" ON public.alerts;
CREATE POLICY "insert_alerts" ON public.alerts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 3. subscriptions — users read their own; service_role writes
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "all_subscriptions"       ON public.subscriptions;
DROP POLICY IF EXISTS "users_read_own_subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "read_own_subscription"   ON public.subscriptions;
DROP POLICY IF EXISTS "insert_subscription"     ON public.subscriptions;
DROP POLICY IF EXISTS "update_subscription"     ON public.subscriptions;

CREATE POLICY "read_own_subscription" ON public.subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT and UPDATE are denied for normal roles (service_role bypasses RLS)
CREATE POLICY "insert_subscription" ON public.subscriptions
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "update_subscription" ON public.subscriptions
  FOR UPDATE
  USING (false);

-- ─────────────────────────────────────────────
-- 4. notifications — users read their own; inserts restricted to service_role
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "all_notifications"    ON public.notifications;
DROP POLICY IF EXISTS "read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "insert_notifications" ON public.notifications;

CREATE POLICY "read_own_notifications" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT denied for normal roles (service_role bypasses RLS)
CREATE POLICY "insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (false);

-- ─────────────────────────────────────────────
-- 5. audit_log — service_role only (no direct inserts by users)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "insert_audit_log" ON public.audit_log;
CREATE POLICY "insert_audit_log" ON public.audit_log
  FOR INSERT
  WITH CHECK (false);
