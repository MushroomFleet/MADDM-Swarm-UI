import { describe, it, expect } from 'vitest';
import { ContentAnalyzer } from '../content-analyzer';

describe('ContentAnalyzer', () => {
  const analyzer = new ContentAnalyzer();

  it('should detect code blocks', () => {
    const content = '```python\nprint("hello")\n```';
    const features = analyzer.analyzeContent(content);
    expect(features.hasCodeBlocks).toBe(true);
    expect(features.codeBlockCount).toBe(1);
  });

  it('should count multiple code blocks', () => {
    const content = '```js\nconsole.log("a")\n```\n\nSome text\n\n```js\nconsole.log("b")\n```';
    const features = analyzer.analyzeContent(content);
    expect(features.codeBlockCount).toBe(2);
  });

  it('should detect formal tone', () => {
    const formal = 'Furthermore, we shall consequently proceed with the implementation.';
    const features = analyzer.analyzeContent(formal);
    expect(features.formalityScore).toBeGreaterThan(0.7);
    expect(features.detectedTone).toBe('formal');
  });

  it('should detect casual tone', () => {
    const casual = 'gonna kinda sorta do this!!';
    const features = analyzer.analyzeContent(casual);
    expect(features.formalityScore).toBeLessThan(0.5);
    expect(features.detectedTone).toBe('casual');
  });

  it('should detect numbered lists', () => {
    const content = '1. First item\n2. Second item\n3. Third item';
    const features = analyzer.analyzeContent(content);
    expect(features.hasNumberedList).toBe(true);
  });

  it('should detect bullet lists', () => {
    const content = '- First item\n- Second item\n* Third item';
    const features = analyzer.analyzeContent(content);
    expect(features.hasBullets).toBe(true);
  });

  it('should detect tables', () => {
    const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    const features = analyzer.analyzeContent(content);
    expect(features.hasTables).toBe(true);
  });

  it('should count sections', () => {
    const content = '# Main\n## Section 1\n## Section 2\n### Subsection';
    const features = analyzer.analyzeContent(content);
    expect(features.sectionCount).toBe(4);
  });

  it('should calculate code ratio', () => {
    const content = 'Some text\n```js\nconst x = 1;\n```\nMore text';
    const features = analyzer.analyzeContent(content);
    expect(features.codeRatio).toBeGreaterThan(0);
    expect(features.codeRatio).toBeLessThan(1);
  });
});
