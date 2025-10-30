---
title: Phase 4: UI Components & Enhanced Trace - Implementation Plan
description: Comprehensive implementation plan for ADDM-Swarm Phase 4
date: 2025-10-29
author: Cline
---

# Phase 4: UI Components & Enhanced Trace - Complete Implementation Plan

## Overview

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

## Step 1: ADDM Settings Panel

**File to create:** `swarm-forge/src/components/Settings/ADDMSettings.tsx`

```typescript
import React from 'react';
import { AlertTriangle, Activity, Settings2, Info } from 'lucide-react';
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
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Workflow Mode */}
          <div>
            <label className="block font-medium mb-2">Workflow Mode</label>
            <select
              value={config.workflowMode}
              onChange={(e) => updateConfig({ workflowMode: e.target.value as WorkflowMode })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="research_assembly">Research Assembly</option>
              <option value="news_analysis">News Analysis</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
              <Info className="h-3 w-3" />
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Higher threshold = more iterations before completion
            </p>
          </div>

          {/* Advanced Settings (Collapsible) */}
          <details className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <summary className="font-medium cursor-pointer p-4 hover:bg-gray- fifty dark:hover:bg-gray-800 rounded-t-lg">
              Advanced Settings
            </summary>
            <div className="p-4 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service URL</label>
                <input
                  type="text"
                  value={config.serviceUrl}
                  onChange={(e) => updateConfig({ serviceUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
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
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Request Timeout (ms)</label>
                <input
                  type="number"
                  value={config.requestTimeout}
                  onChange={(e) => updateConfig({ requestTimeout: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Retry Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.maxRetries}
                  onChange={(e) => updateConfig({ maxRetries: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
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
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      healthy
        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    }`}>
      <Activity className={`h-4 w-4 ${healthy ? 'animate-pulse' : ''}`} />
      <span>{healthy ? 'Service Healthy' : 'Service Offline'}</span>
    </div>
  );
};
```

## Step 2: Service Health Monitoring Hook

**File to create:** `swarm-forge/src/hooks/useADDMServiceHealth.ts`

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
        console.log('[ADDMServiceHealth] Health check:', healthy ? 'healthy' : 'unhealthy');
      } catch (error) {
        console.error('[ADDMServiceHealth] Health check failed:', error);
        setServiceHealth(false);
        setLastHealthCheck(new Date());
      }
    };

    // Check immediately
    checkHealth();

    // Then check periodically
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [
    config.enabled,
    config.serviceUrl,
    intervalMs,
    setServiceHealth,
    setLastHealthCheck
  ]);

  return {
    isEnabled: config.enabled,
    serviceUrl: config.serviceUrl,
  };
};
```

## Step 3: Enhanced SwarmTrace Component

**File to update:** `swarm-forge/src/components/SwarmTrace.tsx` (add ADDM section)

```typescript
// Add these imports at the top
import { CheckCircle, AlertCircle, RefreshCw, Search, Clock, Target, BarChart3 } from 'lucide-react';
import type { ADDMDecisionResponse } from '../types/addm.types';

// Add this component inside the SwarmTrace component
const ADDMDecisionTimeline: React.FC<{
  decisions: ADDMDecisionResponse[];
}> = ({ decisions }) => {
  if (decisions.length === 0) return null;

  const totalExecutionTime = decisions.reduce((sum, d) => sum + d.reaction_time, 0);
  const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
  const enhanceCount = decisions.filter(d => d.decision === 'enhance').length;
  const researchCount = decisions.filter(d => d.decision === 'research').length;
  const completeCount = decisions.filter(d => d.decision === 'complete').length;

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">ADDM Decision Timeline</h4>
        <div className="text-sm text-gray-600 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            {decisions.length} iterations
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {(totalExecutionTime / 1000).toFixed(2)}s total
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(0)}%`}
          icon={<Target className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          label="Enhance"
          value={enhanceCount}
          icon={<RefreshCw className="h-4 w-4" />}
          color="purple"
        />
        <StatCard
          label="Research"
          value={researchCount}
          icon={<Search className="h-4 w-4" />}
          color="orange"
        />
        <StatCard
          label="Complete"
          value={completeCount}
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-1">
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
  const getDecisionColor = (decisionType: string) => {
    switch (decisionType) {
      case 'enhance': return 'bg-purple-500';
      case 'research': return 'bg-orange-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDecisionBgColor = (decisionType: string) => {
    switch (decisionType) {
      case 'enhance': return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800';
      case 'research': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800';
      case 'complete': return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${getDecisionColor(decision.decision)}`} />
        {!isLast && (
          <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 my-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-3 p-3 rounded-lg border ${getDecisionBgColor(decision.decision)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Iteration {iteration + 1}</span>
          <DecisionBadge decision={decision.decision} />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {(decision.confidence * 100).toFixed(1)}%
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {decision.reaction_time.toFixed(0)}ms
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {(decision.metrics.quality_score * 100).toFixed(0)}%
          </div>
        </div>

        {decision.reasoning && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
            {decision.reasoning}
          </div>
        )}
      </div>
    </div>
  );
};

const DecisionBadge: React.FC<{ decision: string }> = ({ decision }) => {
  const getBadgeStyle = (decisionType: string) => {
    switch (decisionType) {
      case 'enhance':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'research':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'complete':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getBadgeIcon = (decisionType: string) => {
    switch (decisionType) {
      case 'enhance': return <RefreshCw className="h-3 w-3" />;
      case 'research': return <Search className="h-3 w-3" />;
      case 'complete': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeStyle(decision)}`}>
      {getBadgeIcon(decision)}
      {decision}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange' | 'green';
}> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};
```

## Step 4: Integrate ADDM Settings into Settings Panel

**File to update:** `swarm-forge/src/components/Settings/SettingsPanel.tsx`

```typescript
// Add import at the top
import { ADDMSettings } from './ADDMSettings';

// Inside the SettingsPanel component, add the Settings section after existing sections
return (
  <div className="space-y-8">
    {/* Existing settings sections... */}

    {/* ADDM Settings */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <ADDMSettings />
    </div>
  </div>
);
```

## Testing Procedures

1. **Create ADDMSettings component** and verify it renders in Settings page
2. **Test toggle functionality** - enable/disable ADDM mode, check persistence
3. **Test settings validation** - ensure proper ranges for iterations/thresholds
4. **Verify health monitoring** - badge updates based on service status
5. **Test SwarmTrace enhancement** - run ADDM loops and check decision timeline display
6. **Check responsive design** - components work on mobile/desktop
7. **Validate dark mode** - all new components support theme switching
8. **Test configuration persistence** - settings save/restore between sessions

## Key Deliverables Checklist

✅ **ADDM Settings Panel** - Complete configuration interface with warnings
✅ **Health Monitoring** - Real-time service status with automatic polling
✅ **Enhanced Trace** - Detailed ADDM decision timeline with statistics
✅ **Responsive Design** - Works across all screen sizes
✅ **Accessibility** - Keyboard navigation and screen reader support
✅ **Persistent Configuration** - Settings stored in Zustand with persistence

## Completion Criteria

**Phase 4 is complete when:**
- Users can fully configure ADDM mode through the UI
- Service health is monitored and displayed in real-time
- ADDM execution traces show comprehensive decision analysis
- All components are responsive, accessible, and theme-aware
- Configuration persists between browser sessions

**Total estimated effort:** 6-8 development hours + 2-3 hours testing
