import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain } from 'lucide-react';
import { formatSpecialistNameForDisplay } from '@/utils/specialist-names';

interface SpecialistCardProps {
  specialist: {
    id: string;
    executions: number;
    successRate: number;
    avgQuality: number;
    specialization: number;
  };
}

export function SpecialistCard({ specialist }: SpecialistCardProps) {
  const displayName = formatSpecialistNameForDisplay(specialist.id, {
    totalExecutions: specialist.executions,
    averageQuality: specialist.avgQuality,
  });

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs">{displayName}</span>
          </div>
          <Badge variant={specialist.successRate >= 0.8 ? 'default' : 'secondary'}>
            {(specialist.successRate * 100).toFixed(0)}% success
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Quality</span>
            <span>{(specialist.avgQuality * 100).toFixed(0)}%</span>
          </div>
          <Progress value={specialist.avgQuality * 100} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Specialization</span>
            <span>{(specialist.specialization * 100).toFixed(0)}%</span>
          </div>
          <Progress value={specialist.specialization * 100} className="h-2" />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Executions</span>
          <span className="font-medium text-foreground">{specialist.executions}</span>
        </div>
      </CardContent>
    </Card>
  );
}
