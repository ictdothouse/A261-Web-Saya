import React from 'react';
import { Plus, UserCheck, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentView: 'listing' | 'admin';
  onNavigate: (view: 'listing' | 'admin') => void;
  onOpenSubmit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenSubmit }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentView === 'admin' ? (
            <button
              onClick={() => onNavigate('listing')}
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-medium text-sm p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Senarai Projek</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('listing')}
              className="text-left cursor-pointer group"
            >
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 group-hover:text-blue-600 transition-colors">
                Projek Website Saya
              </h1>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {currentView === 'listing' && (
            <button
              onClick={onOpenSubmit}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Hantar Tugasan</span>
            </button>
          )}
          {currentView === 'listing' && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-zinc-500" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};