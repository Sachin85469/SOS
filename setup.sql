-- Run this script to set up the database
-- Command: psql -U postgres -f setup.sql

-- Create database
CREATE DATABASE visitordb;

-- Connect to database
\c visitordb;

-- Create visitors table with all columns including the new 'note' column
-- Feature: Visit Notes/Labels — 'note' stores an optional short label per visit
CREATE TABLE IF NOT EXISTS visitors (
  id         SERIAL PRIMARY KEY,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  note       VARCHAR(100)   -- Optional label, e.g. "Friend demo" or "Laptop test"
);

-- If you already ran the old setup.sql and your table exists without 'note',
-- run this line manually to add the column to the existing table:
-- ALTER TABLE visitors ADD COLUMN IF NOT EXISTS note VARCHAR(100);

-- Verify
SELECT 'Database setup complete!' AS status;
