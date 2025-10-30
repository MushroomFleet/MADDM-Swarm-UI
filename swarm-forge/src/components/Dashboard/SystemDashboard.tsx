import { useSystemStats } from '@/hooks/useSystemStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { usePatternDiscovery } from '@/hooks/usePatternDiscovery';
import { useSystemStore } from '@/stores/system-store';
import { ensureBootstrapApproaches } from '@/core/bootstrap-approaches';
import { Brain, Network, Zap, TrendingUp, Sparkles, Info, Settings2, RotateCcw } from 'lucide-react';
import { SpecialistCard } from './SpecialistCard';
import { ApproachCard } from './ApproachCard';
import { SignalBoard } from './SignalBoard';
import { useToast } from '@/hooks/use-toast';

export function SystemDashboard() {
  const { data: stats, isLoading, error } = useSystemStats();
  const { mutate: discoverPatterns, isPending: isDiscovering } = usePatternDiscovery();
  const { toast } = useToast();
  const { patternDiscoveryConfig, updatePatternDiscoveryConfig } = useSystemStore();

  const handleCreateBootstrap = async () => {
    try {
      await ensureBootstrapApproaches();
      toast({
        title: 'Bootstrap Approaches Created',
        description: 'Created 3 template approaches for immediate use',
      });
      window.location.reload(); // Refresh to show new approaches
    } catch (error) {
      toast({
        title: 'Failed to Create Bootstrap',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleResetThresholds = () => {
    updatePatternDiscoveryConfig({
      minQuality: 0.6,
      minClusterSize: 5,
      similarityThreshold: 0.6,
    });
    toast({
      title: 'Thresholds Reset',
      description: 'Pattern discovery thresholds reset to defaults',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading system stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error loading stats: {error.message}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Bootstrap Mode Alert */}
      {stats.approachCount === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Bootstrap Mode Active</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              No approaches exist yet. Currently using fallback mode while collecting execution data.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateBootstrap}
            >
              Create Template Approaches (A/B/C)
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Specialists</CardTitle>
            <Brain className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.specialistCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeSpecialistCount} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approaches</CardTitle>
            <Network className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approachCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeApproachCount} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Signals</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.signals.length} recent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.executionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats.avgQuality * 100).toFixed(0)}% avg quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Pattern Discovery
          </CardTitle>
          <CardDescription>
            Discover new approach patterns from execution history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              {stats.patternDiscoveryReady ? (
                <Badge variant="default">Ready to discover patterns</Badge>
              ) : (
                <Badge variant="secondary">
                  Need {10 - stats.executionCount} more executions
                </Badge>
              )}
            </div>
            <Button
              onClick={() => discoverPatterns()}
              disabled={isDiscovering}
            >
              {isDiscovering ? 'Discovering...' : 'Discover Patterns'}
            </Button>
          </div>

          {/* Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Discovery Thresholds</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetThresholds}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            {/* Min Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min Quality</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {patternDiscoveryConfig.minQuality.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[patternDiscoveryConfig.minQuality]}
                min={0.5}
                max={0.9}
                step={0.05}
                onValueChange={([value]) => 
                  updatePatternDiscoveryConfig({ minQuality: value })
                }
              />
            </div>

            {/* Min Cluster Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Min Cluster Size</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {patternDiscoveryConfig.minClusterSize}
                </span>
              </div>
              <Slider
                value={[patternDiscoveryConfig.minClusterSize]}
                min={3}
                max={15}
                step={1}
                onValueChange={([value]) => 
                  updatePatternDiscoveryConfig({ minClusterSize: value })
                }
              />
            </div>

            {/* Similarity Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Similarity Threshold</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {patternDiscoveryConfig.similarityThreshold.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[patternDiscoveryConfig.similarityThreshold]}
                min={0.4}
                max={0.9}
                step={0.05}
                onValueChange={([value]) => 
                  updatePatternDiscoveryConfig({ similarityThreshold: value })
                }
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Lower thresholds = more patterns discovered (may be less distinct)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Specialists */}
      <section>
        <h2 className="text-xl font-bold mb-4">Top Specialists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.specialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>
      </section>

      {/* Top Approaches */}
      <section>
        <h2 className="text-xl font-bold mb-4">Top Approaches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.approaches.map((approach) => (
            <ApproachCard key={approach.id} approach={approach} />
          ))}
        </div>
      </section>

      {/* Signal Board */}
      <section>
        <h2 className="text-xl font-bold mb-4">Active Signals</h2>
        <SignalBoard signals={stats.signals} />
      </section>
    </div>
  );
}
