import { ChatMessage, SwarmTraceData } from '@/core/types';
import { format } from 'date-fns';

/**
 * Format a single message as markdown with optional swarm trace footer
 */
export function formatMessageAsMarkdown(message: ChatMessage): string {
  const timestamp = format(message.timestamp, 'yyyy-MM-dd HH:mm:ss');
  
  let markdown = `# Response - ${timestamp}\n\n`;
  markdown += message.content;
  
  // Add swarm trace as footer if available
  if (message.swarmTrace) {
    markdown += '\n\n---\n\n';
    markdown += formatSwarmTraceFooter(message.swarmTrace);
  }
  
  return markdown;
}

/**
 * Format swarm trace as markdown footer
 */
function formatSwarmTraceFooter(trace: SwarmTraceData): string {
  let footer = '## Swarm Trace\n\n';
  
  // Specialist section
  footer += '### Specialist\n';
  footer += `- **ID:** \`${trace.specialistId}\`\n`;
  footer += `- **Executions:** ${trace.specialistStats.totalExecutions}\n`;
  footer += `- **Success Rate:** ${(trace.specialistStats.successRate * 100).toFixed(0)}%\n`;
  footer += `- **Avg Quality:** ${(trace.specialistStats.avgQuality * 100).toFixed(0)}%\n`;
  footer += `- **Specialization:** ${(trace.specialistStats.specializationStrength * 100).toFixed(0)}%\n\n`;
  
  // Approach section
  footer += '### Approach\n';
  footer += `- **Name:** ${trace.approachName}\n`;
  footer += `- **ID:** \`${trace.approachId}\`\n`;
  footer += `- **Usage Count:** ${trace.approachStats.usageCount}\n`;
  footer += `- **Avg Quality:** ${(trace.approachStats.avgQuality * 100).toFixed(0)}%\n`;
  footer += `- **Trend:** ${trace.approachStats.trend}\n\n`;
  
  // Quality metrics
  footer += '### Quality Metrics\n';
  footer += `- **Target:** ${(trace.qualityTarget * 100).toFixed(0)}%\n`;
  footer += `- **Actual:** ${(trace.actualQuality * 100).toFixed(0)}%\n\n`;
  
  // Swarm status
  footer += '### Swarm Status\n';
  footer += `- **Specialists:** ${trace.swarmCounts.activeSpecialists}/${trace.swarmCounts.totalSpecialists} active\n`;
  footer += `- **Approaches:** ${trace.swarmCounts.activeApproaches}/${trace.swarmCounts.totalApproaches} active\n`;
  footer += `- **Signals:** ${trace.swarmCounts.totalSignals}\n`;
  footer += `- **Waves:** ${trace.waveCounts.executionCount}\n`;
  footer += `- **Pattern Discovery:** ${trace.waveCounts.patternDiscoveryReady ? '✅ Ready' : '⏳ Not ready'}\n\n`;
  
  // Task context
  footer += '### Task Analysis\n';
  footer += `- **Domain:** ${trace.taskContext.primaryDomain}\n`;
  footer += `- **Output Type:** ${trace.taskContext.outputType}\n`;
  footer += `- **Complexity:** ${(trace.taskContext.complexity * 100).toFixed(0)}%\n`;
  
  if (trace.taskContext.keywords.length > 0) {
    footer += `- **Keywords:** ${trace.taskContext.keywords.slice(0, 10).join(', ')}\n`;
  }
  
  return footer;
}

/**
 * Format entire conversation as markdown with inline traces
 */
export function formatConversationAsMarkdown(messages: ChatMessage[]): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  
  let markdown = `# Swarm Conversation Log\n`;
  markdown += `**Exported:** ${timestamp}\n`;
  markdown += `**Messages:** ${messages.length}\n\n`;
  markdown += '---\n\n';
  
  messages.forEach((message, index) => {
    const msgTime = format(message.timestamp, 'HH:mm:ss');
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    
    markdown += `## Message ${index + 1} - ${role} (${msgTime})\n\n`;
    markdown += message.content + '\n\n';
    
    // Add inline swarm trace for assistant messages
    if (message.role === 'assistant' && message.swarmTrace) {
      markdown += '<details>\n';
      markdown += '<summary>📊 Swarm Trace</summary>\n\n';
      markdown += formatSwarmTraceInline(message.swarmTrace);
      markdown += '</details>\n\n';
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

/**
 * Format swarm trace as inline collapsible section
 */
function formatSwarmTraceInline(trace: SwarmTraceData): string {
  let inline = '';
  
  inline += '**Specialist:** ';
  inline += `\`${trace.specialistId}\` `;
  inline += `(${trace.specialistStats.totalExecutions} executions, `;
  inline += `${(trace.specialistStats.successRate * 100).toFixed(0)}% success)\n\n`;
  
  inline += '**Approach:** ';
  inline += `${trace.approachName} `;
  inline += `(${trace.approachStats.usageCount} uses, `;
  inline += `${(trace.approachStats.avgQuality * 100).toFixed(0)}% avg quality, `;
  inline += `trend: ${trace.approachStats.trend})\n\n`;
  
  inline += '**Quality:** ';
  inline += `${(trace.actualQuality * 100).toFixed(0)}% `;
  inline += `(target: ${(trace.qualityTarget * 100).toFixed(0)}%)\n\n`;
  
  inline += '**Swarm:** ';
  inline += `${trace.swarmCounts.activeSpecialists}/${trace.swarmCounts.totalSpecialists} specialists, `;
  inline += `${trace.swarmCounts.activeApproaches}/${trace.swarmCounts.totalApproaches} approaches, `;
  inline += `${trace.swarmCounts.totalSignals} signals, `;
  inline += `wave ${trace.waveCounts.executionCount}\n\n`;
  
  return inline;
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  return `${prefix}-${timestamp}.md`;
}

/**
 * Download content as markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
