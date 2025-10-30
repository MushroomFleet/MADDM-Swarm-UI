import { useState } from 'react';
import { useApiKey } from '@/hooks/useApiKey';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export function ApiKeyInput() {
  const { apiKey, isSet, setApiKey, clearApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setInputValue('');
      toast({
        title: 'API Key Saved',
        description: 'Your OpenRouter API key has been saved to localStorage',
      });
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
    toast({
      title: 'API Key Cleared',
      description: 'Your API key has been removed',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="api-key">API Key</Label>
        {isSet ? (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Configured
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Not Set
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            placeholder={isSet ? '••••••••••••••••' : 'sk-or-...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={!inputValue.trim()}>
          Save
        </Button>
      </div>

      {isSet && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <p className="font-medium">Current API Key</p>
            <p className="text-muted-foreground font-mono text-xs">
              {showKey ? apiKey : '••••••••••••••••'}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            Clear
          </Button>
        </div>
      )}

      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter.ai</a></p>
        <p>• API key is stored locally in your browser</p>
        <p>• Default model: anthropic/claude-3.5-sonnet</p>
      </div>
    </div>
  );
}
