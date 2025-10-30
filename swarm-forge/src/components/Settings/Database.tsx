import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/storage/db';
import { Database as DatabaseIcon, Trash2, Download } from 'lucide-react';

export function Database() {
  const { data: stats } = useSystemStats();
  const { toast } = useToast();

  const handleClearAll = async () => {
    if (
      !confirm(
        'Are you sure you want to clear all data? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await db.specialists.clear();
      await db.approaches.clear();
      await db.signals.clear();
      await db.executionHistory.clear();
      await db.patterns.clear();

      toast({
        title: 'Database Cleared',
        description: 'All data has been removed from IndexedDB',
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear database',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        specialists: await db.specialists.toArray(),
        approaches: await db.approaches.toArray(),
        signals: await db.signals.toArray(),
        executionHistory: await db.executionHistory.toArray(),
        patterns: await db.patterns.toArray(),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hybrid-swarm-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Database exported to JSON file',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export database',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Specialists</p>
            <p className="text-2xl font-bold">{stats?.specialistCount || 0}</p>
          </div>
          <DatabaseIcon className="w-8 h-8 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Approaches</p>
            <p className="text-2xl font-bold">{stats?.approachCount || 0}</p>
          </div>
          <DatabaseIcon className="w-8 h-8 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Signals</p>
            <p className="text-2xl font-bold">{stats?.signalCount || 0}</p>
          </div>
          <DatabaseIcon className="w-8 h-8 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Executions</p>
            <p className="text-2xl font-bold">{stats?.executionCount || 0}</p>
          </div>
          <DatabaseIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Database Actions</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={handleClearAll}
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">IndexedDB</Badge>
          <Badge variant="outline">Dexie.js</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          All data is stored locally in your browser's IndexedDB. Data persists across sessions
          but is specific to this domain.
        </p>
      </div>
    </div>
  );
}
