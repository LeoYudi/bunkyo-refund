import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefundRepository } from './refund.repository';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn(),
  };
});

describe('RefundRepository', () => {
  let repository: RefundRepository;

  beforeEach(() => {
    repository = new RefundRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new refund request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            requester_name: 'John Doe',
            receipt_file_url: 'https://example.com/receipt.pdf',
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      const result = await repository.create({
        requester_name: 'John Doe',
        receipt_file_url: 'https://example.com/receipt.pdf',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.requester_name).toBe('John Doe');
      expect(result.status).toBe('PENDING');
      
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('refund_requests');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        requester_name: 'John Doe',
        receipt_file_url: 'https://example.com/receipt.pdf',
      });
    });

    it('should throw an error when supabase returns an error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Supabase error'),
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      await expect(repository.create({
        requester_name: 'John Doe',
        receipt_file_url: 'https://example.com/receipt.pdf',
      })).rejects.toThrow('Supabase error');
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a refund request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            requester_name: 'John Doe',
            receipt_file_url: 'https://example.com/receipt.pdf',
            status: 'APPROVED',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      const result = await repository.updateStatus('123e4567-e89b-12d3-a456-426614174000', 'APPROVED');

      expect(result).toBeDefined();
      expect(result.status).toBe('APPROVED');
      
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('refund_requests');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'APPROVED' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw an error when supabase returns an error on update', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Update error'),
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      await expect(repository.updateStatus('123', 'APPROVED')).rejects.toThrow('Update error');
    });
  });

  describe('findById', () => {
    it('should fetch a refund request by id', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            requester_name: 'John Doe',
            receipt_file_url: 'https://example.com/receipt.pdf',
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: null,
            issue_date: null,
            issue_number: null,
            issuer_cnpj: null,
            issuer_name: null,
            receiver_cnpj: null,
            reviewed_by: null,
            total_value: null,
          },
          error: null,
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      const result = await repository.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeDefined();
      expect(result?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('refund_requests');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return null if refund request is not found', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST116',
            details: 'The result contains 0 rows',
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned'
          },
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw an error if supabase returns an error other than PGRST116', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'SOME_OTHER_ERROR',
            message: 'Database connection failed',
          },
        }),
      };
      
      (createClient as any).mockResolvedValue(mockSupabase);

      await expect(repository.findById('123')).rejects.toThrow('Database connection failed');
    });
  });
});
