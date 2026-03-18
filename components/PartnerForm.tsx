'use client';

import React, { useState, useRef } from 'react';
import { dbService, Partner } from '@/lib/db-service';
import { ArrowLeft, Save, Upload, Handshake, Percent, Tag, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { resizeImage } from '@/lib/image-utils';
import Image from 'next/image';

interface PartnerFormProps {
  initialData?: Partner | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    discountPercentage: initialData?.discountPercentage || 0,
    discountType: initialData?.discountType || 'Desconto em produtos',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.logoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let logoUrl = initialData?.logoUrl || '';
      if (logoFile) {
        logoUrl = await resizeImage(logoFile, 300, 300);
      }

      await dbService.savePartner({
        ...formData,
        logoUrl,
      }, initialData?.id);

      onSuccess();
    } catch (err: any) {
      console.error('Error saving partner:', err);
      setError('Erro ao salvar parceiro. Verifique sua conexão.');
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
      <header className="bg-[#064E3B] p-6 text-white rounded-b-[2rem] shadow-lg sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">{initialData ? 'Editar Parceiro' : 'Novo Parceiro'}</h1>
        </div>
      </header>

      <main className="flex-grow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center">
            <div 
              className="w-32 h-32 rounded-2xl border-4 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden transition-all hover:border-[#10B981] group"
            >
              {logoPreview ? (
                <Image 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center">
                  <Upload size={40} className="text-gray-300 mx-auto" />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1 uppercase">Logo do Parceiro</span>
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
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-bold text-emerald-700 transition-colors"
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
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Parceiro</label>
              <div className="relative">
                <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:ring-[#10B981] focus:border-[#10B981]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pet Shop Amigo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Benefícios</label>
              <textarea 
                required
                rows={3}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-[#10B981] focus:border-[#10B981]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que o parceiro oferece..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porcentagem (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required
                    type="number"
                    min="0"
                    max="100"
                    className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:ring-[#10B981] focus:border-[#10B981]"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Desconto</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    required
                    className="block w-full pl-10 rounded-xl border-gray-200 shadow-sm focus:ring-[#10B981] focus:border-[#10B981]"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="Desconto em produtos">Produtos</option>
                    <option value="Desconto em serviços">Serviços</option>
                    <option value="Desconto total">Total</option>
                    <option value="Brinde exclusivo">Brinde</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#064E3B] text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{loading ? 'SALVANDO...' : 'SALVAR PARCEIRO'}</span>
          </button>
        </form>
      </main>
    </motion.div>
  );
};
