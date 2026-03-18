'use client';

import React, { useEffect, useState } from 'react';
import { dbService, Partner } from '@/lib/db-service';
import { ArrowLeft, Plus, Search, Edit2, Trash2, ExternalLink, Handshake } from 'lucide-react';
import { motion } from 'motion/react';
import { useSupabase } from './SupabaseProvider';
import Image from 'next/image';

interface PartnerListProps {
  onBack: () => void;
  onEditPartner: (partner: Partner | null) => void;
  onSelectPartner: (partner: Partner) => void;
}

export const PartnerList: React.FC<PartnerListProps> = ({ onBack, onEditPartner, onSelectPartner }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { isAdmin, isMaster } = useSupabase();

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await dbService.getAllPartners();
        setPartners(data);
      } catch (error) {
        console.error('Error loading partners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPartners();
    const unsubscribe = dbService.subscribeToPartners((data) => {
      setPartners(data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await dbService.deletePartner(id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col"
    >
      <header className="bg-gradient-to-br from-[#064E3B] to-[#10B981] p-6 text-white rounded-b-[2rem] shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Parceiros</h1>
          </div>
          {isAdmin && (
            <button 
              onClick={() => onEditPartner(null)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              title="Adicionar Parceiro"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
          <input 
            type="text"
            placeholder="Buscar parceiros..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 border-none rounded-xl text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-grow p-4 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando parceiros...</div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum parceiro encontrado.</div>
        ) : (
          filteredPartners.map((partner) => (
            <motion.div 
              key={partner.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPartner(partner)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-gray-100">
                {partner.logoUrl ? (
                  <Image 
                    src={partner.logoUrl} 
                    alt={partner.name} 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Handshake size={32} className="text-gray-300" />
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-800 leading-tight">{partner.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{partner.description}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {partner.discountPercentage}% OFF
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                    {partner.discountType}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {isAdmin && (
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPartner(partner);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(partner.id);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <ExternalLink size={16} className="text-gray-300" />
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Delete Confirmation Modal */}
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
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir Parceiro?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação removerá o parceiro permanentemente da lista.</p>
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
