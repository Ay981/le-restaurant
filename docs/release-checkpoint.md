# Release Checkpoint — 2026-03-27

This checkpoint captures the current production-ready state of the project and the operational handoff items required for release.

## 1) Migration State (Final)

Applied migration files (in order):

1. `202603190100_baseline_restaurant_schema.sql`
2. `202603190200_payment_receipt_verifications.sql`
3. `202603190300_auth_personalization_and_admin_policies.sql`
4. `202603190400_promote_admin_function.sql`
5. `202603220100_orders_workflow_and_staff.sql`
6. `202603220200_clear_payment_data.sql`
7. `202603220210_clear_payment_data_again.sql`
8. `202603220300_order_feedback_and_notifications.sql`
9. `202603230100_order_feedback_updated_at_trigger.sql`
10. `202603230200_customer_messages.sql`
11. `202603230300_receipt_metadata_and_match_checks.sql`
12. `202603270100_receipt_review_and_staff_notifications.sql`
13. `202603270200_order_admin_decision_note.sql`
14. `202603270300_security_policy_hardening.sql`

Release-critical schema points:
- Admin/staff order workflow tables and audit entries are active.
- Receipt review state and notes are active.
- `orders.admin_decision_note` is present for customer-visible rejection reasons.

## 2) Rollback Plan

Use this plan if a release issue is detected after deployment.

### A. Immediate containment

1. Put admin operations in maintenance mode (announce to staff).
2. Stop new release traffic if applicable (platform rollback / previous deployment promotion).
3. Preserve evidence:
   - application logs,
   - API errors,
   - failing order IDs / receipt IDs.

### B. Application rollback

1. Revert app code to previous stable deployment (last known good tag/commit).
2. Redeploy with same environment variables.
3. Smoke-test:
   - `/menu`,
   - `/orders`,
   - `/admin/orders`,
   - `/api/chat/recommend`,
   - `/api/admin/orders/[id]/status`.

### C. Database rollback strategy

Preferred: **forward-fix** with a corrective migration.
- If schema/data mismatch is limited, add a new migration that restores compatibility.

Emergency fallback (if absolutely required):
1. Restore DB from pre-release backup/snapshot.
2. Re-link environment and re-run only validated migrations.
3. Verify row counts and integrity for:
   - `orders`,
   - `order_items`,
   - `payment_receipt_verifications`,
   - `order_status_audit`,
   - `order_notifications`.

### D. Post-rollback verification

- Customer can place order successfully.
- Admin can accept/reject/deliver orders.
- Receipt review works and remains idempotent.
- Notifications and customer order status updates are visible.

## 3) Credential Handoff (Admin/Staff)

Credentials must never be stored in git. Use your organization's secret manager/runbook for all admin and staff account handoff data.

Security handoff actions (required before production go-live):
1. Rotate all existing admin/staff passwords immediately.
2. Replace temporary accounts with organization-owned emails.
3. Enforce password reset on first login.
4. Store credentials only in approved secret manager/runbook.
5. Validate role assignment in `profiles` after rotation.

## 4) Final Validation Snapshot

Validation run completed on this checkpoint:
- Lint: passed
- Build + TypeScript: passed
- Tests: passed (`tests/receipt-helpers.test.ts`, 4/4)
- Problems panel: no remaining errors

## 5) Go-Live Checklist

- [ ] Production env vars confirmed (`SUPABASE_*`, `RECEIPT_VERIFY_*`, `GEMINI_*`, `NEXT_PUBLIC_SITE_URL`)
- [ ] Metadata/share preview checked in production
- [ ] Admin and staff passwords rotated
- [ ] Rollback owner assigned
- [ ] Smoke test completed on live URL
