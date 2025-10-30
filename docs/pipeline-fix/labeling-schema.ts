/**
 * Labeling Schema for Structured ADDM Output
 * Handles dynamic ID generation and section naming based on ADDM decisions
 */

export interface OutputSection {
  id: string;
  label: string;
  type: OutputSectionType;
  timestamp: number;
  iteration: number;
  decisionType?: 'research' | 'enhance' | 'complete';
  content?: string;
}

export type OutputSectionType =
  | 'agent-notes'
  | 'initial'
  | 'research'
  | 'enhance'
  | 'swarm-stats';

export class OutputLabelingSchema {
  private static idCounter = 0;

  /**
   * Generate unique output ID for the session
   */
  static generateOutputId(timestamp: number = Date.now()): string {
    const sessionId = this.getSessionId();
    return `output_${timestamp}_${sessionId}`;
  }

  /**
   * Generate section label based on type and context
   */
  static generateSectionLabel(
    baseId: string,
    type: OutputSectionType,
    iteration: number,
    researchCount?: number
  ): string {
    const prefix = `name: ${baseId}`;

    switch (type) {
      case 'agent-notes':
        return `${prefix}_AgentNotes`;

      case 'initial':
        return `${prefix}_Initial`;

      case 'research':
        const researchNum = researchCount || 1;
        return `${prefix}_Research_${researchNum}`;

      case 'enhance':
        return `${prefix}_Enhance`;

      case 'swarm-stats':
        return `${prefix}_SwarmStats`;

      default:
        return `${prefix}_Unknown`;
    }
  }

  /**
   * Create section metadata
   */
  static createSection(
    baseId: string,
    type: OutputSectionType,
    iteration: number,
    decisionType?: 'research' | 'enhance' | 'complete',
    researchCount?: number
  ): OutputSection {
    return {
      id: this.generateSectionId(baseId, type, iteration),
      label: this.generateSectionLabel(baseId, type, iteration, researchCount),
      type,
      timestamp: Date.now(),
      iteration,
      decisionType,
    };
  }

  /**
   * Format section for markdown output
   */
  static formatSection(section: OutputSection): string {
    const separator = '\n---\n\n';
    const header = `${section.label}\n\n`;
    const content = section.content || '[Content pending]';

    return `${separator}${header}${content}`;
  }

  /**
   * Format agent notes section with structured data
   */
  static formatAgentNotes(notes: AgentNotes): string {
    const formattedNotes = JSON.stringify(notes, null, 2);
    return `## Agent Notes and Decision History\n\`\`\`json\n${formattedNotes}\n\`\`\`\n\n---\n`;
  }

  /**
   * Format swarm statistics section
   */
  static formatSwarmStats(stats: SwarmStats): string {
    return `## Swarm Statistics and Performance Metrics\n\n- **Specialists:** ${stats.specialistsActive}/${stats.specialistsTotal} active\n- **Approaches:** ${stats.approachesActive}/${stats.approachesTotal} active\n- **Signals Processed:** ${stats.signalsProcessed}\n- **Waves Completed:** ${stats.wavesCompleted}\n- **Quality Target:** ${stats.qualityTarget}%\n- **Quality Actual:** ${stats.qualityActual}%\n- **Pattern Discovery:** ${stats.patternDiscoveryReady ? '✓ Ready' : '⏳ Not ready'}\n- **Execution Time:** ${stats.executionTime}ms\n\n---\n`;
  }

  /**
   * Validate section structure
   */
  static validateSection(section: OutputSection): boolean {
    return !!(
      section.id &&
      section.label &&
      section.type &&
      section.timestamp > 0 &&
      section.iteration >= 0
    );
  }

  /**
   * Parse sections from markdown output
   */
  static parseSections(markdownContent: string): OutputSection[] {
    const sections: OutputSection[] = [];
    const sectionRegex = /---\n\nname: (output_\d+_[^_]+)_([^\\\n]+)\n\n([\s\S]*?)(?=\n---\n|$)/g;

    let match;
    while ((match = sectionRegex.exec(markdownContent)) !== null) {
      const [_, baseId, labelSuffix, content] = match;
      const section = this.parseLabelToSection(`${baseId}_${labelSuffix}`, content);
      if (section) {
        sections.push(section);
      }
    }

    return sections;
  }

  /**
   * Private helpers
   */
  private static generateSectionId(baseId: string, type: OutputSectionType, iteration: number): string {
    return `${baseId}_${type}_${iteration}_${Date.now()}`;
  }

  private static getSessionId(): string {
    // Use counter for simple uniqueness, could be replaced with UUID
    this.idCounter++;
    return this.idCounter.toString(36).padStart(4, '0').toUpperCase();
  }

  private static parseLabelToSection(label: string, content: string): OutputSection | null {
    // Extract components from label: output_TIMESTAMP_SESSION_TYPE
    const labelRegex = /output_(\d+)_([^_]+)_(.+)/;
    const match = label.match(labelRegex);

    if (!match) return null;

    const [, timestamp, sessionId, typeInfo] = match;
    const baseId = `output_${timestamp}_${sessionId}`;

    // Parse type and iteration from typeInfo
    const typeMatch = typeInfo.match(/(.+)_(\d+)$/);
    if (!typeMatch) return null;

    const [_, type, iteration] = typeMatch;

    return {
      id: `parsed_${Date.now()}`,
      label: `name: ${label}`,
      type: type as OutputSectionType,
      timestamp: parseInt(timestamp, 10),
      iteration: parseInt(iteration, 10),
      content,
    };
  }
}

export interface AgentNotes {
  sessionStart: string;
  totalIterations: number;
  decisions: Array<{
    iteration: number;
    decision: 'research' | 'enhance' | 'complete';
    confidence: number;
    reasoning: string;
    timestamp: string;
    refinementStrategy?: any;
  }>;
  finalOutcome: {
    success: boolean;
    qualityScore: number;
    executionTime: number;
  };
}

export interface SwarmStats {
  specialistsActive: number;
  specialistsTotal: number;
  approachesActive: number;
  approachesTotal: number;
  signalsProcessed: number;
  wavesCompleted: number;
  qualityTarget: number;
  qualityActual: number;
  patternDiscoveryReady: boolean;
  executionTime: number;
}

/**
 * Usage Examples:
 *
 * const schema = new OutputLabelingSchema();
 * const baseId = schema.generateOutputId();
 * // output_1643723400000_A1B2
 *
 * const initialSection = schema.createSection(baseId, 'initial', 0);
 * const researchSection = schema.createSection(baseId, 'research', 1, 'research', 1);
 *
 * // Generate formatted output
 * const markdown = schema.formatSection(initialSection);
 */
