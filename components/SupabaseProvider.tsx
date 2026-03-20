'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
}

interface SupabaseContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  hasProfile: boolean;
  dbReady: boolean;
  connectionError: boolean;
  configError: boolean;
  retryConnection: () => void;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isMaster: false,
  hasProfile: true, // Assume true initially to avoid flicker
  dbReady: true,
  connectionError: false,
  configError: false,
  retryConnection: () => {},
  refreshProfile: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [dbReady, setDbReady] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const checkAdminStatus = useCallback(async (userId: string, retryCount = 0) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setConnectionError(true);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setConfigError(true);
      return;
    }

    try {
      setConnectionError(false);
      setConfigError(false);
      
      // Timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      clearTimeout(timeoutId);

      if (error) {
        // Se a tabela não existe, marca como não pronta
        if (error.message?.includes('relation "public.profiles" does not exist')) {
          setDbReady(false);
          return;
        }
        
        // Se der erro de recursão ou perfil não encontrado, assume colaborador e não trava
        if (error.message?.includes('infinite recursion') || error.code === 'PGRST116') {
          console.warn('Aviso: Erro de permissão ou perfil não encontrado. Usando nível básico.');
          setIsAdmin(false);
          setIsMaster(false);
          setProfile(null);
          return;
        }
        throw error;
      }

      setDbReady(true);
      if (data) {
        setProfile(data);
        const userRole = data.role;
        setIsMaster(userRole === 'master' || userRole === 'admin');
        setIsAdmin(userRole === 'diretoria' || userRole === 'master' || userRole === 'admin');
      }

      // Também verifica se tem perfil de membro
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('uid', userId)
        .maybeSingle();
      
      setHasProfile(!!memberData);
    } catch (err: any) {
      const errName = err.name || '';
      const errMsg = err.message || '';
      const errCode = err.code || '';
      
      const isNetworkError = errMsg.includes('Failed to fetch') || 
                             errMsg.includes('NetworkError') ||
                             errMsg.includes('network error') ||
                             errName === 'TypeError' ||
                             errName === 'AbortError' ||
                             errCode === 'FETCH_ERROR';

      if (isNetworkError && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1500;
        console.warn(`Erro de rede ao verificar permissões (Tentativa ${retryCount + 1}/3). Tentando novamente em ${delay/1000}s...`);
        setTimeout(() => checkAdminStatus(userId, retryCount + 1), delay);
        return;
      }

      console.error('Erro persistente ao verificar permissões:', err);
      
      if (isNetworkError) {
        setConnectionError(true);
      }
      
      setIsAdmin(false);
      setIsMaster(false);
      setProfile(null);
    }
  }, []);

  const retryConnection = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    if (user) {
      checkAdminStatus(user.id);
    } else {
      // Se não tem usuário, apenas tenta resetar o erro para ver se o auth volta
      setConnectionError(false);
      window.location.reload();
    }
  };

  const refreshProfile = async () => {
    if (user) await checkAdminStatus(user.id);
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    // Listen for real-time changes to the user's profile
    const channel = supabase
      .channel(`profile_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time profile update detected:', payload.new);
          if (payload.new) {
            setProfile(payload.new as Profile);
            if (payload.new.role) {
              const userRole = payload.new.role;
              setIsMaster(userRole === 'master' || userRole === 'admin');
              setIsAdmin(userRole === 'diretoria' || userRole === 'master' || userRole === 'admin');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SupabaseContext.Provider value={{ user, profile, loading, isAdmin, isMaster, hasProfile, dbReady, connectionError, configError, retryConnection, refreshProfile }}>
      {children}
    </SupabaseContext.Provider>
  );
};
