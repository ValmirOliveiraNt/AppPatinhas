'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { dbService } from '@/lib/db-service';
import { useSupabase } from '@/components/SupabaseProvider';
import { resizeImage } from '@/lib/image-utils';
import { maskCPF, maskPhone, maskDate } from '@/lib/masks';
import { LogOut, Camera, Save, ArrowLeft, Upload, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { getSupabase } from '@/lib/supabase';

interface RegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isSelfRegistration?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData,
  isSelfRegistration = false
}) => {
  const { user, isAdmin, isMaster } = useSupabase();
  const [adminName, setAdminName] = useState<string>('');
  
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (user && isAdmin) {
        const { data } = await getSupabase()!
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) setAdminName(data.full_name);
      }
    };
    fetchAdminProfile();
  }, [user, isAdmin]);
  
  // Helper to get current date in DD/MM/AAAA
  const getCurrentDateFormatted = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    cpf: initialData?.cpf || '',
    phone: initialData?.phone || '',
    role: initialData?.role || 'colaborador',
    birthDate: initialData?.birthDate || '',
    associationDate: initialData?.associationDate || getCurrentDateFormatted(),
    registrationNumber: initialData?.registrationNumber || '',
    status: initialData?.status || 'pendente',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };
  
  // Geração automática da matrícula: MM/AA da data de associação + 3 primeiros do CPF
  useEffect(() => {
    // Only auto-generate if not editing or if fields change and we want to re-generate
    if (initialData) return; 

    const dateRaw = formData.associationDate.replace(/\D/g, '');
    const cpfRaw = formData.cpf.replace(/\D/g, '');
    
    if (dateRaw.length === 8 && cpfRaw.length >= 3) {
      const mm = dateRaw.slice(2, 4);
      const aa = dateRaw.slice(6, 8);
      const first3Cpf = cpfRaw.slice(0, 3);
      
      setFormData(prev => ({
        ...prev,
        registrationNumber: mm + aa + first3Cpf
      }));
    }
  }, [formData.associationDate, formData.cpf, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user) {
      setError('Você precisa estar logado para realizar esta ação.');
      return;
    }

    setLoading(true);
    console.log('Iniciando salvamento do membro...');

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido. Por favor, verifique os números digitados.');
      setLoading(false);
      return;
    }

    try {
      let photoUrl = initialData?.photoUrl || '';
      let newUserUid = initialData ? initialData.uid : (isSelfRegistration || !isAdmin ? user.id : null);
      
      if (photoFile) {
        console.log('Processando foto (Base64)...');
        try {
          // Convertemos para Base64 e redimensionamos para caber no banco (limite 1MB sugerido para base64)
          photoUrl = await resizeImage(photoFile, 300, 300);
          console.log('Foto processada com sucesso');
        } catch (storageError: any) {
          console.error('Erro ao processar imagem:', storageError);
          setError('Erro ao processar a imagem. Tente outra foto.');
          setLoading(false);
          return;
        }
      }

      // Verificar CPF duplicado antes de salvar (apenas para novos registros)
      if (!initialData) {
        const isDuplicateCpf = await dbService.checkDuplicateCpf(formData.cpf);
        if (isDuplicateCpf) {
          setError('Este CPF já está cadastrado no sistema.');
          setLoading(false);
          return;
        }

        // Se não for admin, verifica se já possui carteirinha
        if (!isAdmin) {
          const existingCard = await dbService.getMemberByUid(user.id);
          if (existingCard) {
            setError('Você já possui uma carteirinha cadastrada vinculada à sua conta.');
            setLoading(false);
            return;
          }
        }
      }

      const memberData = {
        fullName: formData.fullName,
        cpf: formData.cpf,
        phone: formData.phone,
        role: isAdmin ? formData.role : 'colaborador',
        birthDate: formData.birthDate,
        associationDate: formData.associationDate,
        registrationNumber: formData.registrationNumber,
        photoUrl: photoUrl || '',
        uid: newUserUid,
        status: formData.status,
        approvedByName: isAdmin ? adminName : (initialData?.approvedByName || ''),
      };

      if (!initialData) {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        (memberData as any).memberId = `PE-${year}-${randomNum}`;
      }

      await dbService.saveMember(memberData, initialData?.id);
      
      onSuccess();
    } catch (err: any) {
      console.error('Erro detalhado ao salvar membro:', err);
      // Log full error object for debugging
      try {
        console.error('Detailed error info:', JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))));
      } catch (e) {
        console.error('Could not stringify error:', err);
      }
      
      let errorMessage = 'Erro ao salvar o membro.';
      
      if (err && typeof err === 'object') {
        // Erro do Supabase/Postgrest costuma ter message, details, hint
        const msg = err.message || err.error_description || err.code || '';
        const details = err.details || '';
        const hint = err.hint || '';
        
        if (msg || details || hint) {
          errorMessage = `${msg}${details ? ' - ' + details : ''}${hint ? ' (' + hint + ')' : ''}`;
        } else {
          try {
            const str = JSON.stringify(err);
            errorMessage = str === '{}' ? 'Erro interno do banco de dados (detalhes não disponíveis)' : str;
          } catch (e) {
            errorMessage = 'Erro complexo ao salvar.';
          }
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto bg-white min-h-screen flex flex-col"
    >
      <header className="bg-gradient-to-br from-[#8B4513] to-[#DAA520] p-8 text-white rounded-b-[1.5rem] shadow-lg relative overflow-hidden">
        <button onClick={onCancel} className="absolute left-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        {isSelfRegistration && (
          <button 
            onClick={handleLogout} 
            className="absolute right-4 top-4 flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors text-xs font-bold"
          >
            <LogOut size={16} />
            <span>SAIR</span>
          </button>
        )}
        <div className="flex flex-col items-center">
          <div className="bg-white p-2 rounded-full mb-4 w-20 h-20 flex items-center justify-center overflow-hidden shadow-inner relative">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cadastro</h1>
          <p className="text-sm text-white/80">Patinhas de Emaús</p>
        </div>
      </header>

      <main className="flex-grow p-6 -mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
              <p className="font-bold">Ops! Algo deu errado:</p>
              <p>{error}</p>
            </div>
          )}

          {!initialData && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-xs rounded-r-lg flex items-start space-x-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aviso de Aprovação</p>
                <p>Seu cadastro entrará como <span className="font-bold uppercase">Colaborador</span> e ficará em <span className="font-bold uppercase">Espera de Validação</span> pela diretoria.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-4">
              <label className="text-sm font-semibold text-gray-600 mb-2">Foto do Membro</label>
              <div 
                className="w-32 h-32 rounded-full border-4 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden transition-all hover:border-[#DAA520] group"
              >
                {photoPreview ? (
                  <Image 
                    src={photoPreview} 
                    alt="Preview" 
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center">
                    <Upload size={40} className="text-gray-300 mx-auto" />
                    <span className="text-[10px] text-gray-400 font-medium block mt-1">SEM FOTO</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors"
                >
                  <Upload size={14} />
                  GALERIA
                </button>
                <button 
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold text-amber-700 transition-colors"
                >
                  <Camera size={14} />
                  CÂMERA
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input 
                type="file" 
                ref={cameraInputRef}
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />
              {photoFile && <span className="text-[10px] text-gray-500 mt-2">{photoFile.name}</span>}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  required
                  className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520]"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input 
                  required
                  placeholder="000.000.000-00"
                  className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520]"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input 
                  required
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520]"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input 
                    required
                    placeholder="DD/MM/AAAA"
                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520]"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: maskDate(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Associação {!isAdmin && <span className="text-[10px] text-amber-600 font-normal">(Automática)</span>}
                  </label>
                  <input 
                    required
                    placeholder="DD/MM/AAAA"
                    className={`block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520] ${!isAdmin ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                    value={formData.associationDate}
                    onChange={(e) => setFormData({ ...formData, associationDate: maskDate(e.target.value) })}
                    readOnly={!isAdmin}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula (Automática)</label>
                <input 
                  readOnly
                  placeholder="Gerada automaticamente"
                  className="block w-full rounded-xl border-gray-200 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={formData.registrationNumber}
                />
              </div>
              {isAdmin && initialData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status do Membro</label>
                  <select 
                    required
                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520]"
                    value={formData.status || initialData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value } as any)}
                  >
                    <option value="pendente">Pendente de Aprovação</option>
                    <option value="valida">Válida</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                <select 
                  required
                  disabled={!isAdmin}
                  className={`block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#DAA520] focus:border-[#DAA520] ${!isAdmin ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  value={isAdmin ? formData.role : 'colaborador'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="colaborador">Colaborador</option>
                  {isAdmin && (
                    <>
                      <option value="diretoria">Diretoria</option>
                      <option value="master">Master (Proprietário)</option>
                      <option value="voluntario">Voluntário</option>
                      <option value="apoio">Apoio</option>
                    </>
                  )}
                </select>
                {!isAdmin && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">* Apenas administradores podem alterar o cargo.</p>
                )}
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#8B4513] text-white font-bold py-4 px-6 rounded-[1.5rem] shadow-lg hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'SALVANDO...' : 'SALVAR REGISTRO'}</span>
              <Save size={20} />
            </button>
          </form>

          {isSelfRegistration && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-4">Entrou com a conta errada?</p>
              <button 
                onClick={handleLogout}
                className="text-red-500 font-bold text-sm hover:underline flex items-center justify-center space-x-2 mx-auto"
              >
                <LogOut size={18} />
                <span>SAIR E ENTRAR COM OUTRA CONTA</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};
