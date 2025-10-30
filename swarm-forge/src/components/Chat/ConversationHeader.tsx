import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileDown, Sparkles, Trash2 } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useSystemStats } from '@/hooks/useSystemStats';
import { formatConversationAsMarkdown, generateFilename, downloadMarkdown } from '@/utils/markdown-formatter';
import { useToast } from '@/hooks/use-toast';

export function ConversationHeader() {
  const messages = useChatStore(state => state.messages);
  const clearMessages = useChatStore(state => state.clearMessages);
  const { data: stats } = useSystemStats();
  const { toast } = useToast();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const executionCount = stats?.executionCount ?? 0;
  const patternDiscoveryReady = executionCount >= 10;
  const progressPercent = Math.min((executionCount / 10) * 100, 100);

  const handleExportConversation = () => {
    if (messages.length === 0) {
      toast({
        title: 'No Messages',
        description: 'Start a conversation before exporting',
        variant: 'destructive',
      });
      return;
    }

    const markdown = formatConversationAsMarkdown(messages);
    const filename = generateFilename('swarmLog');
    downloadMarkdown(markdown, filename);
    
    toast({
      title: 'Conversation Exported',
      description: `Saved as ${filename} (${messages.length} messages)`,
    });
  };

  const handleClearChat = () => {
    clearMessages();
    setShowClearDialog(false);
    toast({
      title: 'Chat Cleared',
      description: 'Started a new conversation',
    });
  };

  return (
    <div className="border-b bg-card px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Swarm Chat</h2>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportConversation}
              disabled={messages.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export Conversation
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Pattern Discovery Progress */}
        {!patternDiscoveryReady && stats && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      <span>Pattern Discovery Progress</span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {executionCount}/10 executions
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  The system needs 10 executions to discover patterns and create specialized approaches. 
                  Currently using a baseline fallback approach during bootstrap phase.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages in the current conversation. 
              This action cannot be undone. Consider exporting the conversation first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
