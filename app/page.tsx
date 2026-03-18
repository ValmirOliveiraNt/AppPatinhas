'use client';

import React, { useState, useEffect } from 'react';
import { SupabaseProvider, useSupabase } from '@/components/SupabaseProvider';
import { getSupabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Home } from '@/components/Home';
import { Login } from '@/components/Login';
import { RegistrationForm } from '@/components/RegistrationForm';
import { MemberList } from '@/components/MemberList';
import { MemberCard } from '@/components/MemberCard';
import { About } from '@/components/About';
import { AdminPanel } from '@/components/AdminPanel';
import { PartnerList } from '@/components/PartnerList';
import { PartnerForm } from '@/components/PartnerForm';
import { PartnerCard } from '@/components/PartnerCard';
import { dbService, Partner } from '@/lib/db-service';
import { ArrowLeft, Info, Edit2, Trash2, PawPrint } from 'lucide-react';
import { motion } from 'motion/react';

type View = 'home' | 'register' | 'list' | 'my-card' | 'about' | 'view-member' | 'admin-panel' | 'partners' | 'partner-form' | 'partner-card';

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [isSelfRegistration, setIsSelfRegistration] = useState(false);
  const { user, isAdmin, hasProfile, loading, dbReady, connectionError, configError, retryConnection, refreshProfile } = useSupabase();

  // Escuta mudanças em tempo real para o membro logado
  useEffect(() => {
    if (!user) return;

    let channel: any = null;

    const setupSubscription = async () => {
      const client = getSupabase();
      if (!client) return;

      channel = client
        .channel(`my_member_changes_${user.id}`)
        .on(
          'postgres_changes' as any,
          { 
            event: '*', 
            schema: 'public', 
            table: 'members',
            filter: `uid=eq.${user.id}`
          },
          async (payload: any) => {
            console.log('Mudança detectada na carteirinha do usuário:', payload);
            
            if (payload.eventType === 'DELETE') {
              setSelectedMember(null);
              if (view === 'view-member') setView('home');
              return;
            }
            
            const data = await dbService.getMemberByUid(user.id);
            if (data) {
              setSelectedMember(data);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        const client = getSupabase();
        if (client) client.removeChannel(channel);
      }
    };
  }, [user, view]);

  useEffect(() => {
    if (user && !hasProfile && view === 'home') {
      setIsSelfRegistration(true);
      setView('register');
      setMessage('Bem-vindo! Como você é um novo usuário, por favor, complete seu cadastro de membro para continuar.');
    }
  }, [user, hasProfile, view]);

  const handleFetchMyCard = async () => {
    if (!user) return;
    
    const supabase = dbService.isSupabaseConfigured();
    if (!supabase) {
      setMessage('Erro: Supabase não está configurado. Verifique as variáveis de ambiente.');
      return;
    }

    setLoadingCard(true);
    try {
      const data = await dbService.getMemberByUid(user.id);

      if (data) {
        setSelectedMember(data);
        setView('view-member');
      } else {
        setMessage('Você ainda não possui uma carteirinha cadastrada. Deseja realizar seu cadastro agora?');
        setPendingRegistration(true);
        setIsSelfRegistration(true);
      }
    } catch (error: any) {
      const errorMsg = error?.message || (typeof error === 'string' ? error : 'Erro desconhecido');
      console.error('Erro ao buscar carteirinha:', errorMsg);
      
      let errorMessage = 'Erro desconhecido ao buscar dados.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.code) {
        errorMessage = `Erro código: ${error.code}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        const details = error?.details || error?.hint || '';
        if (details) {
          errorMessage = details;
        } else {
          try {
            const str = JSON.stringify(error);
            errorMessage = str === '{}' ? 'Erro interno (objeto vazio)' : str;
          } catch (e) {
            errorMessage = 'Erro não serializável';
          }
        }
      }
      
      setMessage(`Erro ao carregar sua carteirinha: ${errorMessage}`);
    } finally {
      setLoadingCard(false);
    }
  };

  const renderView = () => {
    if (configError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <Info size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuração Incompleta</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            As variáveis de ambiente do Supabase não foram encontradas. Por favor, configure o projeto corretamente.
          </p>
        </div>
      );
    }

    if (connectionError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
            <PawPrint size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro de Conexão</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente.
          </p>
          <button 
            onClick={retryConnection}
            className="px-8 py-3 bg-[#064E3B] text-white font-bold rounded-2xl shadow-lg hover:bg-opacity-90 transition-all"
          >
            TENTAR NOVAMENTE
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
          <div className="animate-bounce text-[#F59E0B]">
            <PawPrint size={48} />
          </div>
        </div>
      );
    }

    if (!user) {
      return <Login />;
    }

    if (loadingCard) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin text-[#10B981]">
            <PawPrint size={48} />
          </div>
        </div>
      );
    }

    switch (view) {
      case 'home':
        return <Home onNavigate={(v) => {
          if (v === 'my-card') handleFetchMyCard();
          else {
            setEditingMember(null);
            setIsSelfRegistration(false);
            setView(v);
          }
        }} />;
      case 'register':
        return (
          <RegistrationForm 
            initialData={editingMember}
            isSelfRegistration={isSelfRegistration}
            onSuccess={async () => {
              setEditingMember(null);
              setIsSelfRegistration(false);
              await refreshProfile();
              setView(isSelfRegistration ? 'home' : 'list');
            }} 
            onCancel={async () => {
              if (isSelfRegistration) {
                const supabase = getSupabase();
                if (supabase) {
                  await supabase.auth.signOut();
                  window.location.reload();
                  return;
                }
              }
              setEditingMember(null);
              setIsSelfRegistration(false);
              setView(editingMember ? 'list' : 'home');
            }} 
          />
        );
      case 'list':
        if (!isAdmin) {
          setView('home');
          return null;
        }
        return (
          <MemberList 
            onBack={() => setView('home')} 
            onSelectMember={(m) => {
              setSelectedMember(m);
              setView('view-member');
            }}
            onEditMember={(m) => {
              setEditingMember(m);
              setView('register');
            }}
          />
        );
      case 'about':
        return <About onBack={() => setView('home')} />;
      case 'admin-panel':
        return (
          <AdminPanel 
            onBack={() => setView('home')}
            onEditMember={(m) => {
              setEditingMember(m);
              setView('register');
            }}
          />
        );
      case 'partners':
        return (
          <PartnerList 
            onBack={() => setView('home')}
            onEditPartner={(p) => {
              setEditingPartner(p);
              setView('partner-form');
            }}
            onSelectPartner={(p) => {
              setSelectedPartner(p);
              setView('partner-card');
            }}
          />
        );
      case 'partner-form':
        return (
          <PartnerForm 
            initialData={editingPartner}
            onSuccess={() => setView('partners')}
            onCancel={() => setView('partners')}
          />
        );
      case 'partner-card':
        return selectedPartner ? (
          <PartnerCard 
            partner={selectedPartner}
            onBack={() => setView('partners')}
          />
        ) : null;
      case 'view-member':
        if (!isAdmin && selectedMember?.uid !== user?.id) {
          setView('home');
          return null;
        }
        return (
          <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            <div className="w-full flex justify-end items-center mb-6 max-w-[380px]">
              {isAdmin && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setEditingMember(selectedMember);
                      setView('register');
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-[#10B981]"
                  >
                    <Edit2 size={24} />
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(selectedMember.id)}
                    className="p-2 bg-white rounded-full shadow-md text-red-500"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              )}
            </div>
            {selectedMember && (
              <MemberCard 
                member={selectedMember} 
                onBack={() => setView(selectedMember?.uid === user?.id ? 'home' : 'list')} 
              />
            )}
          </div>
        );
      default:
        return <Home onNavigate={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {configError && user && (
        <div className="bg-red-700 text-white text-[10px] py-2 px-4 text-center font-bold uppercase tracking-wider">
          Erro Crítico: Variáveis de ambiente do Supabase não configuradas.
        </div>
      )}
      {connectionError && user && !configError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 flex flex-col items-center justify-center space-y-2 font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-4">
            <span>
              {!navigator.onLine 
                ? 'Você está offline. Verifique sua conexão.' 
                : 'Erro de Conexão: Não foi possível alcançar o servidor.'}
            </span>
            <button 
              onClick={retryConnection}
              className="bg-white text-red-600 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
          <p className="text-[9px] opacity-80 normal-case font-normal">
            Dica: Verifique sua internet, AdBlockers ou se o projeto no Supabase não foi PAUSADO.
          </p>
        </div>
      )}
      {!dbReady && !connectionError && !configError && user && (
        <div className="bg-amber-500 text-white text-[10px] py-1 px-4 text-center font-bold uppercase tracking-wider">
          Atenção: Banco de dados não configurado. Execute o script SQL no Supabase.
        </div>
      )}
      {renderView()}

      {/* Global Message Modal */}
      {message && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Aviso</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button 
              onClick={() => {
                if (pendingRegistration) {
                  setView('register');
                  setPendingRegistration(false);
                }
                setMessage(null);
              }}
              className="w-full py-3 bg-[#064E3B] text-white font-bold rounded-xl hover:bg-opacity-90 transition-all"
            >
              {pendingRegistration ? 'CADASTRAR AGORA' : 'ENTENDI'}
            </button>
            {pendingRegistration && (
              <button 
                onClick={() => {
                  setPendingRegistration(false);
                  setMessage(null);
                }}
                className="w-full py-3 mt-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                MAIS TARDE
              </button>
            )}
          </motion.div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-6">
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
                onClick={async () => {
                  try {
                    await dbService.deleteMember(confirmDeleteId);
                    setConfirmDeleteId(null);
                    setView('list');
                  } catch (err) {
                    console.error('Error deleting:', err);
                    setMessage('Erro ao excluir membro.');
                    setConfirmDeleteId(null);
                  }
                }}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                SIM, EXCLUIR
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AppContent />
      </SupabaseProvider>
    </ErrorBoundary>
  );
}
