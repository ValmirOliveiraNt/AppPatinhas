'use client';

import React from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { getSupabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  IdCard, 
  UserPlus, 
  Users, 
  Info, 
  LogOut, 
  PawPrint,
  Settings,
  Handshake
} from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onNavigate: (view: 'my-card' | 'register' | 'list' | 'about' | 'admin-panel' | 'partners') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, profile, loading, isAdmin, isMaster } = useSupabase();

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-bounce text-[#F59E0B]">
          <PawPrint size={48} />
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Protetor';

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] font-sans text-gray-800">
      <header className="pt-10 pb-6 px-6 text-center bg-white shadow-sm rounded-b-3xl">
        <div className="mb-4 flex justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden relative">
            <Image 
              src="/logo.png" 
              alt="Logo Patinhas de Emaús" 
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#064E3B] tracking-tight">Patinhas de Emaús</h1>
        <p className="text-[#F59E0B] font-medium text-sm mt-1 uppercase tracking-widest">Proteção Animal</p>
      </header>

      <main className="flex-grow p-6 space-y-4">
        <section className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-700">Bem-vindo(a), {displayName}</h2>
          <p className="text-sm text-gray-500">
            Portal do Protetor • {isMaster ? 'Acesso Master' : isAdmin ? 'Acesso Diretoria' : 'Acesso Colaborador'}
          </p>
        </section>

        <nav className="grid grid-cols-1 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('my-card')}
            className="w-full bg-[#F59E0B] text-white rounded-2xl p-5 flex items-center shadow-md group"
          >
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <IdCard size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg leading-tight">Minha carteirinha</span>
              <span className="block text-orange-100 text-xs">Acesse seu ID digital ou cadastre-se</span>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('partners')}
            className="w-full bg-white text-[#064E3B] border border-gray-200 rounded-2xl p-5 flex items-center shadow-sm group"
          >
            <div className="bg-emerald-50 p-3 rounded-xl mr-4">
              <Handshake size={24} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg leading-tight">Parceiros e Descontos</span>
              <span className="block text-gray-500 text-xs">Benefícios exclusivos para membros</span>
            </div>
          </motion.button>

          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('list')}
              className="w-full bg-white text-[#064E3B] border border-gray-200 rounded-2xl p-5 flex items-center shadow-sm group"
            >
              <div className="bg-[#F3F4F6] p-3 rounded-xl mr-4">
                <Users size={24} className="text-[#10B981]" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-lg leading-tight">Lista de membros</span>
                <span className="block text-gray-500 text-xs">Veja quem faz parte da família</span>
              </div>
            </motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('about')}
            className="w-full bg-white text-[#064E3B] border border-gray-200 rounded-2xl p-5 flex items-center shadow-sm group"
          >
            <div className="bg-[#F3F4F6] p-3 rounded-xl mr-4">
              <Info size={24} className="text-[#F59E0B]" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg leading-tight">Sobre o Patinhas</span>
              <span className="block text-gray-500 text-xs">Nossa missão e história</span>
            </div>
          </motion.button>

          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('admin-panel')}
              className="w-full bg-[#374151] text-white rounded-2xl p-5 flex items-center shadow-md group"
            >
              <div className="bg-white/20 p-3 rounded-xl mr-4">
                <Settings size={24} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-lg leading-tight">Painel Administrativo</span>
                <span className="block text-gray-300 text-xs">Aprovar e gerenciar membros</span>
              </div>
            </motion.button>
          )}
          <button 
            onClick={handleLogout}
            className="w-full text-gray-400 text-sm py-4 flex items-center justify-center space-x-2 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </nav>
      </main>

      <footer className="p-6 text-center text-gray-400 text-xs">
        <p>© 2024 Patinhas de Emaús. Feito com amor pelos animais.</p>
      </footer>
    </div>
  );
};
