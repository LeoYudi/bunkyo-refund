import { z } from 'zod';
import { CreateRefundSchema } from '@/models/refund.model';
import { Database } from '@/models/database.types';
import { createClient } from '@/lib/supabase/server';

export type RefundRequest = Database['public']['Tables']['refund_requests']['Row'];

export class RefundRepository {
  constructor(private supabaseClient?: any) {}

  private async getClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return await createClient();
  }

  async create(data: z.infer<typeof CreateRefundSchema>): Promise<RefundRequest> {
    const supabase = await this.getClient();
    const { data: created, error } = await supabase
      .from('refund_requests')
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || JSON.stringify(error));
    }

    return created;
  }

  async findById(id: string): Promise<RefundRequest | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || JSON.stringify(error));
    }

    return data;
  }

  async updateStatus(
    id: string,
    status: Database['public']['Enums']['refund_status']
  ): Promise<RefundRequest> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('refund_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || JSON.stringify(error));
    }

    return data;
  }
}
