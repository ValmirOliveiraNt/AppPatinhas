'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { dbService, Member } from '@/lib/db-service';
import { Users, ArrowLeft, Search, Edit2, Trash2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useSupabase } from './SupabaseProvider';

interface MemberListProps {
  onBack: () => void;
  onSelectMember: (member: any) => void;
  onEditMember: (member: any) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ onBack, onSelectMember, onEditMember }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { isAdmin } = useSupabase();

  const loadData = React.useCallback(async () => {
    try {
      const data = await dbService.getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribeToMembers((membersData) => {
      setMembers(membersData);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadData]);

  const handleDelete = async (memberId: string) => {
    const originalMembers = [...members];
    setMembers(prev => prev.filter(m => m.id !== memberId));

    try {
      await dbService.deleteMember(memberId);
      setConfirmDeleteId(null);
      await loadData(); // Forçar atualização imediata
    } catch (error: any) {
      setMembers(originalMembers);
      console.error('Error deleting member:', error);
      // Log full error object for debugging
      try {
        console.error('Detailed error info:', JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))));
      } catch (e) {
        console.error('Could not stringify error:', error);
      }
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, member: any) => {
    e.stopPropagation();
    onEditMember(member);
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.registrationNumber && m.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para visualizar a lista de membros.</p>
          <button onClick={onBack} className="bg-[#064E3B] text-white px-6 py-2 rounded-xl font-bold">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col"
    >
      <header className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Lista de Membros</h1>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome ou ID..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#10B981]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-grow p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando membros...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum membro encontrado.</div>
        ) : (
          filteredMembers.map((member) => (
            <motion.div 
              key={member.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectMember(member)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer relative group"
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
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 leading-tight">{member.fullName}</h3>
                    {member.status === 'valida' ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-200">
                        Válida
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-red-200">
                        Vencida
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 uppercase font-medium">{member.role}</p>
                </div>
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => handleEdit(e, member)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(member.id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div className="text-right ml-2">
                  <span className="text-[10px] font-mono font-bold text-[#10B981]">{member.memberId}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir Membro?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita. O registro será removido permanentemente.</p>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => handleDelete(confirmDeleteId)}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                SIM, EXCLUIR
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
