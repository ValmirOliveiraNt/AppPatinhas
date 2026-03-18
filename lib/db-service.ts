import { getSupabase } from './supabase';

export interface Member {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  role: string;
  birthDate: string;
  associationDate: string;
  registrationNumber: string;
  photoUrl: string;
  memberId: string;
  status: string;
  uid: string | null;
  lastPaymentDate: string | null;
  approvedByName: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  discountType: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mapSupabaseToMember = (data: any): Member => ({
  id: data.id,
  fullName: data.full_name,
  cpf: data.cpf,
  phone: data.phone,
  role: data.role,
  birthDate: data.birth_date ? data.birth_date.split('-').reverse().join('/') : '',
  associationDate: data.association_date ? data.association_date.split('-').reverse().join('/') : '',
  registrationNumber: data.registration_number,
  photoUrl: data.photo_url,
  memberId: data.member_id,
  status: data.status,
  uid: data.uid,
  lastPaymentDate: data.last_payment_date,
  approvedByName: data.approved_by_name,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapMemberToSupabase = (member: Partial<Member>) => ({
  full_name: member.fullName,
  cpf: member.cpf,
  phone: member.phone,
  role: member.role,
  birth_date: member.birthDate ? member.birthDate.split('/').reverse().join('-') : null,
  association_date: member.associationDate ? member.associationDate.split('/').reverse().join('-') : null,
  registration_number: member.registrationNumber,
  photo_url: member.photoUrl,
  member_id: member.memberId,
  status: member.status,
  uid: member.uid,
  last_payment_date: member.lastPaymentDate,
  approved_by_name: member.approvedByName,
  updated_at: new Date().toISOString(),
});

const mapSupabaseToPartner = (data: any): Partner => ({
  id: data.id,
  name: data.name,
  description: data.description,
  discountPercentage: data.discount_percentage,
  discountType: data.discount_type,
  logoUrl: data.logo_url,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapPartnerToSupabase = (partner: Partial<Partner>) => ({
  name: partner.name,
  description: partner.description,
  discount_percentage: partner.discountPercentage,
  discount_type: partner.discountType,
  logo_url: partner.logoUrl,
  updated_at: new Date().toISOString(),
});

const isNetworkError = (error: any) => {
  const errMsg = error?.message || '';
  const errName = error?.name || '';
  const errCode = error?.code || '';
  return errMsg.includes('Failed to fetch') || 
         errMsg.includes('NetworkError') ||
         errMsg.includes('network error') ||
         errName === 'TypeError' ||
         errName === 'AbortError' ||
         errCode === 'FETCH_ERROR';
};

export const dbService = {
  isSupabaseConfigured: () => !!getSupabase(),

  getMemberByUid: async (uid: string, retryCount = 0): Promise<Member | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('uid', uid)
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.members" does not exist')) {
          throw new Error('A tabela "members" não foi encontrada no banco de dados. Por favor, execute o script SQL de configuração no Supabase.');
        }
        throw error;
      }
      return data && data.length > 0 ? mapSupabaseToMember(data[0]) : null;
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.getMemberByUid(uid, retryCount + 1);
      }
      throw error;
    }
  },

  checkDuplicateCpf: async (cpf: string, retryCount = 0): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('cpf', cpf)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.checkDuplicateCpf(cpf, retryCount + 1);
      }
      throw error;
    }
  },

  saveMember: async (member: Partial<Member>, id?: string, retryCount = 0): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active Supabase session found when calling saveMember');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
      }

      if (id) {
        const { error } = await supabase
          .from('members')
          .update(mapMemberToSupabase(member))
          .eq('id', id);
        if (error) {
          console.error(`Error in saveMember (update) for id ${id}:`, error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('members')
          .insert([mapMemberToSupabase(member)]);
        if (error) {
          console.error('Error in saveMember (insert):', error);
          throw error;
        }
      }
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.saveMember(member, id, retryCount + 1);
      }
      throw error;
    }
  },

  deleteMember: async (id: string, retryCount = 0): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active Supabase session found when calling deleteMember');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
      }

      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`Error in deleteMember for id ${id}:`, error);
        throw error;
      }
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.deleteMember(id, retryCount + 1);
      }
      throw error;
    }
  },

  approveMember: async (id: string, approvedByName: string, retryCount = 0): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active Supabase session found when calling approveMember');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from('members').update({ 
        status: 'vencida', // Aprovado mas ainda não pago
        approved_by_name: approvedByName,
        updated_at: now
      }).eq('id', id);
      if (error) {
        console.error(`Error in approveMember for id ${id}:`, error);
        throw error;
      }
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.approveMember(id, approvedByName, retryCount + 1);
      }
      throw error;
    }
  },

  markAsPaid: async (id: string, adminName: string, retryCount = 0): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active Supabase session found when calling markAsPaid');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from('members').update({ 
        status: 'valida',
        last_payment_date: now,
        approved_by_name: adminName,
        updated_at: now
      }).eq('id', id);

      if (error) {
        console.error(`Error in markAsPaid for id ${id}:`, error);
        throw error;
      }
    } catch (error: any) {
      if (isNetworkError(error) && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return dbService.markAsPaid(id, adminName, retryCount + 1);
      }
      throw error;
    }
  },

  updateMemberRole: async (id: string, role: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active Supabase session found when calling updateMemberRole');
        throw new Error('Sessão expirada ou não encontrada. Por favor, faça login novamente.');
      }

      // Atualiza na tabela de membros (para a carteirinha)
      const { error: memberError } = await supabase.from('members').update({ role }).eq('id', id);
      if (memberError) {
        console.error(`Error updating member role for id ${id}:`, memberError);
        throw memberError;
      }

      // Busca o UID do membro para atualizar a tabela de perfis (permissões)
      const { data: memberData, error: fetchError } = await supabase.from('members').select('uid').eq('id', id).single();
      if (fetchError) {
        console.error(`Error fetching member UID for role update, id ${id}:`, fetchError);
      }

      if (memberData?.uid) {
        const { error: profileError } = await supabase.from('profiles').update({ role }).eq('id', memberData.uid);
        if (profileError) {
          console.warn('Aviso: Não foi possível atualizar a tabela de perfis, mas o cargo na carteirinha foi alterado.', profileError);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in updateMemberRole:', error);
      throw error;
    }
  },

  getStats: async (): Promise<{ total: number; valid: number; expired: number }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('members').select('status, last_payment_date');
    if (error) throw error;
    
    const now = new Date();
    const members = data || [];
    
    const valid = members.filter(m => {
      if (m.status !== 'valida') return false;
      if (!m.last_payment_date) return false;
      const lastPayment = new Date(m.last_payment_date);
      const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    const expired = members.filter(m => {
      if (m.status === 'vencida') return true;
      if (!m.last_payment_date) return true;
      const lastPayment = new Date(m.last_payment_date);
      const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).length;

    return {
      total: members.length,
      valid,
      expired
    };
  },

  getAllMembers: async (): Promise<Member[]> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapSupabaseToMember);
  },

  subscribeToMembers: (callback: (members: Member[]) => void) => {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const fetchAndNotify = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('full_name', { ascending: true });
      if (!error && data) {
        callback(data.map(mapSupabaseToMember));
      }
    };

    fetchAndNotify();

    const channel = supabase
      .channel('members_changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'members' }, fetchAndNotify)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Partners CRUD
  getAllPartners: async (): Promise<Partner[]> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      if (error.message.includes('relation "public.partners" does not exist')) {
        return []; // Return empty if table doesn't exist yet
      }
      throw error;
    }
    return (data || []).map(mapSupabaseToPartner);
  },

  savePartner: async (partner: Partial<Partner>, id?: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    if (id) {
      const { error } = await supabase
        .from('partners')
        .update(mapPartnerToSupabase(partner))
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('partners')
        .insert([mapPartnerToSupabase(partner)]);
      if (error) throw error;
    }
  },

  deletePartner: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribeToPartners: (callback: (partners: Partner[]) => void) => {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const fetchAndNotify = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        callback(data.map(mapSupabaseToPartner));
      }
    };

    fetchAndNotify();

    const channel = supabase
      .channel('partners_changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'partners' }, fetchAndNotify)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
