'use client';

import React, { useEffect, useState } from 'react';
import { dbService, Member } from '@/lib/db-service';
import { getSupabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  ShieldAlert,
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit2,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSupabase } from './SupabaseProvider';
import Image from 'next/image';

interface AdminPanelProps {
  onBack: () => void;
  onEditMember: (member: any) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onEditMember }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'valida' | 'vencida'>('all');
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'delete' | 'markPaid' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<{ full_name: string } | null>(null);
  const { isMaster, isAdmin, user } = useSupabase();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (user) {
        const { data } = await getSupabase()!
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data) setAdminProfile(data);
      }
    };
    fetchAdminProfile();
  }, [user]);

  const loadData = React.useCallback(async () => {
    try {
      const data = await dbService.getAllMembers();
      setMembers(data);
      const total = data.length;
      
      const now = new Date();
      const emDia = data.filter(m => {
        if (m.status === 'vencida') return false;
        if (!m.lastPaymentDate) return false;
        const lastPayment = new Date(m.lastPaymentDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length;

      const vencidas = data.filter(m => {
        if (m.status === 'vencida') return true;
        if (!m.lastPaymentDate) return true;
        const lastPayment = new Date(m.lastPaymentDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      }).length;

      setStats({ total, valid: emDia, expired: vencidas });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribeToMembers((data) => {
      setMembers(data);
      const total = data.length;
      
      const now = new Date();
      const emDia = data.filter(m => {
        if (m.status === 'vencida') return false;
        if (!m.lastPaymentDate) return false;
        const lastPayment = new Date(m.lastPaymentDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length;

      const vencidas = data.filter(m => {
        if (m.status === 'vencida') return true;
        if (!m.lastPaymentDate) return true;
        const lastPayment = new Date(m.lastPaymentDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      }).length;

      setStats({ total, valid: emDia, expired: vencidas });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadData]);

  const handleMarkPaid = async (id: string) => {
    const originalMembers = [...members];
    const originalStats = { ...stats };
    const adminName = adminProfile?.full_name || 'Administrador';
    
    // Atualização otimista
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'valida', lastPaymentDate: new Date().toISOString(), approvedByName: adminName } : m));
    
    // Recalcula stats para o feedback otimista
    const member = members.find(m => m.id === id);
    if (member) {
      const lastPayment = member.lastPaymentDate ? new Date(member.lastPaymentDate) : null;
      const wasExpired = member.status === 'vencida' || member.status === 'pendente' || !lastPayment || Math.ceil(Math.abs(new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) > 30;
      
      if (wasExpired) {
        setStats(prev => ({
          ...prev,
          valid: prev.valid + 1,
          expired: Math.max(0, prev.expired - 1)
        }));
      }
    }

    try {
      await dbService.markAsPaid(id, adminName);
      setConfirmAction(null);
      setError(null);
      await loadData();
    } catch (error: any) {
      setMembers(originalMembers);
      setStats(originalStats);
      console.error('Error marking as paid:', error);
      setError(`Erro ao confirmar pagamento: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleApproveRegistration = async (id: string) => {
    const originalMembers = [...members];
    const adminName = adminProfile?.full_name || 'Administrador';
    
    // Atualização otimista
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'vencida', approvedByName: adminName } : m));

    try {
      await dbService.approveMember(id, adminName);
      setError(null);
      await loadData();
    } catch (error: any) {
      setMembers(originalMembers);
      console.error('Error approving registration:', error);
      setError(`Erro ao aprovar cadastro: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    const originalMembers = [...members];
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));

    try {
      await dbService.updateMemberRole(id, newRole);
      setError(null);
      await loadData();
    } catch (error: any) {
      setMembers(originalMembers);
      console.error('Error updating role:', error);
      setError(`Erro ao atualizar cargo: ${error?.message || 'Erro desconhecido'}`);
      
      // Log full error object for debugging
      try {
        console.error('Detailed error info:', JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))));
      } catch (e) {
        console.error('Could not stringify error:', error);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Nome', 'CPF', 'Telefone', 'Cargo', 'Status', 'Ultimo Pagamento'];
    const rows = members.map(m => {
      const lastPayment = m.lastPaymentDate ? new Date(m.lastPaymentDate) : null;
      const isExpired = !lastPayment || Math.ceil(Math.abs(new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) > 30;
      const statusText = !isExpired ? 'Válida' : 'Vencida';
      const dateText = lastPayment ? lastPayment.toLocaleDateString('pt-BR') : 'Nunca';

      return [
        m.memberId,
        m.fullName,
        m.cpf,
        m.phone,
        m.role,
        statusText,
        dateText
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `membros_patinhas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    const originalMembers = [...members];
    const originalStats = { ...stats };
    
    setMembers(prev => prev.filter(m => m.id !== id));
    const deletedMember = members.find(m => m.id === id);
    if (deletedMember) {
      const lastPayment = deletedMember.lastPaymentDate ? new Date(deletedMember.lastPaymentDate) : null;
      const isExpired = !lastPayment || Math.ceil(Math.abs(new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) > 30;
      
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        valid: !isExpired ? Math.max(0, prev.valid - 1) : prev.valid,
        expired: isExpired ? Math.max(0, prev.expired - 1) : prev.expired
      }));
    }

    try {
      await dbService.deleteMember(id);
      setConfirmAction(null);
      setError(null);
      await loadData();
    } catch (error: any) {
      setMembers(originalMembers);
      setStats(originalStats);
      console.error('Error deleting member:', error);
      setError(`Erro ao excluir membro: ${error?.message || 'Erro desconhecido'}`);
      
      // Log full error object for debugging
      try {
        console.error('Detailed error info:', JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))));
      } catch (e) {
        console.error('Could not stringify error:', error);
      }
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const lastPayment = m.lastPaymentDate ? new Date(m.lastPaymentDate) : null;
    const isExpired = m.status === 'vencida' || m.status === 'pendente' || !lastPayment || Math.ceil(Math.abs(new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) > 30;

    let matchesFilter = true;
    if (filter === 'valida') {
      matchesFilter = !isExpired && m.status !== 'pendente';
    } else if (filter === 'vencida') {
      matchesFilter = isExpired || m.status === 'pendente';
    }
    
    return matchesSearch && matchesFilter;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-xs w-full border border-red-50"
        >
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight leading-none">Acesso Negado</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">Apenas Diretores ou Master podem acessar este painel.</p>
          <button 
            onClick={onBack} 
            className="w-full bg-[#064E3B] text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>VOLTAR AO INÍCIO</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white p-6 shadow-sm sticky top-0 z-20">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex justify-between items-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">X</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-blue-600" />
              <TrendingUp size={16} className="text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-900">{stats.total}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Membros</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900">{stats.valid}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Carteirinha Válida</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between mb-2">
              <UserX size={20} className="text-red-600" />
            </div>
            <p className="text-2xl font-black text-red-900">{stats.expired}</p>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Vencidas</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou ID..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#064E3B]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'valida', 'vencida'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f 
                    ? 'bg-[#064E3B] text-white shadow-md' 
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'valida' ? 'Válida' : 'Vencidas'}
              </button>
            ))}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1"
            >
              <TrendingUp size={14} />
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin mb-4">
              <Clock size={40} />
            </div>
            <p>Carregando dados...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum membro encontrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const lastPayment = member.lastPaymentDate ? new Date(member.lastPaymentDate) : null;
            const isExpired = member.status === 'vencida' || !lastPayment || Math.ceil(Math.abs(new Date().getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)) > 30;
            
            return (
              <motion.div 
                layout
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  {member.photoUrl ? (
                    <Image 
                      src={member.photoUrl} 
                      alt={member.fullName} 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 leading-tight truncate">{member.fullName}</h3>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase border ${
                      member.status === 'pendente' 
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : !isExpired 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {member.status === 'pendente' ? 'Pendente' : !isExpired ? 'Válida' : 'Vencida'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">{member.memberId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[8px] text-gray-400 uppercase font-bold">Último Pix:</p>
                    <p className="text-[9px] text-gray-600 font-bold">{member.lastPaymentDate ? new Date(member.lastPaymentDate).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                  </div>
                  {member.approvedByName && (
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] text-gray-400 uppercase font-bold">Liberado por:</p>
                      <p className="text-[9px] text-emerald-600 font-bold">{member.approvedByName}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {member.status === 'pendente' && (
                    <button 
                      onClick={() => handleApproveRegistration(member.id)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Aprovar Cadastro"
                    >
                      <UserCheck size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => setConfirmAction({ id: member.id, type: 'markPaid' })}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Confirmar Pagamento Pix"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button 
                    onClick={() => onEditMember(member)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => setConfirmAction({ id: member.id, type: 'delete' })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl text-center"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                confirmAction.type === 'delete' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {confirmAction.type === 'delete' ? <Trash2 size={40} /> : <CheckCircle2 size={40} />}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {confirmAction.type === 'delete' ? 'Excluir Membro?' : 'Confirmar Pagamento?'}
              </h3>
              <p className="text-sm text-gray-500 mb-8">
                {confirmAction.type === 'delete' 
                  ? 'Esta ação é permanente e não poderá ser desfeita.' 
                  : 'Isso renovará a validade da carteirinha por mais 30 dias.'}
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => {
                    if (confirmAction.type === 'delete') handleDelete(confirmAction.id);
                    else handleMarkPaid(confirmAction.id);
                  }}
                  className={`w-full py-4 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 ${
                    confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'SIM, EXCLUIR' : 'SIM, CONFIRMAR'}
                </button>
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
