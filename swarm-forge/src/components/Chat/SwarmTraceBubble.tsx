import { useState } from 'react';
import { SwarmTraceData } from '@/core/types';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  Waves,
  Target,
  TrendingUp,
  Brain,
  AlertCircle,
  Zap,
  Award,
  Clock,
  Cpu,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { formatSpecialistNameForDisplay } from '@/utils/specialist-names';

interface SwarmTraceBubbleProps {
  trace: SwarmTraceData;
  isADDMMesssage?: boolean;
  decisionHistory?: ADDMDecisionResponse[];
}

interface ADDMDecisionResponse {
  decision: 'enhance' | 'research' | 'complete';
  confidence: number;
  reaction_time: number;
  reasoning: string;
  metrics: {
    quality_score: number;
    completeness_score: number;
    improvement_potential: number;
  };
  timestamp: string;
}

export function SwarmTraceBubble({ trace, isADDMMesssage, decisionHistory }: SwarmTraceBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFallback = trace.approachId === 'fallback';

  // Format specialist name with honorific if earned
  const displayName = formatSpecialistNameForDisplay(trace.specialistId, {
    totalExecutions: trace.specialistStats.totalExecutions,
    averageQuality: trace.specialistStats.avgQuality,
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mt-2 border-dashed border-muted-foreground/30">
        <CollapsibleTrigger className="w-full p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Swarm Trace
              </span>
              {isFallback && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Bootstrap Mode
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Using baseline approach while the system learns. 
                        Complete {Math.max(0, 10 - trace.waveCounts.executionCount)} more task{Math.max(0, 10 - trace.waveCounts.executionCount) !== 1 ? 's' : ''} to 
                        unlock Pattern Discovery and create specialized approaches.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {trace.swarmCounts.activeSpecialists}/{trace.swarmCounts.totalSpecialists}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Waves className="w-3 h-3 mr-1" />
                Wave {trace.waveCounts.executionCount}
              </Badge>
              {trace.parallelExecution?.enabled && (
                <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Parallel x{trace.parallelExecution.parallelCount}
                </Badge>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-3 pt-2">
            {/* Specialist Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold">Specialist</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-xs">
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <code className="text-xs bg-muted px-1 rounded">
                    {displayName}
                  </code>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Executions: {trace.specialistStats.totalExecutions}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Success: {(trace.specialistStats.successRate * 100).toFixed(0)}%
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Quality: {(trace.specialistStats.avgQuality * 100).toFixed(0)}%
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Specialization: {(trace.specialistStats.specializationStrength * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Approach Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold">Approach</span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-xs">
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{trace.approachName}</span>
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <code className="text-xs bg-muted px-1 rounded">
                    {trace.approachId}
                  </code>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Usage: {trace.approachStats.usageCount}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Avg Quality: {(trace.approachStats.avgQuality * 100).toFixed(0)}%
                  </Badge>
                  <Badge 
                    variant={
                      trace.approachStats.trend === 'improving' ? 'default' : 
                      trace.approachStats.trend === 'declining' ? 'destructive' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {trace.approachStats.trend}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="space-y-1">
              <span className="text-xs font-semibold">Quality Metrics</span>
              <div className="pl-6 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Target:</span>
                  <Badge variant="outline" className="text-xs">
                    {(trace.qualityTarget * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Actual:</span>
                  <Badge 
                    variant={trace.actualQuality >= trace.qualityTarget ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {(trace.actualQuality * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Parallel Execution Results */}
            {trace.parallelExecution?.enabled && (
              <div className="space-y-2 pt-2 border-t border-yellow-500/20 bg-yellow-500/5 -mx-3 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-semibold">Parallel Execution</span>
                  <Badge variant="secondary" className="text-xs">
                    {trace.parallelExecution.parallelCount} specialists
                  </Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {trace.parallelExecution.selectionReason}
                  </p>
                  <div className="space-y-1">
                    {trace.parallelExecution.allResults.map((result, idx) => {
                      const isWinner = result.specialistId === trace.specialistId;
                      // Format parallel specialist names (with basic display since we don't have full profile)
                      const resultDisplayName = isWinner ? displayName : result.specialistId;
                      return (
                        <div
                          key={`${result.specialistId}-${idx}`}
                          className={`flex items-center justify-between p-2 rounded text-xs ${
                            isWinner 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isWinner && (
                              <Award className="w-3 h-3 text-green-500" />
                            )}
                            <code className="text-xs">
                              {resultDisplayName.length > 25 ? resultDisplayName.slice(0, 25) + '...' : resultDisplayName}
                            </code>
                            {isWinner && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {(result.quality * 100).toFixed(0)}%
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.executionTimeMs}ms
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Swarm Status */}
            <div className="space-y-1">
              <span className="text-xs font-semibold">Swarm Status</span>
              <div className="pl-6 grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <span className="text-muted-foreground">Specialists:</span>{' '}
                  <span className="font-medium">
                    {trace.swarmCounts.activeSpecialists}/{trace.swarmCounts.totalSpecialists}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Approaches:</span>{' '}
                  <span className="font-medium">
                    {trace.swarmCounts.activeApproaches}/{trace.swarmCounts.totalApproaches}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Signals:</span>{' '}
                  <span className="font-medium">{trace.swarmCounts.totalSignals}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Waves:</span>{' '}
                  <span className="font-medium">{trace.waveCounts.executionCount}</span>
                </div>
              </div>
            </div>

            {/* Task Context */}
            <div className="space-y-1">
              <span className="text-xs font-semibold">Task Analysis</span>
              <div className="pl-6 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    Domain: {trace.taskContext.primaryDomain}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Type: {trace.taskContext.outputType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Complexity: {(trace.taskContext.complexity * 100).toFixed(0)}%
                  </Badge>
                </div>
                {trace.taskContext.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trace.taskContext.keywords.slice(0, 5).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ADDM Decision Timeline - Enhanced */}
            {isADDMMesssage && decisionHistory && decisionHistory.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      ADDM Loop Analysis
                    </span>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {decisionHistory.length} iterations
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: {(decisionHistory.reduce((sum, d) => sum + d.reaction_time, 0) / 1000).toFixed(1)}s
                  </div>
                </div>

                {/* Summary Stats Card */}
                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-100 dark:border-purple-700/30">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {decisionHistory.filter(d => d.decision === 'complete').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {decisionHistory.filter(d => d.decision === 'enhance').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Enhance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {decisionHistory.filter(d => d.decision === 'research').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Research</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-purple-200/30 dark:border-purple-600/30">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Avg Confidence: {
                        (decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / decisionHistory.length * 100).toFixed(0)
                      }%</span>
                      <span>Avg Quality: {
                        (decisionHistory.reduce((sum, d) => sum + d.metrics.quality_score, 0) / decisionHistory.length * 100).toFixed(0)
                      }%</span>
                      <span>Avg RT: {
                        Math.round(decisionHistory.reduce((sum, d) => sum + d.reaction_time, 0) / decisionHistory.length)
                      }ms</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Decision Timeline with Visual Connectors */}
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-purple-200 dark:bg-purple-700" />

                  <div className="space-y-1">
                    {decisionHistory.map((decision, idx) => {
                      const isLast = idx === decisionHistory.length - 1;

                      return (
                        <div key={idx} className="relative flex items-start">
                          {/* Timeline Connector Dot */}
                          <div
                            className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              decision.decision === 'complete'
                                ? 'bg-green-500 border-green-400'
                                : decision.decision === 'enhance'
                                ? 'bg-blue-500 border-blue-400'
                                : 'bg-purple-500 border-purple-400'
                            }`}
                          >
                            {decision.decision === 'complete' ? (
                              <CheckCircle className="w-3 h-3 text-white" />
                            ) : decision.decision === 'enhance' ? (
                              <RefreshCw className="w-3 h-3 text-white" />
                            ) : (
                              <Brain className="w-3 h-3 text-white" />
                            )}
                          </div>

                          {/* Timeline Content */}
                          <div className="flex-1 ml-4 pb-4">
                            <div className="bg-background border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Iteration {idx + 1}</span>
                                  <Badge
                                    variant={
                                      decision.decision === 'complete' ? 'default' :
                                      decision.decision === 'enhance' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs capitalize"
                                  >
                                    {decision.decision}
                                  </Badge>

                                  {/* Final iteration indicator */}
                                  {isLast && (
                                    <Badge variant="destructive" className="text-xs">
                                      Final
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {(decision.confidence * 100).toFixed(0)}%
                                    </span>
                                    confidence
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {decision.reaction_time}ms
                                  </span>
                                </div>
                              </div>

                              {/* Metrics Row */}
                              <div className="grid grid-cols-3 gap-4 text-xs mb-2">
                                <div>
                                  <span className="text-muted-foreground">Quality:</span>
                                  <span className="ml-1 font-medium">
                                    {(decision.metrics.quality_score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Completeness:</span>
                                  <span className="ml-1 font-medium">
                                    {(decision.metrics.completeness_score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Improvement:</span>
                                  <span className="ml-1 font-medium">
                                    {(decision.metrics.improvement_potential * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>

                              {/* Reasoning (Collapsible for longer entries) */}
                              {decision.reasoning && (
                                <details className="group">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none">
                                    <span className="flex items-center gap-1">
                                      Reasoning
                                      <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                    </span>
                                  </summary>
                                  <div className="mt-1 p-2 bg-muted/50 rounded text-xs leading-relaxed">
                                    {decision.reasoning}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>

                          {/* Connector Line (hidden for last item) */}
                          {!isLast && (
                            <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-purple-900 dark:text-purple-100">
                      Loop Performance
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground mb-1">Total Iterations</div>
                      <div className="font-semibold">{decisionHistory.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Total Time</div>
                      <div className="font-semibold">
                        {(decisionHistory.reduce((sum, d) => sum + d.reaction_time, 0) / 1000).toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Avg Decision Time</div>
                      <div className="font-semibold">
                        {Math.round(decisionHistory.reduce((sum, d) => sum + d.reaction_time, 0) / decisionHistory.length)}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Final Confidence</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {(decisionHistory[decisionHistory.length - 1].confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Quality Trend */}
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-muted-foreground text-xs">Quality Trend:</span>
                      <div className="flex gap-0.5">
                        {decisionHistory.slice(-5).map((d, i) => {
                          const quality = d.metrics.quality_score;
                          const height = Math.max(8, Math.round(quality * 20));
                          return (
                            <div
                              key={i}
                              className={`w-1 bg-purple-500 rounded`}
                              style={{ height: `${height}px` }}
                              title={`Iteration ${i + 1}: ${(quality * 100).toFixed(0)}%`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pattern Discovery Status */}
            {trace.waveCounts.patternDiscoveryReady && (
              <div className="pt-2 border-t border-border/50">
                <Badge variant="default" className="text-xs w-full justify-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Pattern Discovery Ready
                </Badge>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
