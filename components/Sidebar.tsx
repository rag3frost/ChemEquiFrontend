
import React from 'react';
import { 
  Home, 
  BarChart2, 
  Database, 
  Settings, 
  LogOut, 
  BookOpen, 
  Zap, 
  HelpCircle,
  Share2,
  Layers
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  activeTab?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const NavItem = ({ icon: Icon, active = false }: { icon: any, active?: boolean }) => (
    <button className={`p-3 rounded-2xl transition-all duration-200 group relative ${active ? 'bg-primary/20 text-primary' : 'text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:bg-primary/10'}`}>
      <Icon size={22} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
    </button>
  );

  return (
    <aside className="w-24 h-[calc(100vh-32px)] m-4 fixed left-0 top-0 bg-sidebar-light dark:bg-sidebar-dark rounded-[40px] flex flex-col items-center py-8 z-50 shadow-2xl overflow-hidden theme-transition">
      {/* Logo */}
      <div className="mb-12">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black font-black text-xl italic shadow-lg shadow-primary/20">
          C
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-4">
        <NavItem icon={Home} active />
        <NavItem icon={Share2} />
        <NavItem icon={Layers} />
        <NavItem icon={Database} />
        <NavItem icon={BarChart2} />
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4">
        <NavItem icon={BookOpen} />
        <NavItem icon={Zap} />
        <NavItem icon={HelpCircle} />
        <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/10 mt-4 cursor-pointer hover:border-primary transition-all">
          <img src="https://picsum.photos/seed/user/100/100" alt="avatar" />
        </div>
        <button 
          onClick={onLogout}
          className="p-3 text-textMuted hover:text-danger transition-colors mt-2"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};