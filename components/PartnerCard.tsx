'use client';

import React, { useEffect, useState } from 'react';
import { Partner, Member, dbService } from '@/lib/db-service';
import { ArrowLeft, ShieldCheck, ShieldAlert, Clock, Handshake, Tag, Percent, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useSupabase } from './SupabaseProvider';
import Image from 'next/image';

interface PartnerCardProps {
  partner: Partner;
  onBack: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onBack }) => {
  const { user } = useSupabase();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMember = async () => {
      if (user) {
        try {
          const data = await dbService.getMemberByUid(user.id);
          setMember(data);
        } catch (error) {
          console.error('Error loading member:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadMember();
  }, [user]);

  const isCardValid = () => {
    if (!member) return false;
    if (member.status !== 'valida') return false;
    if (!member.lastPaymentDate) return false;
    
    const now = new Date();
    const lastPayment = new Date(member.lastPaymentDate);
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const isValid = isCardValid();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white min-h-screen flex flex-col"
    >
      <header className="bg-white p-6 sticky top-0 z-10 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Detalhes do Parceiro</h1>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      <main className="flex-grow p-6 space-y-8">
        {/* Partner Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center relative overflow-hidden border border-gray-100 shadow-sm">
            {partner.logoUrl ? (
              <Image 
                src={partner.logoUrl} 
                alt={partner.name} 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Handshake size={48} className="text-gray-300" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{partner.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{partner.description}</p>
          </div>
        </div>

        {/* Discount Badge */}
        <div className="bg-emerald-50 rounded-3xl p-6 flex items-center justify-between border border-emerald-100">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <Percent size={24} />
            </div>
            <div>
              <span className="block text-emerald-900 font-black text-2xl leading-none">{partner.discountPercentage}% OFF</span>
              <span className="block text-emerald-700 text-xs font-medium uppercase tracking-wider mt-1">{partner.discountType}</span>
            </div>
          </div>
          <Tag className="text-emerald-200" size={32} />
        </div>

        {/* Validation Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <Info size={14} /> Status da sua Carteirinha
          </h3>
          
          {loading ? (
            <div className="bg-gray-50 p-6 rounded-3xl animate-pulse flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
              <div className="space-y-2 flex-grow">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ) : member ? (
            <div className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all shadow-xl ${
              isValid 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200' 
                : 'bg-red-500 border-red-400 text-white shadow-red-200'
            }`}>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  {isValid ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                </div>
                <div>
                  <span className="block font-black text-2xl leading-none uppercase tracking-tighter">
                    {isValid ? 'VÁLIDA' : 'VENCIDA'}
                  </span>
                  <span className="block text-white/80 text-xs font-medium mt-1">
                    {isValid ? 'Apresente para obter desconto' : 'Regularize sua anuidade'}
                  </span>
                </div>
              </div>
              <div className="opacity-20">
                {isValid ? <ShieldCheck size={48} /> : <ShieldAlert size={48} />}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-amber-900 flex items-center space-x-4">
              <Info className="text-amber-500" size={32} />
              <div>
                <span className="block font-bold">Sem Carteirinha</span>
                <span className="block text-xs opacity-80">Você precisa cadastrar sua carteirinha primeiro.</span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-[#DAA520]" /> Como utilizar?
          </h4>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Vá até o estabelecimento parceiro.</li>
            <li>Abra esta tela e mostre ao atendente.</li>
            <li>O atendente verificará se o status está <span className="text-emerald-600 font-bold">VÁLIDA</span>.</li>
            <li>Pronto! Seu desconto será aplicado na hora.</li>
          </ol>
        </div>
      </main>
    </motion.div>
  );
};
