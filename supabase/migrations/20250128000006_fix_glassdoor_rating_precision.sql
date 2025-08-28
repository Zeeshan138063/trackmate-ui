-- Fix Glassdoor Rating Precision
-- This migration fixes the numeric field overflow issue for glassdoor_rating

-- Change glassdoor_rating from DECIMAL(2,1) to DECIMAL(3,1)
-- This allows values from -99.9 to 99.9 instead of -9.9 to 9.9
-- Glassdoor ratings are typically 1.0 to 5.0, so this provides plenty of room

ALTER TABLE dream_companies 
ALTER COLUMN glassdoor_rating TYPE DECIMAL(3,1);
