import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Network, Sparkles, Database, Zap, TrendingUp, CheckCircle2, BookOpen, FileText, Github, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyBibTeX = () => {
    const bibTeX = `@software{hybrid_swarm,
  title = {Hybrid Swarm: Derived from Cognition-9 Project},
  author = {[Drift Johnson]},
  year = {2025},
  url = {https://github.com/MushroomFleet/Cognition-9},
  version = {1.0.0}
}`;
    
    navigator.clipboard.writeText(bibTeX);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied to clipboard",
      description: "BibTeX citation copied successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-swarm opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="outline" className="px-4 py-2 border-swarm-primary/50 text-swarm-primary">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Phase 7: UI Components Complete
            </Badge>
            
            <h1 className="text-6xl font-bold tracking-tight">
              <span className="bg-gradient-swarm bg-clip-text text-transparent">
                Hybrid Swarm
              </span>
              <br />
              <span className="text-foreground">Standalone</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A browser-based implementation of three-layer swarm intelligence with adaptive resonance, 
              dynamic approaches, and stigmergic coordination.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Badge variant="secondary" className="px-4 py-2">
                <Brain className="w-4 h-4 mr-2 inline" />
                Adaptive Resonance
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Network className="w-4 h-4 mr-2 inline" />
                Dynamic Approaches
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="w-4 h-4 mr-2 inline" />
                Stigmergic Signals
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 justify-center pt-8">
              <a 
                href="/tutorial" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Learn How It Works
              </a>
              <a 
                href="/chat" 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors inline-flex items-center gap-2"
              >
                Try Chat Interface
                <Sparkles className="w-4 h-4" />
              </a>
              <a 
                href="/dashboard" 
                className="px-6 py-3 border border-border bg-card text-card-foreground rounded-lg font-medium hover:bg-accent transition-colors"
              >
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* System Status Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 bg-card/50 backdrop-blur border-swarm-primary/20 hover:border-swarm-primary/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Database className="w-8 h-8 text-swarm-primary" />
                <Badge className="text-xs bg-swarm-primary/20 text-swarm-primary border-swarm-primary/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Storage Layer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  5 Dexie stores with compound indexes, Date serialization, and comprehensive CRUD operations
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">5 stores • Auto serialization • Full tests</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-swarm-secondary/20 hover:border-swarm-secondary/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Brain className="w-8 h-8 text-swarm-secondary" />
                <Badge className="text-xs bg-swarm-secondary/20 text-swarm-secondary border-swarm-secondary/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Coordination Logic</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Three-layer intelligence with vector math, ART matching, and stigmergic signals
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">6 core modules • Full test suite</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-swarm-accent/20 hover:border-swarm-accent/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-swarm-accent" />
                <Badge className="text-xs bg-swarm-accent/20 text-swarm-accent border-swarm-accent/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pattern Discovery</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clustering, content analysis, and approach evolution for emergent learning
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">4 modules • Threshold clustering</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Zap className="w-8 h-8 text-primary" />
                <Badge className="text-xs bg-primary/20 text-primary border-primary/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">API Integration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  OpenRouter streaming client with error handling and system prompt builder
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">Streaming • Retry logic • Key management</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-secondary/20 hover:border-secondary/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Network className="w-8 h-8 text-secondary" />
                <Badge className="text-xs bg-secondary/20 text-secondary border-secondary/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">React Hooks & State</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Custom hooks for coordination, streaming, stats, and Zustand state management
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">5 hooks • 3 stores • React Query</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Sparkles className="w-8 h-8 text-accent" />
                <Badge className="text-xs bg-accent/20 text-accent border-accent/40">Complete</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold">UI Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Chat interface, dashboard, settings, and responsive layout with streaming support
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">15+ components • Markdown • Syntax highlighting</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Three-Layer Architecture</h2>
          
          <div className="space-y-6">
            <Card className="p-8 bg-card/30 backdrop-blur border-swarm-primary/30">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg bg-swarm-primary/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-swarm-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Layer 1: Adaptive Resonance Theory</h3>
                  <p className="text-muted-foreground">
                    Vector-based specialist selection through learned task signatures. Emergent specialization 
                    through execution history and quality feedback. Vigilance parameter controls new specialist creation.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card/30 backdrop-blur border-swarm-secondary/30">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg bg-swarm-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Network className="w-6 h-6 text-swarm-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Layer 2: Dynamic Approach Patterns</h3>
                  <p className="text-muted-foreground">
                    Pattern discovery and evolution through execution analysis. Style characteristics and 
                    performance metrics guide approach selection. Multi-generational pattern refinement.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card/30 backdrop-blur border-swarm-accent/30">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg bg-swarm-accent/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-swarm-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Layer 3: Stigmergic Coordination</h3>
                  <p className="text-muted-foreground">
                    Swarm intelligence through indirect coordination. Pheromone-like signals strengthen 
                    successful approach-task combinations. Time-based decay ensures adaptation to changing patterns.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Built With Modern Tools</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 18', desc: 'UI Framework' },
              { name: 'TypeScript', desc: 'Type Safety' },
              { name: 'Vite', desc: 'Build Tool' },
              { name: 'TailwindCSS', desc: 'Styling' },
              { name: 'Dexie', desc: 'IndexedDB' },
              { name: 'Zustand', desc: 'State Management' },
              { name: 'React Query', desc: 'Data Fetching' },
              { name: 'OpenRouter', desc: 'AI Gateway' },
            ].map((tech) => (
              <Card key={tech.name} className="p-4 bg-card/30 backdrop-blur border-border/50">
                <div className="font-semibold text-sm">{tech.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{tech.desc}</div>
              </Card>
            ))}
          </div>

          <div className="pt-8 space-y-6">
            <Badge variant="outline" className="px-6 py-3 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Phase 8: Integration & Testing Complete ✓
            </Badge>

            <div className="bg-primary/5 rounded-lg border border-primary/20 p-6 text-left max-w-xl mx-auto">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Production Ready
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>E2E & Performance Tests</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>WCAG AA Accessibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Code Splitting & Lazy Loading</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Mobile Responsive Design</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Optimized Production Build</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Project Citation & Lineage */}
      <section className="container mx-auto px-4 py-16 border-t border-border/50 mt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <FileText className="w-6 h-6" />
              Project Citation & Lineage
            </h2>
            <p className="text-muted-foreground text-sm">
              This project is derived from the Cognition-9 experimental framework
            </p>
          </div>

          {/* Related Projects */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Related Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cognition-9 Card */}
              <Card className="p-6 bg-card/50 backdrop-blur hover:border-primary/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Github className="w-5 h-5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">Origin</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold">Cognition-9</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sub Agent Topology Study, Experimental Origins
                    </p>
                  </div>
                  <a
                    href="https://github.com/MushroomFleet/Cognition-9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    View on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>

              {/* Hybrid Swarm Agent Card */}
              <Card className="p-6 bg-card/50 backdrop-blur hover:border-primary/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Github className="w-5 h-5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">Related</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold">Claude Code (Agent.md) Sub-Agents</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hybrid Swarm Agent Implementation
                    </p>
                  </div>
                  <a
                    href="https://github.com/MushroomFleet/Hybrid-Swarm-Agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    View on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            </div>
          </div>

          {/* BibTeX Citation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">BibTeX Citation</h3>
            <Card className="p-6 bg-muted/50 backdrop-blur relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopyBibTeX}
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <pre className="text-sm font-mono overflow-x-auto pr-12">
                <code>{`@software{hybrid_swarm,
  title = {Hybrid Swarm: Derived from Cognition-9 Project},
  author = {[Drift Johnson]},
  year = {2025},
  url = {https://github.com/MushroomFleet/Cognition-9},
  version = {1.0.0}
}`}</code>
              </pre>
            </Card>
          </div>

          {/* Organization Links */}
          <div className="space-y-4 pt-8 border-t border-border/50">
            <h3 className="text-lg font-semibold text-center">Powered By</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://scuffedepoch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card/50 backdrop-blur border border-border rounded-lg hover:border-primary/40 transition-all text-sm font-medium"
              >
                ScuffedEpoch
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://oragenai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card/50 backdrop-blur border border-border rounded-lg hover:border-primary/40 transition-all text-sm font-medium"
              >
                OragenAI
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Trademark */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 ScuffedEpoch ™</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
