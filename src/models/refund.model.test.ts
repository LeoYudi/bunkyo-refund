import { describe, it, expect } from 'vitest';
import { 
  RefundSchema, 
  CreateRefundSchema, 
  UpdateRefundSchema, 
  RefundStatusSchema 
} from './refund.model';

describe('Refund Models', () => {
  describe('RefundStatusSchema', () => {
    it('should allow valid status enum values', () => {
      expect(RefundStatusSchema.parse('PENDING')).toBe('PENDING');
      expect(RefundStatusSchema.parse('PROCESSING')).toBe('PROCESSING');
      expect(RefundStatusSchema.parse('APPROVED')).toBe('APPROVED');
      expect(RefundStatusSchema.parse('DENIED')).toBe('DENIED');
      expect(RefundStatusSchema.parse('SENT')).toBe('SENT');
      expect(RefundStatusSchema.parse('PAID')).toBe('PAID');
    });

    it('should reject invalid status values', () => {
      expect(RefundStatusSchema.safeParse('INVALID_STATUS').success).toBe(false);
      expect(RefundStatusSchema.safeParse('').success).toBe(false);
      expect(RefundStatusSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('CreateRefundSchema', () => {
    it('should validate a valid creation payload', () => {
      const payload = {
        requester_name: 'John Doe',
        receipt_file_url: 'https://example.com/receipt.pdf'
      };
      expect(CreateRefundSchema.safeParse(payload).success).toBe(true);
    });

    it('should require requester_name', () => {
      const payload = {
        receipt_file_url: 'https://example.com/receipt.pdf'
      };
      expect(CreateRefundSchema.safeParse(payload).success).toBe(false);
    });

    it('should reject empty or very short requester_name', () => {
      const payload = {
        requester_name: 'J',
        receipt_file_url: 'https://example.com/receipt.pdf'
      };
      expect(CreateRefundSchema.safeParse(payload).success).toBe(false);
    });

    it('should require receipt_file_url', () => {
      const payload = {
        requester_name: 'John Doe'
      };
      expect(CreateRefundSchema.safeParse(payload).success).toBe(false);
    });

    it('should reject invalid URL for receipt_file_url', () => {
      const payload = {
        requester_name: 'John Doe',
        receipt_file_url: 'not-a-url'
      };
      expect(CreateRefundSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe('UpdateRefundSchema', () => {
    it('should validate a valid update payload with AI extracted fields', () => {
      const payload = {
        status: 'PROCESSING',
        issuer_name: 'Company XYZ',
        issuer_cnpj: '12.345.678/0001-99',
        receiver_cnpj: '98765432000111',
        total_value: 150.50,
        issue_date: '2023-10-01',
        issue_number: '123456',
        description: 'Office supplies'
      };
      expect(UpdateRefundSchema.safeParse(payload).success).toBe(true);
    });

    it('should allow partial updates', () => {
      const payload = {
        status: 'APPROVED'
      };
      expect(UpdateRefundSchema.safeParse(payload).success).toBe(true);
    });

    it('should reject invalid total_value (e.g., negative value or zero)', () => {
      expect(UpdateRefundSchema.safeParse({ total_value: -10 }).success).toBe(false);
      expect(UpdateRefundSchema.safeParse({ total_value: 0 }).success).toBe(false);
    });

    it('should reject invalid CNPJ format', () => {
      expect(UpdateRefundSchema.safeParse({ issuer_cnpj: '123' }).success).toBe(false); // Too short
      expect(UpdateRefundSchema.safeParse({ issuer_cnpj: '12.345.678/0001-999' }).success).toBe(false); // Too long
      expect(UpdateRefundSchema.safeParse({ issuer_cnpj: 'invalid-cnpj-string' }).success).toBe(false); // Invalid characters
    });

    it('should reject invalid issue_date format (must be valid date string)', () => {
      expect(UpdateRefundSchema.safeParse({ issue_date: 'not-a-date' }).success).toBe(false);
    });
  });

  describe('RefundSchema', () => {
    it('should validate a complete pending refund record from the database', () => {
      const record = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        requester_name: 'Jane Doe',
        receipt_file_url: 'https://example.com/file.png',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        reviewed_by: null,
        issuer_name: null,
        issuer_cnpj: null,
        receiver_cnpj: null,
        total_value: null,
        issue_date: null,
        issue_number: null,
        description: null
      };
      expect(RefundSchema.safeParse(record).success).toBe(true);
    });
    
    it('should validate a complete approved refund record with all AI fields filled', () => {
      const record = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        requester_name: 'Jane Doe',
        receipt_file_url: 'https://example.com/file.png',
        status: 'APPROVED',
        reviewed_by: '987e6543-e21b-12d3-a456-426614174000',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        issuer_name: 'Tech Store',
        issuer_cnpj: '00.000.000/0001-00',
        receiver_cnpj: '11.111.111/0001-11',
        total_value: 200.00,
        issue_date: '2023-01-01',
        issue_number: 'NFE-1029',
        description: 'Monitor'
      };
      expect(RefundSchema.safeParse(record).success).toBe(true);
    });

    it('should reject a record missing required fields like id', () => {
      const record = {
        requester_name: 'Jane Doe',
        receipt_file_url: 'https://example.com/file.png',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      expect(RefundSchema.safeParse(record).success).toBe(false);
    });

    it('should reject invalid UUIDs for id or reviewed_by', () => {
      const record = {
        id: 'not-a-uuid',
        requester_name: 'Jane Doe',
        receipt_file_url: 'https://example.com/file.png',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      expect(RefundSchema.safeParse(record).success).toBe(false);

      const record2 = {
        ...record,
        id: '123e4567-e89b-12d3-a456-426614174000',
        reviewed_by: 'not-a-uuid'
      };
      expect(RefundSchema.safeParse(record2).success).toBe(false);
    });

    it('should reject invalid dates for created_at or updated_at', () => {
      const record = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        requester_name: 'Jane Doe',
        receipt_file_url: 'https://example.com/file.png',
        status: 'PENDING',
        created_at: 'not-a-date',
        updated_at: '2023-01-01T00:00:00.000Z'
      };
      expect(RefundSchema.safeParse(record).success).toBe(false);
    });
  });
});
