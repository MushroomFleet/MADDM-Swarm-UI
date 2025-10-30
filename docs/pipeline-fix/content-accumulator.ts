/**
 * Content Accumulator for Structured ADDM Output
 * Handles section collection and organization without merging
 */

import { OutputLabelingSchema, OutputSection, OutputSectionType } from './labeling-schema';

export interface ContentAccumulatorConfig {
  enableAgentNotes: boolean;
  enableSwarmStats: boolean;
  maxResearchSections: number;
  includeTimestamps: boolean;
}

export class ContentAccumulator {
  private sections: OutputSection[] = [];
  private outputId: string;
  private config: ContentAccumulatorConfig;
  private researchIterationCount = 0;

  constructor(outputId: string, config: Partial<ContentAccumulatorConfig> = {}) {
    this.outputId = outputId;
    this.config = {
      enableAgentNotes: true,
      enableSwarmStats: true,
      maxResearchSections: 10,
      includeTimestamps: true,
      ...config,
    };
  }

  /**
   * Add a new content section
   */
  addSection(
    content: string,
    type: OutputSectionType,
    iteration: number,
    decisionType?: 'research' | 'enhance' | 'complete'
  ): OutputSection {
    let section: OutputSection;

    if (type === 'research') {
      this.researchIterationCount++;
      // Limit research sections if configured
      if (this.researchIterationCount > this.config.maxResearchSections) {
        console.warn(`[ContentAccumulator] Max research sections (${this.config.maxResearchSections}) exceeded`);
      }
      section = OutputLabelingSchema.createSection(
        this.outputId,
        type,
        iteration,
        decisionType,
        this.researchIterationCount
      );
    } else {
      section = OutputLabelingSchema.createSection(
        this.outputId,
        type,
        iteration,
        decisionType
      );
    }

    section.content = content;
    if (this.config.includeTimestamps) {
      section.timestamp = Date.now();
    }

    this.sections.push(section);
    console.log(`[ContentAccumulator] Added section: ${section.label} (${content.length} chars)`);

    return section;
  }

  /**
   * Get sections by type
   */
  getSectionsByType(type: OutputSectionType): OutputSection[] {
    return this.sections.filter(section => section.type === type);
  }

  /**
   * Get all sections in order
   */
  getAllSections(): OutputSection[] {
    return [...this.sections];
  }

  /**
   * Get content for enhance iteration (all research sections)
   */
  getResearchContentForEnhancement(): string {
    const researchSections = this.getSectionsByType('research');
    if (researchSections.length === 0) {
      return '';
    }

    return researchSections
      .map(section => section.content || '')
      .filter(content => content.trim().length > 0)
      .join('\n\n---\n\n');
  }

  /**
   * Get the initial section (should be only one)
   */
  getInitialSection(): OutputSection | null {
    const initialSections = this.getSectionsByType('initial');
    return initialSections.length > 0 ? initialSections[0] : null;
  }

  /**
   * Calculate aggregate statistics
   */
  getAggregatedStats(): {
    totalSections: number;
    totalContentLength: number;
    sectionsByType: Record<OutputSectionType, number>;
    researchIterationCount: number;
  } {
    const stats = {
      totalSections: this.sections.length,
      totalContentLength: this.sections.reduce((sum, s) => sum + (s.content?.length || 0), 0),
      sectionsByType: {
        'agent-notes': 0,
        'initial': 0,
        'research': 0,
        'enhance': 0,
        'swarm-stats': 0,
      },
      researchIterationCount: this.researchIterationCount,
    };

    this.sections.forEach(section => {
      stats.sectionsByType[section.type]++;
    });

    return stats;
  }

  /**
   * Validate section collection completeness
   */
  validateCollection(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Must have at least one initial section
    if (this.getSectionsByType('initial').length === 0) {
      errors.push('Missing initial section');
    }

    // Should have only one initial section
    if (this.getSectionsByType('initial').length > 1) {
      errors.push('Multiple initial sections found');
    }

    // Should have at most one enhance section
    if (this.getSectionsByType('enhance').length > 1) {
      errors.push('Multiple enhance sections found');
    }

    // No duplicate section IDs
    const sectionIds = this.sections.map(s => s.id);
    const uniqueIds = new Set(sectionIds);
    if (sectionIds.length !== uniqueIds.size) {
      errors.push('Duplicate section IDs found');
    }

    // Check for empty content
    const emptySections = this.sections.filter(s => !s.content || s.content.trim().length === 0);
    if (emptySections.length > 0) {
      errors.push(`${emptySections.length} sections have empty content`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all sections (for reset)
   */
  clear(): void {
    this.sections = [];
    this.researchIterationCount = 0;
  }

  /**
   * Get the output ID
   */
  getOutputId(): string {
    return this.outputId;
  }

  /**
   * Clone accumulator state
   */
  clone(): ContentAccumulator {
    const clone = new ContentAccumulator(this.outputId, this.config);
    clone.sections = [...this.sections];
    clone.researchIterationCount = this.researchIterationCount;
    return clone;
  }
}

/**
 * Content Accumulator Factory
 */
export class ContentAccumulatorFactory {
  static createFromTemplate(template: AccumulationTemplate): ContentAccumulator {
    const accumulator = new ContentAccumulator(template.outputId, template.config);

    // Add sections from template if specified
    if (template.initialSections) {
      template.initialSections.forEach(section => {
        accumulator.addSection(section.content, section.type, section.iteration, section.decisionType);
      });
    }

    return accumulator;
  }
}

export interface AccumulationTemplate {
  outputId: string;
  config: ContentAccumulatorConfig;
  initialSections?: Array<{
    content: string;
    type: OutputSectionType;
    iteration: number;
    decisionType?: 'research' | 'enhance' | 'complete';
  }>;
}

/**
 * Usage Example:
 *
 * const accumulator = new ContentAccumulator('output_12345_ABC', {
 *   enableAgentNotes: true,
 *   enableSwarmStats: true,
 *   maxResearchSections: 5,
 * });
 *
 * accumulator.addSection('Initial content...', 'initial', 0);
 * accumulator.addSection('Research findings...', 'research', 1, 'research');
 * accumulator.addSection('Final synthesis...', 'enhance', 2, 'enhance');
 *
 * const stats = accumulator.getAggregatedStats();
 * const outputSections = accumulator.getAllSections();
 */
