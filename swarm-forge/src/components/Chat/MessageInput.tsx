import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question... (Shift+Enter for new line)"
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={2}
          aria-label="Message input"
          aria-describedby="message-hint"
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          size="icon"
          className="h-[60px] w-[60px]"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
      <p id="message-hint" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
