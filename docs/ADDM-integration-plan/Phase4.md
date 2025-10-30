# Phase 4: UI Components & Enhanced Trace

## Phase Overview

**Goal:** Create comprehensive UI for ADDM configuration and enhanced trace display

**Prerequisites:**
- Phase 3 complete (React integration working)
- Component library (TailwindCSS, lucide-react) available
- SystemConfig panel accessible

**Estimated Duration:** 5-7 days

**Key Deliverables:**
- ADDM Settings panel with configuration options
- Warning messages for token costs
- Enhanced SwarmTrace with decision timeline
- Progress indicator with iteration status
- Service health indicator

## Step-by-Step Implementation

### Step 1: ADDM Settings Panel

**Purpose:** User interface for configuring ADDM mode

**Duration:** 6-8 hours

#### Code Example: `src/components/settings/ADDMSettings.tsx`

```typescript
import React from 'react';
import { AlertTriangle, Activity, Settings2 } from 'lucide-react';
import { useADDMStore } from '../../stores/ADDMStore';
import type { WorkflowMode } from '../../types/addm.types';

export const ADDMSettings: React.FC = () => {
  const { config, updateConfig, serviceHealth } = useADDMStore();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">ADDM Loop Regulator</h3>
        </div>
        <ServiceHealthBadge healthy={serviceHealth} />
      </div>
      
      {/* Warning Banner */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
              High Token Usage Warning
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ADDM mode runs multiple iterations, potentially using 5-20x more tokens than standard mode.
              Each iteration executes a full LLM request. Monitor your usage carefully.
            </p>
          </div>
        </div>
      </div>
      
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="font-medium">Enable ADDM Mode</label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Intelligent loop control with quality assessment
          </p>
        </div>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => updateConfig({ enabled: e.target.checked })}
          className="w-12 h-6 rounded-full"
        />
      </div>
      
      {config.enabled && (
        <>
          {/* Workflow Mode */}
          <div>
            <label className="block font-medium mb-2">Workflow Mode</label>
            <select
              value={config.workflowMode}
              onChange={(e) => updateConfig({ workflowMode: e.target.value as WorkflowMode })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="research_assembly">Research Assembly</option>
              <option value="news_analysis">News Analysis</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Tailors quality assessment criteria
            </p>
          </div>
          
          {/* Max Iterations */}
          <div>
            <label className="block font-medium mb-2">
              Maximum Iterations: {config.maxIterations}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={config.maxIterations}
              onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>Conservative (1-5)</span>
              <span>Moderate (6-10)</span>
              <span>Aggressive (11-20)</span>
            </div>
          </div>
          
          {/* Confidence Threshold */}
          <div>
            <label className="block font-medium mb-2">
              Confidence Threshold: {(config.confidenceThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={config.confidenceThreshold}
              onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Higher threshold = more iterations before completion
            </p>
          </div>
          
          {/* Advanced Settings (Collapsible) */}
          <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="font-medium cursor-pointer">Advanced Settings</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service URL</label>
                <input
                  type="text"
                  value={config.serviceUrl}
                  onChange={(e) => updateConfig({ serviceUrl: e.target.value })}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Context Summarization Threshold (characters)
                </label>
                <input
                  type="number"
                  value={config.contextSummarizationThreshold}
                  onChange={(e) => updateConfig({ contextSummarizationThreshold: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Request Timeout (ms)</label>
                <input
                  type="number"
                  value={config.requestTimeout}
                  onChange={(e) => updateConfig({ requestTimeout: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
};

const ServiceHealthBadge: React.FC<{ healthy: boolean }> = ({ healthy }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      healthy
        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    }`}>
      <Activity className="h-4 w-4" />
      <span>{healthy ? 'Service Healthy' : 'Service Offline'}</span>
    </div>
  );
};
```

### Step 2: Service Health Checker

**Purpose:** Background health monitoring

**Duration:** 3-4 hours

#### Code Example: `src/hooks/useADDMServiceHealth.ts`

```typescript
import { useEffect } from 'react';
import { useADDMStore } from '../stores/ADDMStore';
import { ADDMClient } from '../services/ADDMClient';

export const useADDMServiceHealth = (intervalMs: number = 30000) => {
  const { config, setServiceHealth, setLastHealthCheck } = useADDMStore();
  
  useEffect(() => {
    if (!config.enabled) return;
    
    const client = new ADDMClient(config);
    
    const checkHealth = async () => {
      try {
        const healthy = await client.healthCheck();
        setServiceHealth(healthy);
        setLastHealthCheck(new Date());
      } catch (error) {
        setServiceHealth(false);
        setLastHealthCheck(new Date());
      }
    };
    
    // Check immediately
    checkHealth();
    
    // Then check periodically
    const interval = setInterval(checkHealth, intervalMs);
    
    return () => clearInterval(interval);
  }, [config.enabled, config.serviceUrl, intervalMs, setServiceHealth, setLastHealthCheck]);
};
```

### Step 3: Enhanced SwarmTrace Component

**Purpose:** Display comprehensive ADDM decision timeline

**Duration:** 4-5 hours

#### Code Example: Enhanced SwarmTrace sections

```typescript
// Add to SwarmTrace component
const ADDMDecisionTimeline: React.FC<{
  decisions: ADDMDecisionResponse[];
}> = ({ decisions }) => {
  const totalExecutionTime = decisions.reduce((sum, d) => sum + d.reaction_time, 0);
  const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
  
  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">ADDM Decision Timeline</h4>
        <div className="text-sm text-gray-600">
          {decisions.length} iterations | {(totalExecutionTime / 1000).toFixed(2)}s total
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(0)}%`}
          icon={<CheckCircle />}
        />
        <StatCard
          label="Enhance"
          value={decisions.filter(d => d.decision === 'enhance').length}
          icon={<RefreshCw />}
        />
        <StatCard
          label="Research"
          value={decisions.filter(d => d.decision === 'research').length}
          icon={<Search />}
        />
      </div>
      
      {/* Timeline */}
      <div className="space-y-2">
        {decisions.map((decision, idx) => (
          <DecisionTimelineItem
            key={idx}
            iteration={idx}
            decision={decision}
            isLast={idx === decisions.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const DecisionTimelineItem: React.FC<{
  iteration: number;
  decision: ADDMDecisionResponse;
  isLast: boolean;
}> = ({ iteration, decision, isLast }) => {
  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${
          decision.decision === 'complete' ? 'bg-green-500' :
          decision.decision === 'enhance' ? 'bg-blue-500' :
          'bg-purple-500'
        }`} />
        {!isLast && (
          <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 my-1" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">Iteration {iteration}</span>
          <DecisionBadge decision={decision.decision} />
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>Confidence: {(decision.confidence * 100).toFixed(1)}%</div>
          <div>RT: {decision.reaction_time.toFixed(0)}ms</div>
          <div>Quality: {(decision.metrics.quality_score * 100).toFixed(0)}%</div>
        </div>
        
        {decision.reasoning && (
          <div className="mt-2 text-xs text-gray-500 line-clamp-2">
            {decision.reasoning}
          </div>
        )}
      </div>
    </div>
  );
};
```

## Testing Procedures

### Visual Testing
- Test in light and dark modes
- Verify responsive design on mobile
- Check accessibility (keyboard navigation, screen readers)

### User Testing
- Get feedback on settings clarity
- Verify warning messages are clear
- Test with actual ADDM loops

## Troubleshooting

**Issue:** Settings not persisting
**Solution:** Check Zustand persist configuration

**Issue:** Health badge not updating
**Solution:** Verify health check interval, check console for errors

## Next Steps

✅ **Phase 4 Complete when:**
- Settings panel functional
- Health monitoring works
- Enhanced trace displays decisions
- UI is polished and accessible

**Proceed to:** Phase 5 - Testing & Validation

---

**Phase 4 Character Count:** ~12,000
