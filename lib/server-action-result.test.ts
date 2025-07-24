import { describe, it, expect, vi } from 'vitest';
import {
  success,
  error,
  validationError,
  safeServerAction,
  ERROR_CODES,
  type ServerActionResult,
  type ServerActionResultWithValidation,
} from './server-action-result';

describe('Server Action Result Utilities', () => {
  describe('success', () => {
    it('should create a success result with data', () => {
      const data = { id: 1, name: 'Test' };
      const result = success(data);
      
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('should handle null data', () => {
      const result = success(null);
      expect(result).toEqual({ success: true, data: null });
    });

    it('should handle undefined data', () => {
      const result = success(undefined);
      expect(result).toEqual({ success: true, data: undefined });
    });
  });

  describe('error', () => {
    it('should create an error result with message', () => {
      const result = error('Something went wrong');
      
      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('should create an error result with message and code', () => {
      const result = error('Unauthorized access', ERROR_CODES.UNAUTHORIZED);
      
      expect(result).toEqual({
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('validationError', () => {
    it('should create a validation error without validation errors object', () => {
      const result = validationError('Validation failed');
      
      expect(result).toEqual({
        success: false,
        error: 'Validation failed',
      });
    });

    it('should create a validation error with validation errors', () => {
      const validationErrors = {
        email: ['Email is required', 'Email must be valid'],
        password: ['Password must be at least 8 characters'],
      };
      
      const result = validationError('Validation failed', validationErrors, ERROR_CODES.VALIDATION_ERROR);
      
      expect(result).toEqual({
        success: false,
        error: 'Validation failed',
        validationErrors,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('safeServerAction', () => {
    it('should return success result when function executes successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const result = await safeServerAction(mockFn);
      
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
      });
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should return error result when function throws an Error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFn = vi.fn().mockRejectedValue(new Error('Database connection failed'));
      
      const result = await safeServerAction(mockFn);
      
      expect(result).toEqual({
        success: false,
        error: 'Database connection failed',
        code: 'UNKNOWN_ERROR',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Server action error:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should return UNAUTHORIZED error code for unauthorized errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFn = vi.fn().mockRejectedValue(new Error('Unauthorized: User not logged in'));
      
      const result = await safeServerAction(mockFn);
      
      expect(result).toEqual({
        success: false,
        error: 'You are not authorized to perform this action',
        code: 'UNAUTHORIZED',
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error thrown values', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFn = vi.fn().mockRejectedValue('String error');
      
      const result = await safeServerAction(mockFn);
      
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all expected error codes', () => {
      expect(ERROR_CODES).toEqual({
        UNAUTHORIZED: 'UNAUTHORIZED',
        NOT_FOUND: 'NOT_FOUND',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        DATABASE_ERROR: 'DATABASE_ERROR',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct types for ServerActionResult', () => {
      const successResult: ServerActionResult<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };

      const errorResult: ServerActionResult<{ id: number }> = {
        success: false,
        error: 'Failed',
      };

      expect(successResult.success).toBe(true);
      expect(errorResult.success).toBe(false);
    });

    it('should enforce correct types for ServerActionResultWithValidation', () => {
      const validationResult: ServerActionResultWithValidation<{ id: number }> = {
        success: false,
        error: 'Validation failed',
        validationErrors: { field: ['error'] },
      };

      expect(validationResult.success).toBe(false);
      expect(validationResult.validationErrors).toBeDefined();
    });
  });
});