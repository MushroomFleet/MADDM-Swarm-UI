import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Cpu, Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useADDMEnabled, useADDMServiceHealth } from '@/stores';

export function Header() {
  const location = useLocation();
  const addmEnabled = useADDMEnabled();
  const addmHealthy = useADDMServiceHealth();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/chat':
        return 'Chat';
      case '/dashboard':
        return 'Dashboard';
      case '/settings':
        return 'Settings';
      default:
        return 'Hybrid Swarm';
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger />

      <div className="flex items-center gap-2 flex-1">
        <Brain className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden sm:flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Three-Layer Coordination
        </Badge>

        {addmEnabled && (
          <Badge
            variant="secondary"
            className={`hidden sm:flex items-center gap-1 ${
              addmHealthy ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {addmHealthy ? (
              <Activity className="w-3 h-3 animate-pulse" />
            ) : (
              <Cpu className="w-3 h-3" />
            )}
            ADDM: {addmHealthy ? 'Active' : 'Offline'}
          </Badge>
        )}
      </div>
    </header>
  );
}
