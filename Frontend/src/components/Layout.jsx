import { Outlet, NavLink } from 'react-router-dom';
import { Cloud, Calendar, History } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200">
                ClimaVue
              </span>
            </div>
            <div className="flex gap-4">
              <NavLink 
                to="/" 
                className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Daily Dashboard</span>
              </NavLink>
              <NavLink 
                to="/historical" 
                className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Historical Trends</span>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
}
