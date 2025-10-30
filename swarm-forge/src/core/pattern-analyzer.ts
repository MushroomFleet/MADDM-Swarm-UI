import { ExecutionRecord, PatternCluster, PatternSignature, StyleCharacteristics, ApproachPattern } from './types';
import { ExecutionHistoryStore } from '@/storage/history-store';
import { PatternsStore } from '@/storage/patterns-store';
import { ContentAnalyzer } from './content-analyzer';
import { clusterBySimilarity, calculateCentroid } from '@/utils/clustering';
import { nanoid } from 'nanoid';

/**
 * Pattern Analyzer
 * 
 * Port of src/pattern_analyzer.py PatternAnalyzer class.
 * 
 * Discovers patterns in execution history using clustering.
 * Extracts signatures and style characteristics from clusters.
 */
export class PatternAnalyzer {
  private historyStore: ExecutionHistoryStore;
  private patternsStore: PatternsStore;
  private contentAnalyzer: ContentAnalyzer;

  constructor() {
    this.historyStore = new ExecutionHistoryStore();
    this.patternsStore = new PatternsStore();
    this.contentAnalyzer = new ContentAnalyzer();
  }

  /**
   * Discover patterns in successful executions with improved bucketing
   */
  async discoverPatterns(config: {
    minClusterSize?: number;
    minQuality?: number;
    similarityThreshold?: number;
  }): Promise<PatternCluster[]> {
    const minClusterSize = config.minClusterSize ?? 10;
    const minQuality = config.minQuality ?? 0.8;
    const similarityThreshold = config.similarityThreshold ?? 0.7;

    const successful = await this.historyStore.getRecords({
      minQuality,
      successOnly: true,
    });

    console.log(`\n🔬 Pattern Discovery`);
    console.log(`   Config: minQuality=${minQuality}, minClusterSize=${minClusterSize}, similarity=${similarityThreshold}`);
    console.log(`   Analyzing ${successful.length} successful executions`);

    if (successful.length < minClusterSize) {
      console.log(`   ⚠️ Not enough data (need ${minClusterSize}, have ${successful.length})`);
      return [];
    }

    const featureExtractor = (record: ExecutionRecord) =>
      this.extractFeatureVector(record);

    // Group by (primaryDomain, outputType) buckets for better clustering
    const buckets = new Map<string, ExecutionRecord[]>();
    
    for (const record of successful) {
      const primaryDomain = Object.keys(record.taskContext.domainWeights)[0] || 'general';
      const outputType = record.taskContext.outputType;
      const bucketKey = `${primaryDomain}:${outputType}`;
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(record);
    }

    console.log(`   📦 Grouped into ${buckets.size} buckets by (domain, outputType)`);

    // Cluster within each bucket
    const allClusters: ExecutionRecord[][] = [];
    
    for (const [bucketKey, bucketRecords] of buckets.entries()) {
      const bucketMinSize = Math.max(3, Math.floor(minClusterSize / 2));
      
      if (bucketRecords.length >= bucketMinSize) {
        console.log(`   🔍 Clustering bucket "${bucketKey}" (${bucketRecords.length} records)`);
        
        const bucketClusters = clusterBySimilarity(
          bucketRecords,
          featureExtractor,
          similarityThreshold,
          bucketMinSize
        );
        
        if (bucketClusters.length > 0) {
          console.log(`      ✓ Found ${bucketClusters.length} clusters in this bucket`);
          allClusters.push(...bucketClusters);
        }
      }
    }

    console.log(`   ✅ Total clusters across all buckets: ${allClusters.length}`);

    // Diagnostics if no clusters
    if (allClusters.length === 0) {
      console.log(`   📊 Diagnostics:`);
      console.log(`      - Bucket sizes:`, Array.from(buckets.entries()).map(([k, v]) => `${k}=${v.length}`));
      
      // Sample pairwise similarities in largest bucket
      const largestBucket = Array.from(buckets.values()).sort((a, b) => b.length - a.length)[0];
      if (largestBucket && largestBucket.length >= 2) {
        const sampleSize = Math.min(10, largestBucket.length);
        const similarities: number[] = [];
        
        for (let i = 0; i < sampleSize - 1; i++) {
          for (let j = i + 1; j < sampleSize; j++) {
            const f1 = featureExtractor(largestBucket[i]);
            const f2 = featureExtractor(largestBucket[j]);
            const sim = this.calculateFeatureSimilarity(f1, f2);
            similarities.push(sim);
          }
        }
        
        similarities.sort((a, b) => b - a);
        console.log(`      - Top 10 pairwise similarities in largest bucket:`, similarities.slice(0, 10).map(s => s.toFixed(3)));
      }
    }

    const patternClusters: PatternCluster[] = [];

    for (let i = 0; i < allClusters.length; i++) {
      const cluster = allClusters[i];
      const features = cluster.map(featureExtractor);

      const patternCluster = this.analyzeCluster(
        `cluster_${nanoid(8)}`,
        cluster,
        features
      );

      patternClusters.push(patternCluster);
      console.log(`   ✓ Pattern ${i + 1}: ${cluster.length} records, quality ${patternCluster.avgQuality.toFixed(2)}`);
    }

    for (const pattern of patternClusters) {
      await this.patternsStore.savePattern(pattern);
    }

    return patternClusters;
  }

  /**
   * Calculate feature similarity (exposed for diagnostics)
   */
  private calculateFeatureSimilarity(f1: Record<string, number>, f2: Record<string, number>): number {
    const allKeys = new Set([...Object.keys(f1), ...Object.keys(f2)]);
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (const key of allKeys) {
      const v1 = f1[key] ?? 0;
      const v2 = f2[key] ?? 0;
      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    }
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Extract feature vector from execution record
   */
  private extractFeatureVector(record: ExecutionRecord): Record<string, number> {
    const features: Record<string, number> = {};

    // Domain features
    const domains = ['research', 'writing', 'coding', 'review', 'comparison', 'analysis'];
    for (const domain of domains) {
      features[`domain_${domain}`] = record.taskContext.domainWeights[domain] ?? 0;
    }

    // Complexity
    features.complexity = record.taskContext.complexity;

    // Output type (one-hot)
    const outputTypes = ['tutorial', 'code', 'explanation', 'list', 'comparison', 'report'];
    for (const ot of outputTypes) {
      features[`output_${ot}`] = record.taskContext.outputType === ot ? 1 : 0;
    }

    // Content features (if available)
    if (record.contentFeatures) {
      const cf = record.contentFeatures;
      features.has_code = cf.hasCodeBlocks ? 1 : 0;
      features.has_numbered_list = cf.hasNumberedList ? 1 : 0;
      features.has_bullets = cf.hasBullets ? 1 : 0;
      features.section_count = Math.min(1, cf.sectionCount / 10);
      features.code_ratio = cf.codeRatio;
      features.explanation_ratio = cf.explanationRatio;
      features.example_ratio = cf.exampleRatio;
      features.formality = cf.formalityScore;
    }

    return features;
  }

  /**
   * Analyze a cluster
   */
  private analyzeCluster(
    clusterId: string,
    records: ExecutionRecord[],
    features: Record<string, number>[]
  ): PatternCluster {
    const avgQuality = records.reduce((sum, r) => sum + r.actualQuality, 0) / records.length;

    const centroid = calculateCentroid(features);

    const qualityStdDev = Math.sqrt(
      records.reduce((sum, r) => {
        const diff = r.actualQuality - avgQuality;
        return sum + diff * diff;
      }, 0) / records.length
    );

    const isConsistent = qualityStdDev < 0.15;

    return {
      clusterId,
      records,
      avgQuality,
      featureCentroid: centroid,
      isNovel: true,
      isConsistent,
    };
  }

  /**
   * Extract pattern signature from cluster
   */
  async extractPatternSignature(cluster: PatternCluster): Promise<PatternSignature> {
    const records = cluster.records;

    // Aggregate domain weights (weighted by quality)
    const domainWeights: Record<string, number> = {};
    for (const record of records) {
      for (const [domain, weight] of Object.entries(record.taskContext.domainWeights)) {
        domainWeights[domain] =
          (domainWeights[domain] ?? 0) + weight * record.actualQuality;
      }
    }

    // Normalize
    const total = Object.values(domainWeights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      for (const domain of Object.keys(domainWeights)) {
        domainWeights[domain] /= total;
      }
    }

    // Complexity range (with 10% padding)
    const complexities = records.map(r => r.taskContext.complexity);
    let complexityMin = Math.min(...complexities);
    let complexityMax = Math.max(...complexities);

    const range = complexityMax - complexityMin;
    complexityMin = Math.max(0, complexityMin - range * 0.1);
    complexityMax = Math.min(1, complexityMax + range * 0.1);

    // Common keywords (top 10)
    const keywordCounts = new Map<string, number>();
    for (const record of records) {
      for (const keyword of record.taskContext.keywords) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
      }
    }

    const sortedKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const keywordPatterns = sortedKeywords.map(([kw]) => kw);
    const keywordWeights: Record<string, number> = {};
    for (const [kw, count] of sortedKeywords) {
      keywordWeights[kw] = count / records.length;
    }

    // Common output types
    const outputTypeCounts = new Map<string, number>();
    for (const record of records) {
      const ot = record.taskContext.outputType;
      outputTypeCounts.set(ot, (outputTypeCounts.get(ot) ?? 0) + 1);
    }

    const outputTypes = Array.from(outputTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ot]) => ot);

    // Boolean characteristics (>50% threshold)
    const hasCode =
      records.filter(r => r.contentFeatures?.hasCodeBlocks).length / records.length > 0.5;
    const hasExamples =
      records.filter(r => r.contentFeatures && r.contentFeatures.exampleRatio > 0.3).length /
        records.length >
      0.5;
    const hasTheory =
      records.filter(r => r.contentFeatures && r.contentFeatures.explanationRatio > 0.4)
        .length /
        records.length >
      0.5;

    return {
      domainWeights,
      complexityMin,
      complexityMax,
      keywordPatterns,
      keywordWeights,
      outputTypes,
      requiresCode: hasCode,
      requiresExamples: hasExamples,
      requiresTheory: hasTheory,
    };
  }

  /**
   * Extract style characteristics from cluster
   */
  async extractStyleCharacteristics(
    cluster: PatternCluster
  ): Promise<StyleCharacteristics> {
    const records = cluster.records;

    const withFeatures = records.filter(r => r.contentFeatures);

    if (withFeatures.length === 0) {
      return this.getDefaultStyle();
    }

    // Infer structure type
    const hasNumbered = withFeatures.filter(r => r.contentFeatures!.hasNumberedList).length;
    const hasBullets = withFeatures.filter(r => r.contentFeatures!.hasBullets).length;
    const sectionCounts = withFeatures.map(r => r.contentFeatures!.sectionCount);

    let structureType: StyleCharacteristics['structureType'];
    if (hasNumbered / withFeatures.length > 0.5) {
      structureType = 'sequential_steps';
    } else if (hasBullets / withFeatures.length > 0.5) {
      structureType = 'bulleted';
    } else if (sectionCounts.reduce((s, c) => s + c, 0) / withFeatures.length >= 4) {
      structureType = 'hierarchical';
    } else {
      structureType = 'prose';
    }

    const sectionMin = Math.min(...sectionCounts);
    const sectionMax = Math.max(...sectionCounts);

    // Tone
    const tones = withFeatures.map(r => r.contentFeatures!.detectedTone);
    const toneMap = new Map<string, number>();
    tones.forEach(t => toneMap.set(t, (toneMap.get(t) ?? 0) + 1));
    const tone = Array.from(toneMap.entries()).sort((a, b) => b[1] - a[1])[0][0] as any;

    // Voice
    const avgFormality =
      withFeatures.reduce((sum, r) => sum + r.contentFeatures!.formalityScore, 0) /
      withFeatures.length;

    let voice: StyleCharacteristics['voice'];
    if (avgFormality > 0.7) {
      voice = 'third_person';
    } else if (avgFormality < 0.3) {
      voice = 'first_person';
    } else {
      voice = 'second_person';
    }

    // Depth level
    const avgLength =
      withFeatures.reduce((sum, r) => sum + r.contentFeatures!.totalLength, 0) /
      withFeatures.length;

    let depthLevel: StyleCharacteristics['depthLevel'];
    if (avgLength < 1000) {
      depthLevel = 'concise';
    } else if (avgLength < 3000) {
      depthLevel = 'moderate';
    } else if (avgLength < 5000) {
      depthLevel = 'comprehensive';
    } else {
      depthLevel = 'exhaustive';
    }

    // Explanation style
    const avgExplanation =
      withFeatures.reduce((sum, r) => sum + r.contentFeatures!.explanationRatio, 0) /
      withFeatures.length;
    const avgExample =
      withFeatures.reduce((sum, r) => sum + r.contentFeatures!.exampleRatio, 0) /
      withFeatures.length;

    let explanationStyle: StyleCharacteristics['explanationStyle'];
    if (avgExplanation > 0.6) {
      explanationStyle = 'conceptual';
    } else if (avgExample > 0.4) {
      explanationStyle = 'practical';
    } else {
      explanationStyle = 'mixed';
    }

    // Example density
    let exampleDensity: StyleCharacteristics['exampleDensity'];
    if (avgExample < 0.2) {
      exampleDensity = 'low';
    } else if (avgExample < 0.4) {
      exampleDensity = 'medium';
    } else {
      exampleDensity = 'high';
    }

    // Code style
    const avgCode =
      withFeatures.reduce((sum, r) => sum + r.contentFeatures!.codeRatio, 0) /
      withFeatures.length;

    let codeStyle: StyleCharacteristics['codeStyle'];
    if (avgCode < 0.05) {
      codeStyle = null;
    } else if (avgCode < 0.2) {
      codeStyle = 'minimal';
    } else if (avgCode < 0.4) {
      codeStyle = 'annotated';
    } else {
      codeStyle = 'production';
    }

    // Organization elements
    const useHeaders = sectionCounts.filter(c => c > 1).length / withFeatures.length > 0.5;
    const useBullets = hasBullets / withFeatures.length > 0.5;
    const useNumberedLists = hasNumbered / withFeatures.length > 0.5;
    const useTables =
      withFeatures.filter(r => r.contentFeatures!.hasTables).length / withFeatures.length >
      0.5;

    return {
      structureType,
      sectionCount: [sectionMin, sectionMax],
      tone,
      voice,
      depthLevel,
      explanationStyle,
      exampleDensity,
      codeStyle,
      useHeaders,
      useBullets,
      useNumberedLists,
      useTables,
      includeSummary: true,
      includeTldr: false,
      includePrerequisites: tone === 'educational',
      includeNextSteps: structureType === 'sequential_steps',
    };
  }

  /**
   * Check if cluster represents a novel pattern
   */
  async checkNovelty(
    cluster: PatternCluster,
    existingApproaches: ApproachPattern[],
    threshold: number = 0.85
  ): Promise<boolean> {
    const clusterSignature = await this.extractPatternSignature(cluster);

    for (const approach of existingApproaches) {
      const similarity = this.calculateSignatureSimilarity(
        clusterSignature,
        approach.patternSignature
      );

      if (similarity > threshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate similarity between two pattern signatures
   */
  private calculateSignatureSimilarity(
    sig1: PatternSignature,
    sig2: PatternSignature
  ): number {
    const scores: number[] = [];

    // Domain overlap
    let domainSim = 0;
    for (const domain of Object.keys(sig1.domainWeights)) {
      const w1 = sig1.domainWeights[domain] ?? 0;
      const w2 = sig2.domainWeights[domain] ?? 0;
      domainSim += Math.min(w1, w2);
    }
    scores.push(domainSim);

    // Complexity overlap
    const range1 = [sig1.complexityMin, sig1.complexityMax];
    const range2 = [sig2.complexityMin, sig2.complexityMax];
    const overlap = Math.max(0, Math.min(range1[1], range2[1]) - Math.max(range1[0], range2[0]));
    const union = Math.max(range1[1], range2[1]) - Math.min(range1[0], range2[0]);
    const complexitySim = union > 0 ? overlap / union : 0;
    scores.push(complexitySim);

    // Keyword overlap
    const kw1 = new Set(sig1.keywordPatterns);
    const kw2 = new Set(sig2.keywordPatterns);
    const kwIntersect = new Set([...kw1].filter(k => kw2.has(k)));
    const kwUnion = new Set([...kw1, ...kw2]);
    const kwSim = kwUnion.size > 0 ? kwIntersect.size / kwUnion.size : 0;
    scores.push(kwSim);

    // Output type overlap
    const ot1 = new Set(sig1.outputTypes);
    const ot2 = new Set(sig2.outputTypes);
    const otIntersect = new Set([...ot1].filter(o => ot2.has(o)));
    const otUnion = new Set([...ot1, ...ot2]);
    const otSim = otUnion.size > 0 ? otIntersect.size / otUnion.size : 0;
    scores.push(otSim);

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  private getDefaultStyle(): StyleCharacteristics {
    return {
      structureType: 'prose',
      sectionCount: [2, 5],
      tone: 'neutral',
      voice: 'third_person',
      depthLevel: 'moderate',
      explanationStyle: 'mixed',
      exampleDensity: 'medium',
      codeStyle: null,
      useHeaders: true,
      useBullets: false,
      useNumberedLists: false,
      useTables: false,
      includeSummary: false,
      includeTldr: false,
      includePrerequisites: false,
      includeNextSteps: false,
    };
  }
}
