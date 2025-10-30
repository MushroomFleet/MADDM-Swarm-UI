import { describe, it, expect } from 'vitest';
import { 
  generateSpecialistName,
  parseSpecialistName, 
  formatSpecialistNameForDisplay,
  getHonorific,
  getPrimaryDomain,
  checkHonorificUpgrade
} from '../specialist-names';
import { TaskSignature } from '@/core/types';

describe('Specialist Names', () => {
  const createTestSignature = (domain: string, outputType: string): TaskSignature => ({
    domain,
    domainWeights: { [domain]: 1.0 },
    complexity: 0.6,
    keywords: ['test'],
    outputType,
    estimatedDuration: 1.0,
  });

  describe('generateSpecialistName', () => {
    it('should generate domain_animal format', () => {
      const signature = createTestSignature('coding', 'tutorial');
      const existingNames = new Set<string>();
      
      const name = generateSpecialistName(signature, existingNames);
      
      expect(name).toMatch(/^[a-z]+_[a-z]+$/);
      expect(name.split('_').length).toBe(2);
    });

    it('should be deterministic for same input', () => {
      const signature = createTestSignature('coding', 'tutorial');
      const existingNames = new Set<string>();
      
      const name1 = generateSpecialistName(signature, existingNames);
      const name2 = generateSpecialistName(signature, existingNames);
      
      expect(name1).toBe(name2);
    });

    it('should handle collisions with counter suffix', () => {
      const signature = createTestSignature('coding', 'tutorial');
      const name1 = generateSpecialistName(signature, new Set());
      
      // Simulate first name taken
      const existingNames = new Set([name1]);
      const name2 = generateSpecialistName(signature, existingNames);
      
      // Should add counter suffix
      expect(name2).toMatch(/^[a-z]+_[a-z]+_\d+$/);
    });

    it('should generate different names for different domains', () => {
      const sig1 = createTestSignature('coding', 'tutorial');
      const sig2 = createTestSignature('writing', 'tutorial');
      
      const name1 = generateSpecialistName(sig1, new Set());
      const name2 = generateSpecialistName(sig2, new Set());
      
      expect(name1).not.toBe(name2);
      expect(name1.startsWith('coding_')).toBe(true);
      expect(name2.startsWith('writing_')).toBe(true);
    });
  });

  describe('parseSpecialistName', () => {
    it('should parse basic name', () => {
      const result = parseSpecialistName('coding_falcon');
      
      expect(result.honorific).toBeNull();
      expect(result.domain).toBe('coding');
      expect(result.animal).toBe('falcon');
      expect(result.original).toBe('coding_falcon');
    });

    it('should parse name with expert honorific', () => {
      const result = parseSpecialistName('expert_coding_falcon');
      
      expect(result.honorific).toBe('expert');
      expect(result.domain).toBe('coding');
      expect(result.animal).toBe('falcon');
    });

    it('should parse name with master honorific', () => {
      const result = parseSpecialistName('master_research_owl');
      
      expect(result.honorific).toBe('master');
      expect(result.domain).toBe('research');
      expect(result.animal).toBe('owl');
    });

    it('should parse name with counter suffix', () => {
      const result = parseSpecialistName('coding_falcon_2');
      
      expect(result.honorific).toBeNull();
      expect(result.domain).toBe('coding');
      expect(result.animal).toBe('falcon_2');
    });
  });

  describe('getHonorific', () => {
    it('should return null for new specialists', () => {
      expect(getHonorific(5, 0.9)).toBeNull();
      expect(getHonorific(9, 0.85)).toBeNull();
    });

    it('should return expert for 10+ executions with high quality', () => {
      expect(getHonorific(10, 0.85)).toBe('expert');
      expect(getHonorific(25, 0.9)).toBe('expert');
      expect(getHonorific(49, 0.85)).toBe('expert');
    });

    it('should return master for 50+ executions with high quality', () => {
      expect(getHonorific(50, 0.85)).toBe('master');
      expect(getHonorific(100, 0.9)).toBe('master');
    });

    it('should return null for low quality regardless of executions', () => {
      expect(getHonorific(10, 0.7)).toBeNull();
      expect(getHonorific(50, 0.75)).toBeNull();
      expect(getHonorific(100, 0.6)).toBeNull();
    });

    it('should use exactly 0.8 quality threshold', () => {
      expect(getHonorific(10, 0.8)).toBeNull(); // Must be > 0.8
      expect(getHonorific(10, 0.81)).toBe('expert');
    });
  });

  describe('formatSpecialistNameForDisplay', () => {
    it('should return base name without specialist info', () => {
      const name = formatSpecialistNameForDisplay('coding_falcon');
      expect(name).toBe('coding_falcon');
    });

    it('should add expert prefix when earned', () => {
      const name = formatSpecialistNameForDisplay('coding_falcon', {
        totalExecutions: 15,
        averageQuality: 0.85,
      });
      
      expect(name).toBe('expert_coding_falcon');
    });

    it('should add master prefix when earned', () => {
      const name = formatSpecialistNameForDisplay('coding_falcon', {
        totalExecutions: 60,
        averageQuality: 0.9,
      });
      
      expect(name).toBe('master_coding_falcon');
    });

    it('should not add honorific for low quality', () => {
      const name = formatSpecialistNameForDisplay('coding_falcon', {
        totalExecutions: 50,
        averageQuality: 0.7,
      });
      
      expect(name).toBe('coding_falcon');
    });

    it('should preserve existing honorific if still earned', () => {
      const name = formatSpecialistNameForDisplay('expert_coding_falcon', {
        totalExecutions: 25,
        averageQuality: 0.85,
      });
      
      expect(name).toBe('expert_coding_falcon');
    });
  });

  describe('getPrimaryDomain', () => {
    it('should return domain with highest weight', () => {
      const signature: TaskSignature = {
        domain: 'coding',
        domainWeights: { coding: 0.8, writing: 0.2 },
        complexity: 0.6,
        keywords: [],
        outputType: 'tutorial',
        estimatedDuration: 1.0,
      };
      
      expect(getPrimaryDomain(signature)).toBe('coding');
    });

    it('should return general for empty weights', () => {
      const signature: TaskSignature = {
        domain: 'general',
        domainWeights: {},
        complexity: 0.6,
        keywords: [],
        outputType: 'tutorial',
        estimatedDuration: 1.0,
      };
      
      expect(getPrimaryDomain(signature)).toBe('general');
    });

    it('should fall back to general for unknown domains', () => {
      const signature: TaskSignature = {
        domain: 'unknown_domain',
        domainWeights: { unknown_domain: 1.0 },
        complexity: 0.6,
        keywords: [],
        outputType: 'tutorial',
        estimatedDuration: 1.0,
      };
      
      expect(getPrimaryDomain(signature)).toBe('general');
    });
  });

  describe('checkHonorificUpgrade', () => {
    it('should return expert when earning first honorific', () => {
      const upgrade = checkHonorificUpgrade('coding_falcon', 10, 0.85);
      expect(upgrade).toBe('expert');
    });

    it('should return master when upgrading from expert', () => {
      const upgrade = checkHonorificUpgrade('expert_coding_falcon', 50, 0.9);
      expect(upgrade).toBe('master');
    });

    it('should return null when no upgrade', () => {
      const upgrade1 = checkHonorificUpgrade('coding_falcon', 5, 0.9);
      expect(upgrade1).toBeNull();
      
      const upgrade2 = checkHonorificUpgrade('expert_coding_falcon', 25, 0.85);
      expect(upgrade2).toBeNull();
      
      const upgrade3 = checkHonorificUpgrade('master_coding_falcon', 60, 0.9);
      expect(upgrade3).toBeNull();
    });

    it('should return null when losing honorific', () => {
      const upgrade = checkHonorificUpgrade('expert_coding_falcon', 25, 0.7);
      expect(upgrade).toBeNull();
    });
  });
});
