-- TransitOps - Telemetry Schema Migration (Battery, Fuel, Accuracy)
-- Run this AFTER multitenancy_schema.sql

-- ============================================================================
-- 1. ADD NEW COLUMNS TO vehicle_location_events
-- ============================================================================

ALTER TABLE public.vehicle_location_events 
    ADD COLUMN IF NOT EXISTS fuel_level NUMERIC,
    ADD COLUMN IF NOT EXISTS battery_level NUMERIC,
    ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC;
