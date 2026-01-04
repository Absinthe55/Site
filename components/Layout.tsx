import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { APP_VERSION } from '../constants';
import { LayoutDashboard, PlusCircle, CheckSquare, LogOut, Download, Cloud, Menu, X, Wifi } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  onOpenDataTransfer: () => void;
  syncStatus?: 'offline' | 'syncing' | 'online' | 'error';
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  currentView, 
  onChangeView, 
  onLogout,
  onOpenDataTransfer,
  syncStatus = 'offline'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const getSyncColor = () => {
    if (syncStatus === 'online') return 'text-green-600 bg-green-50';
    if (syncStatus === 'syncing') return 'text-blue-600 bg-blue-50 animate-pulse';
    if (syncStatus === 'error') return 'text-red-600 bg-red-50';
    return 'text-slate-600 hover:bg-slate-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64 transition-all duration-300">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-slate-200 shadow-sm z-30">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              H
            </div>
            <span className="font-bold text-xl text-slate-800">HidroTakip</span>
          </div>
          <span className="text-xs text-slate-400 font-mono ml-14">{APP_VERSION}</span>
        </div>
        
        <div className="flex flex-col flex-1 p-4 space-y-1">
          <NavButton 
            active={currentView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Panel"
          />
          {currentUser.role === Role.MANAGER && (
            <NavButton 
              active={currentView === 'create'} 
              onClick={() => onChangeView('create')}
              icon={<PlusCircle size={20} />}
              label="Yeni Görev"
            />
          )}
          <NavButton 
            active={currentView === 'tasks'} 
            onClick={() => onChangeView('tasks')}
            icon={<CheckSquare size={20} />}
            label="Görevlerim"
          />
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={onOpenDataTransfer}
            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors mb-2 ${getSyncColor()}`}
          >
            <Cloud size={18} />
            <span>Bulut Bağlantısı</span>
            {syncStatus === 'online' && <div className="w-2 h-2 rounded-full bg-green-500 ml-auto"></div>}
          </button>

          {showInstallBtn && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium mb-2"
            >
              <Download size={18} />
              <span>Uygulamayı Yükle</span>
            </button>
          )}

          <div className="flex items-center p-3 mb-2 rounded-lg bg-slate-50">
            <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser.role === Role.MANAGER ? 'Birim Amiri' : 'Bakım Ustası'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Sticky) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 py-3 safe-area-pb">
        <div className="flex justify-around items-center">
          <MobileNavItem 
            active={currentView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')}
            icon={<LayoutDashboard size={24} />}
            label="Panel"
          />
          
          {/* Main Action Button or Create Button */}
          {currentUser.role === Role.MANAGER ? (
             <div className="-mt-8">
              <button 
                onClick={() => onChangeView('create')}
                className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300 active:scale-95 transition-transform"
              >
                <PlusCircle size={28} />
              </button>
            </div>
          ) : (
             <div className="-mt-8">
               <button 
                 onClick={onOpenDataTransfer}
                 className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-slate-50 active:scale-95 transition-transform ${syncStatus === 'online' ? 'bg-green-600' : 'bg-slate-800'}`}
               >
                 <Cloud size={24} />
               </button>
             </div>
          )}

           <MobileNavItem 
            active={currentView === 'tasks'} 
            onClick={() => onChangeView('tasks')}
            icon={<CheckSquare size={24} />}
            label="Görevler"
          />
          
          {/* Settings/Transfer for Manager, Logout for others */}
          {currentUser.role === Role.MANAGER ? (
             <MobileNavItem 
              active={false} 
              onClick={onOpenDataTransfer}
              icon={<Cloud size={24} className={syncStatus === 'online' ? 'text-green-600' : ''} />}
              label="Bulut"
            />
          ) : (
             <MobileNavItem 
              active={false} 
              onClick={onLogout}
              icon={<LogOut size={24} />}
              label="Çıkış"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-left transition-all
      ${active 
        ? 'bg-indigo-50 text-indigo-700 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);