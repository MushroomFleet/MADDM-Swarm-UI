import React from 'react';
import { AlertTriangle, Activity, Settings2, RefreshCw, Cpu, DollarSign } from 'lucide-react';
import { useADDMStore } from '../../stores/ADDMStore';
import { useADDMServiceHealth } from '../../hooks/useADDMServiceHealth';
import type { WorkflowMode } from '../../types/addm.types';

export const ADDMSettings: React.FC = () => {
  const {
    config: addmConfig,
    updateConfig: updateAddmConfig,
    serviceHealth,
    setLastHealthCheck,
    setServiceHealth
  } = useADDMStore();

  const { manualHealthCheck, isCheckingHealth } = useADDMServiceHealth({
    intervalMs: 30000, // 30 second intervals
  });

  const handleManualHealthCheck = () => {
    manualHealthCheck();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-purple-500" />
          <div>
            <h3 className="text-lg font-semibold">ADDM Loop Regulator</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent loop control with quality assessment and research capabilities
            </p>
          </div>
        </div>
        <ServiceHealthBadge
          healthy={serviceHealth}
          isChecking={isCheckingHealth}
          onManualCheck={handleManualHealthCheck}
        />
      </div>

      {/* High Cost Warning Banner */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
              ⚠️ High Token Usage Warning
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
              ADDM mode runs multiple iterations, potentially using <strong>5-20x more tokens</strong> than standard mode.
              Each iteration executes full swarm coordination and LLM analysis. Monitor your API usage carefully when using this mode.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
              <DollarSign className="h-4 w-4" />
              <span>Typical usage: 10k-50k tokens per complex query</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Cpu className="h-5 w-5 text-purple-500" />
            <label className="font-medium text-sm text-gray-900 dark:text-gray-100">Enable ADDM Mode</label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Activate intelligent loop control that decides when to enhance responses,
            gather additional research, or complete delivery to users.
          </p>
          {!serviceHealth && addmConfig.enabled && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ADDM service offline - mode will fallback to standard execution
            </p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={addmConfig.enabled}
            onChange={(e) => updateAddmConfig({ enabled: e.target.checked })}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {addmConfig.enabled && (
        <>
          {/* Workflow Mode Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">Workflow Mode</h4>
              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                Tailors quality assessment
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                addmConfig.workflowMode === 'research_assembly'
                  ? 'border-purple-300 bg-purple-100 dark:bg-purple-900 text-gray-900 dark:text-gray-100'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                <input
                  type="radio"
                  name="workflowMode"
                  value="research_assembly"
                  checked={addmConfig.workflowMode === 'research_assembly'}
                  onChange={(e) => updateAddmConfig({ workflowMode: e.target.value as WorkflowMode })}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Research Assembly</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Optimized for scientific and technical analysis with citation verification
                  </div>
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  Recommended
                </div>
              </label>

              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                addmConfig.workflowMode === 'news_analysis'
                  ? 'border-purple-300 bg-purple-100 dark:bg-purple-900 text-gray-900 dark:text-gray-100'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                <input
                  type="radio"
                  name="workflowMode"
                  value="news_analysis"
                  checked={addmConfig.workflowMode === 'news_analysis'}
                  onChange={(e) => updateAddmConfig({ workflowMode: e.target.value as WorkflowMode })}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">News Analysis</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Focused on balanced viewpoints and historical context coverage
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Max Iterations Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-medium text-sm mb-1">
                  Maximum Iterations: {addmConfig.maxIterations}
                </label>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Conservative: 1-5</span>
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">Moderate: 6-10</span>
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Aggressive: 11-20</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="20"
                value={addmConfig.maxIterations}
                onChange={(e) => updateAddmConfig({ maxIterations: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🛡️ Quick & Safe</span>
                <span>⚖️ Balanced</span>
                <span>🔬 Deep Analysis</span>
                <span>🧬 Exhaustive</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher values allow more comprehensive analysis but use significantly more tokens.
              System automatically stops when ADDM decides content is ready for users.
            </p>
          </div>

          {/* Confidence Threshold Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-medium text-sm mb-1">
                Confidence Threshold: {(addmConfig.confidenceThreshold * 100).toFixed(0)}%
              </label>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={addmConfig.confidenceThreshold}
                onChange={(e) => updateAddmConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Open Loop</span>
                <span>Balanced</span>
                <span>Conservative</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Lower threshold = more iterations before completion. Higher threshold = fewer iterations but potentially less comprehensive.
            </p>
          </div>

          {/* Advanced Settings (Collapsible) */}
          <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
            <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between marker:hidden">
              <span>Advanced Settings</span>
              <span className="text-xs text-muted-foreground">Click to expand</span>
            </summary>

            <div className="mt-4 space-y-4">
              {/* Service URL */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">ADDM Service URL</label>
                <input
                  type="text"
                  value={addmConfig.serviceUrl}
                  onChange={(e) => updateAddmConfig({ serviceUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-background focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="http://localhost:8000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Endpoint where ADDM Python service is running
                </p>
              </div>

              {/* Context Summarization Threshold */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Context Summarization Threshold: {addmConfig.contextSummarizationThreshold.toLocaleString()} chars
                </label>
                <input
                  type="range"
                  min="8000"
                  max="128000"
                  step="8000"
                  value={addmConfig.contextSummarizationThreshold}
                  onChange={(e) => updateAddmConfig({ contextSummarizationThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>32K</span>
                  <span>64K</span>
                  <span>128K</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  When total context exceeds this size, system automatically summarizes previous iterations
                </p>
              </div>

              {/* Request Timeout */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Request Timeout: {Math.round(addmConfig.requestTimeout / 1000)}s
                </label>
                <input
                  type="range"
                  min="5000"
                  max="60000"
                  step="5000"
                  value={addmConfig.requestTimeout}
                  onChange={(e) => updateAddmConfig({ requestTimeout: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5s</span>
                  <span>30s</span>
                  <span>60s</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum time to wait for individual ADDM decisions
                </p>
              </div>

              {/* Max Retries */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Max Retry Attempts: {addmConfig.maxRetries}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={addmConfig.maxRetries}
                  onChange={(e) => updateAddmConfig({ maxRetries: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of retries for failed ADDM API requests before giving up
                </p>
              </div>
            </div>
          </details>
        </>
      )}

      {/* Usage Statistics Preview */}
      {addmConfig.enabled && (
        <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Expected Usage</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-blue-700 dark:text-blue-300 font-medium">Token Estimate</div>
              <div className="text-blue-600 dark:text-blue-400">
                {Math.round(addmConfig.maxIterations * 1000).toLocaleString()}-{(Math.round(addmConfig.maxIterations * 3000)).toLocaleString()} tokens
              </div>
            </div>
            <div>
              <div className="text-blue-700 dark:text-blue-300 font-medium">Cost Estimate</div>
              <div className="text-blue-600 dark:text-blue-400">
                ${(addmConfig.maxIterations * 0.003).toFixed(2)}-$${(addmConfig.maxIterations * 0.01).toFixed(2)}
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-2 italic">
            Per query estimates based on {addmConfig.maxIterations} max iterations.
            Actual usage varies based on content length and LLM responses.
          </p>
        </div>
      )}
    </div>
  );
};

const ServiceHealthBadge: React.FC<{
  healthy: boolean;
  isChecking: boolean;
  onManualCheck: () => void;
}> = ({ healthy, isChecking, onManualCheck }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isChecking
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
          : healthy
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {isChecking ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Activity className={`h-4 w-4 ${
            healthy ? 'animate-pulse' : 'animate-none'
          }`} />
        )}
        <span>{isChecking ? 'Checking...' : healthy ? 'Service Healthy' : 'Service Offline'}</span>
      </div>

      <button
        onClick={onManualCheck}
        disabled={isChecking}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Manual health check"
      >
        <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

/**
 * Custom CSS for purple slider thumbs
 */
const styles = `
.slider-thumb-purple::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #9333ea;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #9333ea;
}

.slider-thumb-purple::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #9333ea;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #9333ea;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
