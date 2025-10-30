import { useSystemStore } from '@/stores/system-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, Zap, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_VIGILANCE_THRESHOLD,
  DEFAULT_DECAY_RATE,
  DEFAULT_MAX_SPECIALISTS,
  DEFAULT_LEARNING_RATE,
  PATTERN_DISCOVERY_THRESHOLD,
  DEFAULT_MODEL,
  MIN_PARALLEL_COUNT,
  MAX_PARALLEL_COUNT,
} from '@/utils/constants';

export function SystemConfig() {
  const { config, model, enableWebSearch, updateConfig, updateParallelConfig, setModel, setEnableWebSearch, resetConfig } = useSystemStore();
  const { toast } = useToast();

  const handleReset = () => {
    resetConfig();
    toast({
      title: 'Settings Reset',
      description: 'All configuration values have been reset to defaults',
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="model">
          AI Model
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {DEFAULT_MODEL} | toggle :online search in the UI)
          </span>
        </Label>
        <Input
          id="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g., x-ai/grok-4-fast"
        />
        <p className="text-xs text-muted-foreground">
          OpenRouter model identifier (see openrouter.ai/models for available models)
        </p>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="websearch">Enable Web Search Grounding</Label>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Appends :online to model for automatic web search integration
          </p>
        </div>
        <Switch
          id="websearch"
          checked={enableWebSearch}
          onCheckedChange={(checked) => setEnableWebSearch(checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vigilance">
          Vigilance Threshold
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {DEFAULT_VIGILANCE_THRESHOLD})
          </span>
        </Label>
        <Input
          id="vigilance"
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={config.vigilanceThreshold}
          onChange={(e) =>
            updateConfig({ vigilanceThreshold: parseFloat(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">
          Minimum similarity to reuse specialist. Lower = more reuse, Higher = more specialists
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="decay">
          Decay Rate (seconds)
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {DEFAULT_DECAY_RATE})
          </span>
        </Label>
        <Input
          id="decay"
          type="number"
          min="300"
          max="7200"
          step="300"
          value={config.decayRate}
          onChange={(e) => updateConfig({ decayRate: parseInt(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          Signal half-life in seconds. Shorter = faster adaptation, Longer = more memory
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialists">
          Max Specialists
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {DEFAULT_MAX_SPECIALISTS})
          </span>
        </Label>
        <Input
          id="specialists"
          type="number"
          min="3"
          max="50"
          step="1"
          value={config.maxSpecialists}
          onChange={(e) =>
            updateConfig({ maxSpecialists: parseInt(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of specialists before pruning poorest performers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="learning">
          Learning Rate
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {DEFAULT_LEARNING_RATE})
          </span>
        </Label>
        <Input
          id="learning"
          type="number"
          min="0.01"
          max="1"
          step="0.05"
          value={config.learningRate}
          onChange={(e) =>
            updateConfig({ learningRate: parseFloat(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">
          EMA smoothing factor. Higher = faster adaptation, Lower = more stability
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="threshold">
          Pattern Discovery Threshold
          <span className="text-muted-foreground ml-2 text-xs">
            (Default: {PATTERN_DISCOVERY_THRESHOLD})
          </span>
        </Label>
        <Input
          id="threshold"
          type="number"
          min="5"
          max="50"
          step="5"
          value={config.patternDiscoveryThreshold}
          onChange={(e) =>
            updateConfig({
              patternDiscoveryThreshold: parseInt(e.target.value),
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Minimum executions before triggering pattern discovery
        </p>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="discovery">Enable Pattern Discovery</Label>
          <p className="text-xs text-muted-foreground">
            Automatically discover new approach patterns
          </p>
        </div>
        <Switch
          id="discovery"
          checked={config.enablePatternDiscovery}
          onCheckedChange={(checked) =>
            updateConfig({ enablePatternDiscovery: checked })
          }
        />
      </div>

      {/* Parallel Execution Section */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="parallel">Parallel Execution</Label>
              <Badge variant="secondary" className="text-xs">
                EXPERIMENTAL
              </Badge>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              Execute multiple specialists concurrently for higher quality
            </p>
          </div>
          <Switch
            id="parallel"
            checked={config.parallelConfig?.enabled ?? false}
            onCheckedChange={(checked) =>
              updateParallelConfig({ enabled: checked })
            }
          />
        </div>

        {config.parallelConfig?.enabled && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="parallel-count">
                  Parallel Count: {config.parallelConfig?.parallelCount ?? 3}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {MIN_PARALLEL_COUNT}-{MAX_PARALLEL_COUNT} specialists
                </span>
              </div>
              <Slider
                id="parallel-count"
                min={MIN_PARALLEL_COUNT}
                max={MAX_PARALLEL_COUNT}
                step={1}
                value={[config.parallelConfig?.parallelCount ?? 3]}
                onValueChange={([value]) =>
                  updateParallelConfig({ parallelCount: value })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Number of specialists to execute simultaneously
              </p>
            </div>

            <Alert className="border-orange-500/50 bg-orange-500/5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-xs">
                <strong>Cost Warning:</strong> Parallel execution multiplies API costs by{' '}
                {config.parallelConfig?.parallelCount ?? 3}x. Each request will consume{' '}
                {config.parallelConfig?.parallelCount ?? 3} times the tokens.
              </AlertDescription>
            </Alert>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Benefits:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>10-20% higher quality responses (best of N selection)</li>
                <li>Faster distributed learning (all specialists learn)</li>
                <li>More robust outputs (multiple perspectives)</li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Specialist Naming Convention</Label>
        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground space-y-2">
          <p>
            Format: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">domain_animal</code>
          </p>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Honorific Progression:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground">coding_falcon</code> - New specialist (0-9 executions)
              </li>
              <li>
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground">expert_coding_falcon</code> - 10+ executions with &gt;80% quality
              </li>
              <li>
                <code className="bg-background px-1.5 py-0.5 rounded text-foreground">master_coding_falcon</code> - 50+ executions with &gt;80% quality
              </li>
            </ul>
          </div>
          <p className="text-xs pt-1">
            Specialists earn honorific titles based on performance. Watch them evolve!
          </p>
        </div>
      </div>

      <Button onClick={handleReset} variant="outline" className="w-full">
        Reset to Defaults
      </Button>
    </div>
  );
}
