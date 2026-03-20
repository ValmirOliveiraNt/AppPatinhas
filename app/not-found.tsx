import Link from 'next/link';
import { PawPrint } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-[#F59E0B] mb-6">
        <PawPrint size={64} />
      </div>
      <h1 className="text-4xl font-black text-[#064E3B] mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Página não encontrada</h2>
      <p className="text-gray-500 mb-8 max-w-xs">
        O rastro que você está seguindo parece ter desaparecido no mato.
      </p>
      <Link 
        href="/"
        className="bg-[#064E3B] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-opacity-90 transition-all"
      >
        Voltar ao Início
      </Link>
    </div>
  );
}
