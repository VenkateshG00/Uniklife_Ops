-- Add category column to event_payments for expense tracking
ALTER TABLE event_payments
  ADD COLUMN IF NOT EXISTS category TEXT;
