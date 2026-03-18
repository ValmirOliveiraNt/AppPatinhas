'use client';

import React from 'react';
import Image from 'next/image';
import { PawPrint, ShieldCheck, Calendar, Hash, Phone, User, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface MemberCardProps {
  onBack: () => void;
  member: {
    fullName: string;
    cpf: string;
    phone: string;
    role: string;
    birthDate: string;
    associationDate: string;
    registrationNumber: string;
    photoUrl?: string;
    memberId: string;
    status?: string;
    lastPaymentDate?: string;
    approvedByName?: string | null;
  };
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onBack }) => {
  const currentYear = new Date().getFullYear();
  const verifyUrl = `https://patinhas-emaus.app/verify/${member.memberId}`;

  // Lógica de Pagamento / Status
  const validityInfo = React.useMemo(() => {
    if (!member.lastPaymentDate) return { isExpired: true, from: null, to: null };
    
    const lastPayment = new Date(member.lastPaymentDate);
    const validUntil = new Date(lastPayment);
    validUntil.setDate(validUntil.getDate() + 30);
    
    const now = new Date();
    const isExpired = now > validUntil;
    
    return {
      isExpired,
      from: lastPayment.toLocaleDateString('pt-BR'),
      to: validUntil.toLocaleDateString('pt-BR')
    };
  }, [member.lastPaymentDate]);

  const effectiveStatus = (member.status === 'valida' && !validityInfo.isExpired) ? 'valida' : 'vencida';

  const isApproved = member.status !== 'pendente';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-[380px] h-[620px] bg-[#042F2E] rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative flex flex-col font-sans border border-white/10"
      id="member-card"
    >
      {/* Premium Background Textures */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#059669_0%,transparent_70%)]"></div>
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#F59E0B] rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#10B981] rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Status Ribbon */}
      <div className={`absolute top-8 -right-12 rotate-45 w-48 py-1.5 text-center z-50 shadow-lg border-y border-white/20 ${
        effectiveStatus === 'valida' ? 'bg-emerald-500' : 'bg-red-600'
      }`}>
        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
          {effectiveStatus === 'valida' ? 'VÁLIDA' : 'VENCIDA'}
        </span>
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/10 transition-all active:scale-90"
      >
        <ArrowLeft size={20} />
      </button>
      
      {/* Header: Identity & Logo */}
      <div className="relative z-10 pt-10 pb-6 px-8 flex flex-col items-center">
        <div className="flex items-center gap-4 w-full">
          <div className="bg-white p-1.5 rounded-2xl shadow-2xl w-14 h-14 flex items-center justify-center relative ring-4 ring-white/5">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill
              className="object-contain p-1"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-white font-black text-xl tracking-tight leading-none uppercase">Patinhas de Emaús</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="h-[2px] w-4 bg-[#F59E0B]"></span>
              <p className="text-[#F59E0B] text-[9px] font-black uppercase tracking-[0.25em]">Membro Oficial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-grow px-8 flex flex-col">
        {/* Profile & QR Row */}
        <div className="flex justify-between items-start mb-8">
          <div className="relative group">
            <div className="w-36 h-44 rounded-[2rem] border-2 border-white/20 overflow-hidden bg-white/5 shadow-2xl relative ring-8 ring-white/5">
              {member.photoUrl ? (
                <Image 
                  src={member.photoUrl} 
                  alt={member.fullName} 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={56} className="text-white/10" />
                </div>
              )}
            </div>
            <div className={`absolute -bottom-4 -left-2 px-4 py-1.5 rounded-full text-[9px] font-black border-2 shadow-xl flex items-center gap-1.5 ${
              isApproved 
                ? 'bg-white text-[#042F2E] border-[#042F2E]' 
                : 'bg-amber-500 text-white border-white'
            }`}>
              {isApproved ? (
                <>
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>AUTENTICADO</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span>AGUARDANDO APROVAÇÃO</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="p-2.5 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/20 ring-4 ring-white/5">
              <QRCodeSVG value={verifyUrl} size={80} level="H" includeMargin={false} />
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Expiração</p>
              <p className={`font-mono text-sm font-black tracking-tighter ${effectiveStatus === 'valida' ? 'text-emerald-400' : 'text-red-400'}`}>
                {validityInfo.to || '-- / -- / --'}
              </p>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="space-y-5">
          {/* Full Name */}
          <div className="relative">
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
              <User size={12} className="text-[#F59E0B]" /> Identificação do Membro
            </p>
            <p className="text-white text-2xl font-black leading-none tracking-tight break-words">{member.fullName}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* CPF */}
            <div>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Documento CPF</p>
              <p className="text-white text-sm font-bold font-mono tracking-wider">{member.cpf}</p>
            </div>
            {/* Matrícula */}
            <div>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Nº Matrícula</p>
              <p className="text-[#F59E0B] text-sm font-black font-mono tracking-widest">{member.registrationNumber}</p>
            </div>
            {/* Telefone */}
            <div>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Contato</p>
              <p className="text-white text-sm font-bold">{member.phone}</p>
            </div>
            {/* Cargo */}
            <div>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Cargo / Função</p>
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest truncate">{member.role}</p>
            </div>
          </div>

          {/* Validity Period Box */}
          <div className="bg-white/5 rounded-3xl p-4 border border-white/10 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#F59E0B]"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#F59E0B] text-[8px] font-black uppercase tracking-[0.3em] mb-2">Período de Atividade</p>
                {validityInfo.from ? (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-white/40 text-[7px] uppercase font-bold">Início</p>
                      <p className="text-white text-xs font-black">{validityInfo.from}</p>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div className="text-center">
                      <p className="text-white/40 text-[7px] uppercase font-bold">Fim</p>
                      <p className="text-white text-xs font-black">{validityInfo.to}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40 text-[10px] font-bold italic">Aguardando Validação Financeira</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[7px] uppercase font-bold mb-1">Associação</p>
                <p className="text-white text-[10px] font-bold">{member.associationDate}</p>
              </div>
            </div>
            
            {member.approvedByName && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[8px] text-emerald-400 font-black uppercase tracking-tighter">Liberado por: {member.approvedByName}</p>
                </div>
                <p className="text-white/20 text-[7px] font-mono">ID: {member.memberId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative z-10 bg-black/40 backdrop-blur-xl px-8 py-5 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-[#F59E0B]" />
          </div>
          <div>
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] block">Documento Digital</span>
            <span className="text-white/40 text-[7px] font-bold uppercase tracking-widest">Válido em todo território nacional</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <PawPrint size={14} className="text-white/10" fill="currentColor" />
          <PawPrint size={14} className="text-white/20" fill="currentColor" />
          <PawPrint size={14} className="text-white/10" fill="currentColor" />
        </div>
      </div>
    </motion.div>
  );
};



