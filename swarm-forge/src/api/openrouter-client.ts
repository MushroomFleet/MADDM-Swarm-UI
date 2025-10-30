import { CoordinationResult } from '@/core/types';
import { OPENROUTER_BASE_URL, DEFAULT_MODEL } from '@/utils/constants';

/**
 * OpenRouter API Client
 * 
 * Handles streaming chat completions via OpenRouter.ai.
 * Uses fetch API with ReadableStream for real-time streaming.
 */
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, config?: { model?: string; baseUrl?: string }) {
    this.apiKey = apiKey;
    this.baseUrl = config?.baseUrl ?? OPENROUTER_BASE_URL;
    this.model = config?.model ?? DEFAULT_MODEL;
  }

  /**
   * Stream chat completion from OpenRouter
   * 
   * Yields content chunks as they arrive.
   */
  async *streamChat(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const requestBody = {
      model: this.model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages,
      ],
      stream: true,
    };

    // Log API call details
    console.log(`🌐 OpenRouter call: model=${this.model}, promptLength=${messages[messages.length - 1].content.length}`);

    // Create fetch timeout (65s - buffer over specialist timeout)
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => {
      console.error('❌ OpenRouter fetch timeout (65s) - aborting');
      controller.abort();
    }, 65000);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Hybrid Swarm Agent',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);
    } catch (err) {
      clearTimeout(fetchTimeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('OpenRouter request timed out (65s) - possible API key or rate limit issue');
      }
      throw err;
    }

    console.log(`✅ OpenRouter response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Build system prompt from approach metadata
   * 
   * Converts coordination guidance into LLM instructions.
   */
  buildSystemPrompt(metadata?: CoordinationResult['approachMetadata']): string {
    if (!metadata) {
      return 'You are a helpful AI assistant.';
    }

    const { signature, style } = metadata;

    let prompt = `You are an AI assistant coordinated by a hybrid swarm intelligence system.\n\n`;
    prompt += `APPROACH: ${metadata.name}\n\n`;

    prompt += `CONTENT GUIDANCE:\n`;
    prompt += `- Structure: ${style.structureType} (${style.sectionCount[0]}-${style.sectionCount[1]} sections)\n`;
    prompt += `- Tone: ${style.tone}\n`;
    prompt += `- Voice: ${style.voice}\n`;
    prompt += `- Depth: ${style.depthLevel}\n`;
    prompt += `- Style: ${style.explanationStyle}\n\n`;

    prompt += `REQUIREMENTS:\n`;
    if (signature.requiresCode) prompt += `- Include substantial code examples\n`;
    if (signature.requiresExamples) prompt += `- Provide practical examples\n`;
    if (signature.requiresTheory) prompt += `- Include theoretical explanation\n`;
    prompt += `\n`;

    prompt += `ORGANIZATION:\n`;
    if (style.useHeaders) prompt += `- Use clear section headers\n`;
    if (style.useBullets) prompt += `- Use bullet points extensively\n`;
    if (style.useNumberedLists) prompt += `- Use numbered lists for sequences\n`;
    if (style.includeSummary) prompt += `- Include a summary section\n`;
    if (style.includePrerequisites) prompt += `- List prerequisites\n`;
    if (style.includeNextSteps) prompt += `- Suggest next steps\n`;
    prompt += `\n`;

    prompt += `Follow this guidance flexibly to create high-quality content matching the discovered pattern.`;

    return prompt;
  }
}
