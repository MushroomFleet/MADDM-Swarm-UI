import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface SignalBoardProps {
  signals: Array<{
    taskId: string;
    approach: string;
    strength: number;
    age: number;
  }>;
}

export function SignalBoard({ signals }: SignalBoardProps) {
  if (signals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No active signals. Signals will appear as the system executes tasks.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {signals.map((signal, index) => (
        <Card key={index} className="hover:border-accent/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium truncate">
                  {signal.approach}
                </span>
              </div>
              <Badge 
                variant={signal.strength >= 50 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {signal.strength.toFixed(0)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Signal Strength</span>
                  <span>{signal.strength.toFixed(1)}</span>
                </div>
                <Progress value={signal.strength} className="h-1.5" />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Age</span>
                <span>
                  {signal.age < 60 
                    ? `${signal.age}s` 
                    : `${Math.floor(signal.age / 60)}m`}
                </span>
              </div>

              <div className="text-xs font-mono text-muted-foreground truncate">
                {signal.taskId}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
