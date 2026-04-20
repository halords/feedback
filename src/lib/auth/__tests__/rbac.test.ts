import { describe, it, expect } from 'vitest';
import { resolveAuthorizedOffices, hasGlobalAccess } from '../rbac';
import type { SessionUser } from '../verifySession';

describe('RBAC Authorization Logic', () => {
  
  // -- Test Data Mocks --
  const mockSuperAdmin: SessionUser = {
    uid: 'sa-1',
    idno: 'admin001',
    username: 'admin',
    full_name: 'Super Admin User',
    email: 'admin@example.com',
    user_type: 'Super Admin',
    offices: [],
    is_analytics_enabled: true,
  };

  const mockAnalyticsAdmin: SessionUser = {
    uid: 'aa-1',
    idno: 'analyst001',
    username: 'analyst',
    full_name: 'Analytics Admin User',
    email: 'analytics@example.com',
    user_type: 'Office Admin',
    offices: ['OFFICE_A', 'OFFICE_B'],
    is_analytics_enabled: true,
  };

  const mockStandardUser: SessionUser = {
    uid: 'su-1',
    idno: 'user001',
    username: 'standard',
    full_name: 'Standard User',
    email: 'standard@example.com',
    user_type: 'Office Admin',
    offices: ['OFFICE_A'],
    is_analytics_enabled: false,
  };

  // 1. Tests for hasGlobalAccess
  describe('hasGlobalAccess', () => {
    it('returns true for superadmin user types regardless of casing', () => {
      ['Super Admin', 'superadmin', 'SUPER ADMIN'].forEach(type => {
        expect(hasGlobalAccess({ ...mockStandardUser, user_type: type as any })).toBe(true);
      });
    });

    it('returns false for standard user types', () => {
      ['Office Admin', 'Guest', 'Standard'].forEach(type => {
        expect(hasGlobalAccess({ ...mockStandardUser, user_type: type as any })).toBe(false);
      });
    });
  });

  // 2. Tests for resolveAuthorizedOffices
  describe('resolveAuthorizedOffices', () => {
    
    describe('Super Admin', () => {
      it('returns exactly the requested scope if provided', () => {
        expect(resolveAuthorizedOffices(mockSuperAdmin, ['OFFICE_Z'])).toEqual(['OFFICE_Z']);
        expect(resolveAuthorizedOffices(mockSuperAdmin, 'OFFICE_X')).toEqual(['OFFICE_X']);
      });

      it('defaults to ["ALL"] if requested scope is empty, undefined, or explicitly "ALL"', () => {
        expect(resolveAuthorizedOffices(mockSuperAdmin)).toEqual(['ALL']);
        expect(resolveAuthorizedOffices(mockSuperAdmin, [])).toEqual(['ALL']);
        expect(resolveAuthorizedOffices(mockSuperAdmin, ['ALL'])).toEqual(['ALL']);
      });
    });

    describe('Analytics User (Standard User with is_analytics_enabled = true)', () => {
      it('returns ["ALL"] if requested scope is empty or explicitly "ALL"', () => {
        expect(resolveAuthorizedOffices(mockAnalyticsAdmin)).toEqual(['ALL']);
        expect(resolveAuthorizedOffices(mockAnalyticsAdmin, [])).toEqual(['ALL']);
        expect(resolveAuthorizedOffices(mockAnalyticsAdmin, ['ALL'])).toEqual(['ALL']);
      });

      it('strictly intersects granular requests with their assigned offices', () => {
        // Requested B & Z -> Gets only B because Z is unassigned
        expect(resolveAuthorizedOffices(mockAnalyticsAdmin, ['OFFICE_B', 'OFFICE_Z'])).toEqual(['OFFICE_B']);
      });
    });

    describe('Standard User (is_analytics_enabled = false)', () => {
      it('completely ignores ["ALL"] requests and forces fall back to assigned offices only', () => {
        // The core RBAC bypass leak fix verification!
        expect(resolveAuthorizedOffices(mockStandardUser, ['ALL'])).toEqual(['OFFICE_A']);
        expect(resolveAuthorizedOffices(mockStandardUser, 'ALL')).toEqual(['OFFICE_A']);
        expect(resolveAuthorizedOffices(mockStandardUser)).toEqual(['OFFICE_A']);
        expect(resolveAuthorizedOffices(mockStandardUser, [])).toEqual(['OFFICE_A']);
      });

      it('strictly intersects granular requests with their assigned offices', () => {
        // Requested A, B -> Gets only A
        expect(resolveAuthorizedOffices(mockStandardUser, ['OFFICE_A', 'OFFICE_B'])).toEqual(['OFFICE_A']);
        // Requested X, Y -> Gets empty array (Unauthorized)
        expect(resolveAuthorizedOffices(mockStandardUser, ['OFFICE_X', 'OFFICE_Y'])).toEqual([]);
      });
    });

  });

});
