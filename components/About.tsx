'use client';

import React from 'react';
import { ArrowLeft, Heart, Shield, Info } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'motion/react';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-[#fff7ed] min-h-screen flex flex-col"
    >
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold text-[#d97706] tracking-tight">Patinhas de Emaús</h1>
        </div>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
      </header>

      <main className="pb-12">
        <section className="relative h-64 w-full overflow-hidden">
          <Image 
            alt="Grupo Patinhas de Emaús" 
            fill
            className="object-cover" 
            src="https://picsum.photos/seed/animals/800/600" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <h2 className="text-white text-3xl font-extrabold leading-tight">Transformando vidas em Emaús</h2>
          </div>
        </section>

        <section className="px-6 py-8 bg-white rounded-b-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-orange-100 rounded-lg text-[#f59e0b]">
              <Info size={20} />
            </span>
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Quem Somos</h3>
          </div>
          <p className="text-gray-600 mb-4 text-base leading-relaxed">
            O <strong className="text-[#d97706]">Patinhas de Emaús</strong> é um grupo de protetores independentes que atua há mais de dois anos no bairro de Emaús, realizando principalmente castração de gatos e ações comunitárias em prol dos animais.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            O grupo já ajudou a castrar <span className="font-bold text-[#d97706] underline">mais de 500 animais</span> e mantém suas ações através de doações, bazares e ações solidárias de quem acredita na causa animal.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4 px-6 mt-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#f59e0b]">
            <p className="text-3xl font-black text-[#d97706]">500+</p>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Castrações</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#f59e0b]">
            <p className="text-3xl font-black text-[#d97706]">2+</p>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Anos de Atuação</p>
          </div>
        </section>

        <section className="px-6 mt-10">
          <div className="bg-[#f59e0b] rounded-3xl p-6 text-center shadow-lg">
            <h4 className="text-white text-xl font-bold mb-2">Quer nos ajudar?</h4>
            <p className="text-orange-50 text-sm mb-6">Sua doação faz a diferença na vida de centenas de patinhas em nosso bairro.</p>
            <div className="flex flex-col gap-3">
              <button className="bg-white text-[#d97706] font-bold py-3 px-6 rounded-xl shadow-md active:scale-95 transition-transform">
                Fazer uma Doação
              </button>
              <button className="bg-[#d97706] text-white border border-white/30 font-bold py-3 px-6 rounded-xl active:scale-95 transition-transform">
                Ser Voluntário
              </button>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
};
