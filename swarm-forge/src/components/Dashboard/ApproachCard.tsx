import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Network, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ApproachCardProps {
  approach: {
    id: string;
    name: string;
    usageCount: number;
    avgQuality: number;
    trend: string;
  };
}

export function ApproachCard({ approach }: ApproachCardProps) {
  const getTrendIcon = () => {
    switch (approach.trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:border-secondary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-secondary" />
            <span className="truncate">{approach.name}</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getTrendIcon()}
            {approach.trend}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Average Quality</span>
            <span>{(approach.avgQuality * 100).toFixed(0)}%</span>
          </div>
          <Progress value={approach.avgQuality * 100} className="h-2" />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Usage Count</span>
          <span className="font-medium text-foreground">{approach.usageCount}</span>
        </div>

        <div className="text-xs font-mono text-muted-foreground truncate">
          {approach.id}
        </div>
      </CardContent>
    </Card>
  );
}
