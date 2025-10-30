import { ChatMessage } from '@/core/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bot, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SwarmTraceBubble } from './SwarmTraceBubble';
import { formatMessageAsMarkdown, generateFilename, downloadMarkdown } from '@/utils/markdown-formatter';
import { useToast } from '@/hooks/use-toast';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const { toast } = useToast();

  const handleCopyMessage = () => {
    const markdown = formatMessageAsMarkdown(message);
    const filename = generateFilename('swarm');
    downloadMarkdown(markdown, filename);
    
    toast({
      title: 'Response Downloaded',
      description: `Saved as ${filename}`,
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary' : 'bg-secondary'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>

      {/* Message content */}
      <Card className={`flex-1 p-4 ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-card'
      }`}>
        {/* Add header with copy button for assistant messages */}
        {!isUser && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMessage}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="text-xs">Download</span>
            </Button>
          </div>
        )}

        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <pre className="not-prose overflow-x-auto rounded-md bg-muted p-3 text-sm">
                      <code className={className} {...rest}>
                        {String(children).replace(/\n$/, '')}
                      </code>
                    </pre>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Swarm trace bubble */}
        {message.swarmTrace && !isUser && (
          <SwarmTraceBubble trace={message.swarmTrace} />
        )}
      </Card>
    </div>
  );
}
