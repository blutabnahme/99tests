-- ============================================================
-- 99Tests 2.0 — Migration 004: Bank Transfer Payments
-- ============================================================

-- 1. Enum Updates
-- Add awaiting_payment to order status enum (before 'preparing')
ALTER TYPE tt_order_status ADD VALUE IF NOT EXISTS 'awaiting_payment' BEFORE 'preparing';

-- Add awaiting_payment to recommendation status enum (before 'paid')
ALTER TYPE tt_recommendation_status ADD VALUE IF NOT EXISTS 'awaiting_payment' BEFORE 'paid';


-- 2. Table Updates
-- Add payment_method to order
ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'credit_card';

-- Add administrative confirmation tracks
ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;
ALTER TABLE tt_order ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid;
