/**
 * Guards against a sourced .env.local leaking DB_DRIVER=pg / DATABASE_URL
 * into vitest. The live banner's "Out of credits ×89" rows were test fixtures
 * written into the dev Postgres this way.
 */
import { describe, it, expect } from 'vitest';
import { getDbDriver, resetDbDriver } from '@/lib/db-driver';

const LIVE_PG = /localhost:5434\/wind|127\.0\.0\.1:5434\/wind/;

describe('test db isolation', () => {
  it('does not inherit a live Postgres DATABASE_URL', () => {
    expect(process.env.DATABASE_URL || '').not.toMatch(LIVE_PG);
  });

  it('default driver during a test run is sqlite, not pg', () => {
    resetDbDriver();
    expect(getDbDriver().dialect).toBe('sqlite');
  });

  it('factory can still select pg when a test asks, but the live URL stays gone', () => {
    process.env.DB_DRIVER = 'pg';
    resetDbDriver();
    expect(getDbDriver().dialect).toBe('postgres');
    expect(process.env.DATABASE_URL || '').not.toMatch(LIVE_PG);
    delete process.env.DB_DRIVER;
    resetDbDriver();
  });
});
