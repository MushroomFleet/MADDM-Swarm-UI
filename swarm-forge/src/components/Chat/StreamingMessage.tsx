import { Card } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';

interface StreamingMessageProps {
  chunks: string[];
}

export function StreamingMessage({ chunks }: StreamingMessageProps) {
  const content = chunks.join('');

  return (
    <div className="flex gap-4 px-4 mb-4 max-w-4xl mx-auto animate-fade-in">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary">
        <Bot className="w-4 h-4 text-secondary-foreground" />
      </div>

      {/* Streaming content */}
      <Card className="flex-1 p-4 bg-card relative">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content}
          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
        </div>

        <div className="absolute top-2 right-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}
