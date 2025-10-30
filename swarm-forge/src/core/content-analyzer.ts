import { ContentFeatures } from './types';

/**
 * Content Analyzer
 * 
 * Port of src/content_analyzer.py ContentAnalyzer class.
 * 
 * Extracts structural and stylistic features from generated content.
 * Used for pattern discovery and style characteristic inference.
 */
export class ContentAnalyzer {
  /**
   * Analyze content and extract all features
   * 
   * Matches Python: ContentAnalyzer.analyze_content() method
   */
  analyzeContent(content: string): ContentFeatures {
    return {
      // Structure
      sectionCount: this.countSections(content),
      hasCodeBlocks: this.hasCodeBlocks(content),
      codeBlockCount: this.countCodeBlocks(content),
      hasNumberedList: this.hasNumberedList(content),
      hasBullets: this.hasBullets(content),
      hasTables: this.hasTables(content),

      // Length
      totalLength: content.length,
      avgSectionLength: this.calculateAvgSectionLength(content),

      // Style
      detectedTone: this.detectTone(content),
      formalityScore: this.calculateFormality(content),

      // Content distribution
      explanationRatio: this.calculateExplanationRatio(content),
      exampleRatio: this.calculateExampleRatio(content),
      codeRatio: this.calculateCodeRatio(content),
    };
  }

  /**
   * Count sections (headers)
   */
  private countSections(content: string): number {
    const headers = content.match(/^#{1,6}\s+.+$/gm);
    return headers ? headers.length : 1;
  }

  /**
   * Check if content has code blocks
   */
  private hasCodeBlocks(content: string): boolean {
    return /```/.test(content);
  }

  /**
   * Count code blocks
   */
  private countCodeBlocks(content: string): number {
    const matches = content.match(/```/g);
    return matches ? Math.floor(matches.length / 2) : 0;
  }

  /**
   * Check for numbered lists
   */
  private hasNumberedList(content: string): boolean {
    return /^\d+\.\s+/m.test(content);
  }

  /**
   * Check for bullet lists
   */
  private hasBullets(content: string): boolean {
    return /^[-*]\s+/m.test(content);
  }

  /**
   * Check for tables
   */
  private hasTables(content: string): boolean {
    return /\|.*\|/.test(content);
  }

  /**
   * Calculate average section length
   */
  private calculateAvgSectionLength(content: string): number {
    const sections = content.split(/^#{1,6}\s+.+$/gm);
    if (sections.length === 0) return content.length;

    const totalLength = sections.reduce((sum, s) => sum + s.trim().length, 0);
    return Math.floor(totalLength / sections.length);
  }

  /**
   * Detect tone from content
   */
  private detectTone(content: string): string {
    const formalityScore = this.calculateFormality(content);

    if (formalityScore > 0.7) return 'formal';
    if (formalityScore > 0.5) return 'technical';
    if (formalityScore > 0.3) return 'educational';
    return 'casual';
  }

  /**
   * Calculate formality score
   */
  private calculateFormality(content: string): number {
    let score = 0.5;

    // Formal indicators
    if (/\b(furthermore|moreover|consequently|therefore)\b/i.test(content)) {
      score += 0.2;
    }
    if (/\b(shall|ought|must|should)\b/i.test(content)) {
      score += 0.1;
    }

    // Casual indicators
    if (/\b(gonna|wanna|kinda|sorta)\b/i.test(content)) {
      score -= 0.2;
    }
    if (/!{2,}/.test(content)) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate explanation ratio
   */
  private calculateExplanationRatio(content: string): number {
    const codeContent = this.extractCodeContent(content);
    const exampleMarkers = (content.match(/example|for instance|such as/gi) || []).length;

    const nonCodeLength = content.length - codeContent.length;
    const explanationEstimate = nonCodeLength - exampleMarkers * 100;

    return Math.max(0, Math.min(1, explanationEstimate / content.length));
  }

  /**
   * Calculate example ratio
   */
  private calculateExampleRatio(content: string): number {
    const exampleMarkers = (content.match(/example|for instance|such as/gi) || []).length;
    const estimatedExampleLength = exampleMarkers * 150;

    return Math.min(0.5, estimatedExampleLength / content.length);
  }

  /**
   * Calculate code ratio
   */
  private calculateCodeRatio(content: string): number {
    const codeContent = this.extractCodeContent(content);
    return codeContent.length / content.length;
  }

  /**
   * Extract all code block content
   */
  private extractCodeContent(content: string): string {
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    return codeBlocks ? codeBlocks.join('') : '';
  }
}
