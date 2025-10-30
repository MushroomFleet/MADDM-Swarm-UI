import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function DonateButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          size="icon"
          className="fixed top-[120px] right-[120px] sm:top-16 sm:right-4 z-40 w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
          style={{ borderColor: '#FF5E5B' }}
          aria-label="Support this project on Ko-Fi"
        >
          <a
            href="https://ko-fi.com/driftjohnson"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <Heart className="w-5 h-5 sm:w-4 sm:h-4" style={{ color: '#FF5E5B' }} fill="#FF5E5B" />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="font-medium">
        Support this project ☕
      </TooltipContent>
    </Tooltip>
  );
}
