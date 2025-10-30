import { Signal } from './types';
import { SignalsStore } from '@/storage/signals-store';
import { exponentialDecay } from './utils';

/**
 * Stigmergic Board
 * 
 * Port of src/stigmergic_coordination.py StigmergicBoard class.
 * 
 * Shared coordination board where agents deposit and read signals.
 * Enables swarm intelligence through environmental modification.
 */
export class StigmergicBoard {
  private decayRate: number;
  private amplificationFactor: number;
  private attenuationFactor: number;
  private storage: SignalsStore;
  private decayInterval: ReturnType<typeof setInterval> | null;

  constructor(config: {
    decayRate?: number;
    amplificationFactor?: number;
    attenuationFactor?: number;
  } = {}) {
    this.decayRate = config.decayRate ?? 1800; // 30 minutes
    this.amplificationFactor = config.amplificationFactor ?? 1.5;
    this.attenuationFactor = config.attenuationFactor ?? 0.7;
    this.storage = new SignalsStore();
    this.decayInterval = null;

    this.startDecayLoop();
  }

  /**
   * Deposit signal about approach effectiveness
   * 
   * Algorithm:
   * 1. Calculate initial strength from success metric
   * 2. Check for existing signal
   * 3. If exists: amplify or attenuate
   * 4. If new: create signal
   */
  async depositSignal(
    taskId: string,
    approach: string,
    successMetric: number,
    agentId: string
  ): Promise<void> {
    const initialStrength = successMetric * 100;

    const existing = await this.storage.getSignal(taskId, approach);

    if (existing) {
      const currentStrength = this.calculateDecayedStrength(existing);

      let newStrength: number;
      if (existing.depositedBy === agentId || successMetric > 0.7) {
        // Amplify
        newStrength = currentStrength + initialStrength * this.amplificationFactor;
        console.log(`  ⬆️ Amplifying: ${currentStrength.toFixed(1)} → ${newStrength.toFixed(1)}`);
      } else {
        // Attenuate
        newStrength = currentStrength * this.attenuationFactor;
        console.log(`  ⬇️ Attenuating: ${currentStrength.toFixed(1)} → ${newStrength.toFixed(1)}`);
      }

      existing.strength = Math.min(newStrength, 100);
      existing.timestamp = Date.now();
      existing.successMetric = existing.successMetric * 0.7 + successMetric * 0.3;

      await this.storage.updateSignal(existing);
    } else {
      const signal: Signal = {
        taskId,
        approach,
        strength: initialStrength,
        timestamp: Date.now(),
        depositedBy: agentId,
        successMetric,
      };

      await this.storage.saveSignal(signal);
      console.log(`  ✨ New signal: ${approach} (${initialStrength.toFixed(1)})`);
    }
  }

  /**
   * Read signals for task
   */
  async readSignals(taskId: string, agentId: string): Promise<Signal[]> {
    const signals = await this.storage.getSignalsForTask(taskId);

    const activeSignals = signals
      .map(signal => ({
        ...signal,
        strength: this.calculateDecayedStrength(signal),
      }))
      .filter(s => s.strength > 1.0);

    activeSignals.sort((a, b) => b.strength - a.strength);

    return activeSignals;
  }

  /**
   * Calculate decayed strength
   */
  private calculateDecayedStrength(signal: Signal): number {
    const ageSeconds = (Date.now() - signal.timestamp) / 1000;
    return exponentialDecay(signal.strength, ageSeconds, this.decayRate);
  }

  /**
   * Remove decayed signals
   */
  private async decaySignals(): Promise<void> {
    const allSignals = await this.storage.getAllSignals();

    for (const signal of allSignals) {
      const strength = this.calculateDecayedStrength(signal);

      if (strength < 1.0) {
        await this.storage.deleteSignal(signal.taskId, signal.approach);
      }
    }
  }

  /**
   * Start background decay loop
   */
  private startDecayLoop(): void {
    this.decayInterval = setInterval(
      () => {
        this.decaySignals();
      },
      10 * 60 * 1000
    );
  }

  /**
   * Clean up
   */
  dispose(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }
}
