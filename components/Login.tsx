'use client';

import React, { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Image from 'next/image';
import { PawPrint, Heart, ShieldCheck, Info, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleGoogleLogin = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Falha ao entrar com Google. Tente novamente.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);
    setShowResend(false);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Se o cadastro foi bem sucedido e o usuário já está logado (confirmação desativada)
        if (data.user) {
          setError(null);
        } else {
          setError('Cadastro realizado! Agora você pode entrar com seu e-mail e senha.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          const isMasterEmail = email.toLowerCase().trim() === 'valmiroliveirant@gmail.com';
          
          if (error.message === 'Invalid login credentials') {
            throw new Error(
              isMasterEmail 
                ? 'E-mail ou senha incorretos. Se este é seu primeiro acesso como Master, você deve primeiro clicar em "Solicitar Cadastro" abaixo para criar sua senha master.'
                : 'E-mail ou senha incorretos. Verifique seus dados ou clique em "Solicitar Cadastro" se ainda não tiver uma conta.'
            );
          }
          
          if (error.message.includes('Email not confirmed')) {
            setShowResend(true);
            throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou clique no botão abaixo para reenviar o e-mail de confirmação.');
          }
          
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const supabase = getSupabase();
    if (!supabase || !email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
      setError('E-mail de confirmação reenviado! Verifique sua caixa de entrada.');
      setShowResend(false);
    } catch (err: any) {
      setError('Erro ao reenviar confirmação: ' + (err.message || 'Tente novamente mais tarde.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    if (!email) {
      setError('Digite seu e-mail para recuperar a senha.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      setError(null);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setError('Erro ao enviar e-mail de recuperação.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
        <PawPrint className="absolute top-10 left-10 rotate-12" size={120} />
        <PawPrint className="absolute bottom-20 right-10 -rotate-12" size={160} />
        <PawPrint className="absolute top-1/2 left-1/4 rotate-45" size={80} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 p-8 relative z-10 border border-emerald-50"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-50 overflow-hidden mb-4 relative">
            <Image 
              src="/logo.png" 
              alt="Logo Patinhas de Emaús" 
              fill
              className="object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#064E3B] tracking-tight text-center">
            Patinhas de Emaús
          </h1>
          <p className="text-[#F59E0B] font-semibold text-[10px] uppercase tracking-[0.2em] mt-1">
            Portal do Protetor
          </p>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col space-y-2 text-red-600 text-sm"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle size={18} />
                <div className="flex-grow">
                  <span>{error}</span>
                </div>
              </div>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-xs font-bold text-red-700 hover:underline mt-1 self-start ml-7"
                >
                  Reenviar e-mail de confirmação
                </button>
              )}
            </motion.div>
          )}
          {resetSent && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2 text-emerald-600 text-sm"
            >
              <ShieldCheck size={18} />
              <span>E-mail de recuperação enviado!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        {!isSignUp && email === 'valmiroliveirant@gmail.com' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 text-[10px] leading-tight">
            <strong>Nota para Master:</strong> Se este é seu primeiro acesso, clique em <strong>Solicitar Cadastro</strong> abaixo para criar sua senha master.
          </div>
        )}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Senha</label>
              {!isSignUp && (
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#064E3B] text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-4 text-gray-400 tracking-widest">Ou continue com</span>
          </div>
        </div>

        {/* Google Login */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white hover:bg-gray-50 text-gray-600 font-semibold py-3.5 px-6 rounded-2xl shadow-sm flex items-center justify-center space-x-3 border border-gray-200 transition-all"
        >
          <Image 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            width={20}
            height={20}
            referrerPolicy="no-referrer"
          />
          <span>Google</span>
        </motion.button>

        {/* Toggle Login/SignUp */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}
          </p>
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#10B981] font-bold text-sm hover:underline mt-1"
          >
            {isSignUp ? 'Fazer Login' : 'Solicitar Cadastro'}
          </button>
        </div>
      </motion.div>

      {/* Footer Features */}
      <div className="mt-8 grid grid-cols-3 gap-8 opacity-40">
        <div className="flex flex-col items-center space-y-1">
          <ShieldCheck size={20} className="text-gray-400" />
          <span className="text-[8px] uppercase tracking-wider font-bold">Seguro</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <Heart size={20} className="text-gray-400" />
          <span className="text-[8px] uppercase tracking-wider font-bold">Amor</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <Info size={20} className="text-gray-400" />
          <span className="text-[8px] uppercase tracking-wider font-bold">Suporte</span>
        </div>
      </div>

      <footer className="mt-auto py-6 text-gray-300 text-[9px] uppercase tracking-[0.2em]">
        © 2024 Patinhas de Emaús
      </footer>
    </div>
  );
};
