import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  Network,
  Zap,
  Play,
  Users,
  TrendingUp,
  Lightbulb,
  GraduationCap,
  Info,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  BarChart3,
  MessageSquare,
} from "lucide-react";

const Tutorial = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-swarm opacity-5" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="px-4 py-2 border-swarm-primary/50 text-swarm-primary">
              <GraduationCap className="w-4 h-4 mr-2 inline" />
              Educational Tutorial
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight">
              Understanding{" "}
              <span className="bg-gradient-swarm bg-clip-text text-transparent">
                Hybrid Swarm Intelligence
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how three layers of coordination create emergent, adaptive behavior 
              without centralized control. Discover the principles of swarm intelligence applied to AI systems.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#introduction" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              Introduction
            </a>
            <a href="#three-layers" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              The Three Layers
            </a>
            <a href="#lifecycle" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              System Lifecycle
            </a>
            <a href="#swarm-traces" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              Reading Swarm Traces
            </a>
            <a href="#usage" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              Practical Usage
            </a>
            <a href="#significance" className="px-4 py-2 rounded-lg bg-card border hover:border-primary/50 transition-colors text-sm">
              Why It Matters
            </a>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction */}
        <section id="introduction" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Introduction
          </h2>
          <Card className="p-6 bg-card/50 backdrop-blur">
            <p className="text-muted-foreground leading-relaxed mb-4">
              This system demonstrates <strong>hybrid swarm intelligence</strong> – a coordination 
              architecture where multiple AI specialists work together without centralized control. 
              Unlike traditional systems with fixed rules, this approach learns and adapts through three 
              interconnected layers of coordination.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-swarm-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Self-Organizing</div>
                  <div className="text-xs text-muted-foreground">Specialists emerge naturally through experience</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-swarm-secondary flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Adaptive Learning</div>
                  <div className="text-xs text-muted-foreground">Patterns discovered from actual usage</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-swarm-accent flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Transparent</div>
                  <div className="text-xs text-muted-foreground">Every decision is visible via swarm traces</div>
                </div>
              </div>
            </div>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>What Makes It "Hybrid"?</AlertTitle>
            <AlertDescription>
              It combines three coordination mechanisms: ART (neural-inspired), Dynamic Approaches (pattern-based), 
              and Stigmergy (swarm-inspired). Each layer operates independently yet influences the others.
            </AlertDescription>
          </Alert>
        </section>

        <Separator className="my-12" />

        {/* The Three Layers */}
        <section id="three-layers" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            The Three Layers
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            {/* Layer 1: ART */}
            <AccordionItem value="art" className="border rounded-lg px-6 bg-card/30 backdrop-blur">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-swarm-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-swarm-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Layer 1: Adaptive Resonance Theory</div>
                    <div className="text-sm text-muted-foreground">Vector-based specialist selection</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  ART is the "nervous system" of the swarm. Each specialist develops a unique <strong>task signature</strong> – 
                  a vector representing the types of tasks it has successfully handled. When a new task arrives, 
                  it's converted to a vector, and specialists with similar signatures "resonate" more strongly.
                </p>
                
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    How It Works
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Task arrives and is vectorized (keywords → numbers)</li>
                    <li>System calculates similarity with each specialist's signature</li>
                    <li>If similarity exceeds vigilance threshold (ρ=0.75), specialist is selected</li>
                    <li>If no match, a new specialist is created</li>
                    <li>After execution, specialist's signature is updated based on success</li>
                  </ol>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Example</AlertTitle>
                  <AlertDescription>
                    When you ask "Explain machine learning", specialists with signatures containing vectors for 
                    ["explain", "machine", "learning", "AI"] will resonate. A specialist that previously handled 
                    "What is deep learning?" will match strongly.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Vigilance: ρ=0.75</Badge>
                  <Badge variant="secondary" className="text-xs">Cosine Similarity</Badge>
                  <Badge variant="secondary" className="text-xs">Learning Rate: α=0.2</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Layer 2: Dynamic Approaches */}
            <AccordionItem value="approaches" className="border rounded-lg px-6 bg-card/30 backdrop-blur">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-swarm-secondary/20 flex items-center justify-center">
                    <Network className="w-5 h-5 text-swarm-secondary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Layer 2: Dynamic Approach Patterns</div>
                    <div className="text-sm text-muted-foreground">Pattern discovery and evolution</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  While ART selects <em>who</em> handles a task, this layer determines <em>how</em>. Approaches are 
                  response patterns discovered through clustering analysis of past executions. They capture style, 
                  structure, and strategy.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Pattern Discovery Process
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>System accumulates 10+ execution histories (bootstrap phase)</li>
                    <li>User triggers pattern discovery from Dashboard</li>
                    <li>Clustering algorithm identifies common patterns in responses</li>
                    <li>Each cluster becomes an "approach" with signature characteristics</li>
                    <li>Future tasks match against approach signatures for selection</li>
                  </ol>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Example</AlertTitle>
                  <AlertDescription>
                    After analyzing conversations, the system might discover: "Analytical Approach" (technical, 
                    detailed), "Creative Approach" (metaphors, storytelling), "Concise Approach" (bullet points, 
                    summaries). Future tasks match to the most appropriate style.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Threshold: τ=0.3</Badge>
                  <Badge variant="secondary" className="text-xs">Multi-generation</Badge>
                  <Badge variant="secondary" className="text-xs">Quality Metrics</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Layer 3: Stigmergic Signals */}
            <AccordionItem value="stigmergy" className="border rounded-lg px-6 bg-card/30 backdrop-blur">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-swarm-accent/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-swarm-accent" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Layer 3: Stigmergic Coordination</div>
                    <div className="text-sm text-muted-foreground">Pheromone-like indirect signals</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Named after how ants coordinate through pheromone trails, this layer uses <strong>signals</strong> 
                  to mark successful combinations. When a specialist-approach pair performs well, it leaves a "trace" 
                  that influences future decisions. Signals decay over time to adapt to changing patterns.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Signal Lifecycle
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Specialist completes task using an approach</li>
                    <li>Quality is measured (response relevance, coherence)</li>
                    <li>Signal strength = base_strength + quality_bonus</li>
                    <li>Signal is stored with timestamp</li>
                    <li>Over time, old signals decay (half-life: 7 days)</li>
                    <li>Future selections favor specialist-approach pairs with strong signals</li>
                  </ol>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Example</AlertTitle>
                  <AlertDescription>
                    Specialist #3 uses "Analytical Approach" successfully 5 times. Strong signals accumulate. 
                    When a similar task arrives, the system is more likely to select Specialist #3 with Analytical 
                    Approach – even if another combination scores slightly higher on ART matching.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Decay: 7d half-life</Badge>
                  <Badge variant="secondary" className="text-xs">Quality-weighted</Badge>
                  <Badge variant="secondary" className="text-xs">Indirect coordination</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-12" />

        {/* System Lifecycle */}
        <section id="lifecycle" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Play className="w-8 h-8 text-primary" />
            System Lifecycle
          </h2>

          <div className="space-y-6">
            {/* Phase 1: Bootstrap */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur border-l-4 border-l-swarm-primary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-swarm-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-swarm-primary">1</span>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold">Bootstrap Phase</h3>
                  <p className="text-muted-foreground">
                    The system starts with <strong>no patterns</strong>. During this phase, it uses a fallback approach 
                    (general-purpose coordination) while accumulating execution history. You'll see a progress indicator 
                    showing "7/10 executions" in the chat header.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>ART layer is active (specialists can form)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span>No approach patterns yet (uses fallback)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span>Signals can't form without approaches</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Status: Learning</Badge>
                </div>
              </div>
            </Card>

            {/* Phase 2: Pattern Discovery */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur border-l-4 border-l-swarm-secondary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-swarm-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-swarm-secondary">2</span>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold">Pattern Discovery Trigger</h3>
                  <p className="text-muted-foreground">
                    Once you have 10+ diverse conversations, the system is ready for pattern discovery. Navigate to the 
                    Dashboard and click <strong>"Run Pattern Discovery"</strong>. The system will analyze all execution 
                    histories, cluster similar responses, and create approach patterns.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Clustering identifies response patterns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Approach objects created with signatures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>System unlocks full three-layer coordination</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-swarm-secondary text-swarm-secondary">Action Required</Badge>
                </div>
              </div>
            </Card>

            {/* Phase 3: Emergent Coordination */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur border-l-4 border-l-swarm-accent">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-swarm-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-swarm-accent">3</span>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold">Emergent Coordination</h3>
                  <p className="text-muted-foreground">
                    All three layers are now active. The system coordinates without central control: ART matches 
                    specialists, approaches are selected by pattern similarity, and stigmergic signals reinforce 
                    successful combinations. Each execution continues to refine the system.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Full swarm intelligence active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Continuous learning from feedback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Adaptive to changing task patterns</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">Status: Active</Badge>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Reading Swarm Traces */}
        <section id="swarm-traces" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Reading Swarm Traces
          </h2>
          
          <Card className="p-6 bg-card/50 backdrop-blur">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Every AI response includes a <strong>Swarm Trace</strong> – metadata revealing the coordination 
              decisions. Click the colored badge in any AI message to see the trace.
            </p>

            <div className="space-y-4 mt-6">
              <div className="border-l-4 border-swarm-primary pl-4">
                <div className="font-semibold text-sm mb-1">Specialist Information</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>ID:</strong> Unique identifier (e.g., "spec_abc123")</div>
                  <div><strong>Executions:</strong> How many tasks this specialist has handled</div>
                  <div><strong>Quality Score:</strong> Performance metric (0-100)</div>
                  <div><strong>Specialization:</strong> Key domains based on signature vectors</div>
                </div>
              </div>

              <div className="border-l-4 border-swarm-secondary pl-4">
                <div className="font-semibold text-sm mb-1">Approach Details</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>Name:</strong> Pattern identifier (e.g., "Analytical Pattern")</div>
                  <div><strong>Usage Count:</strong> How often this approach has been selected</div>
                  <div><strong>Quality Trend:</strong> Performance over last 5 uses</div>
                  <div><strong>Characteristics:</strong> Style traits discovered through clustering</div>
                </div>
              </div>

              <div className="border-l-4 border-swarm-accent pl-4">
                <div className="font-semibold text-sm mb-1">Coordination Context</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>Swarm Size:</strong> Active specialists and approaches in system</div>
                  <div><strong>Task Vector:</strong> How the user's message was encoded</div>
                  <div><strong>Complexity:</strong> Estimated difficulty (word count, keywords)</div>
                  <div><strong>Bootstrap Mode:</strong> Whether pattern discovery has been run</div>
                </div>
              </div>
            </div>
          </Card>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Transparency Matters</AlertTitle>
            <AlertDescription>
              Unlike black-box AI systems, every decision is traceable. You can see exactly which specialist was 
              chosen, why a particular approach was selected, and how the coordination layers interacted.
            </AlertDescription>
          </Alert>
        </section>

        <Separator className="my-12" />

        {/* Practical Usage */}
        <section id="usage" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Practical Usage Guide
          </h2>

          <div className="grid gap-4">
            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Set Your API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to Settings → Add your OpenRouter API key. The system uses OpenRouter to access various LLM models.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Start Diverse Conversations</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the Chat interface to ask varied questions. Try different topics, complexity levels, and 
                    conversation styles. This diversity helps the system discover meaningful patterns.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Watch Progress in Chat Header</h3>
                  <p className="text-sm text-muted-foreground">
                    The pattern discovery progress bar shows your execution count. Once you reach 10+, you can unlock 
                    full coordination capabilities.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Run Pattern Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to Dashboard → Click "Run Pattern Discovery". This triggers clustering analysis and creates 
                    approach patterns from your conversation history.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Explore the Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    View specialist performance cards, signal board visualization, and approach evolution metrics. 
                    This helps you understand how the swarm is learning and adapting.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Inspect Swarm Traces</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the colored badges in AI responses to see coordination metadata. Compare traces across 
                    different messages to observe specialization patterns.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Educational Significance */}
        <section id="significance" className="space-y-6 mb-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Educational Significance
          </h2>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-primary/30">
            <p className="text-muted-foreground leading-relaxed mb-6">
              This system demonstrates fundamental concepts in distributed AI, swarm intelligence, and 
              self-organizing systems. It's valuable for:
            </p>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-swarm-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Understanding Emergence</div>
                  <div className="text-xs text-muted-foreground">
                    Complex coordination arises from simple rules. No central controller dictates behavior – 
                    specialization and patterns emerge organically through interaction and feedback.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Network className="w-5 h-5 text-swarm-secondary flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Pattern Discovery vs Hard-Coding</div>
                  <div className="text-xs text-muted-foreground">
                    Instead of manually defining how the AI should respond to different query types, the system 
                    learns patterns from actual usage. This demonstrates data-driven adaptation.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-swarm-accent flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Indirect Coordination Mechanisms</div>
                  <div className="text-xs text-muted-foreground">
                    Stigmergy shows how agents can coordinate without direct communication. Like ants following 
                    pheromone trails, specialists benefit from traces left by previous successes.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Transparent AI Decision-Making</div>
                  <div className="text-xs text-muted-foreground">
                    Every coordination decision is visible and traceable. This transparency is crucial for 
                    understanding, debugging, and trusting AI systems.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-sm">Practical Implementation</div>
                  <div className="text-xs text-muted-foreground">
                    This is a working system, not a theoretical model. You can experiment, observe emergent 
                    behaviors, and understand how principles from nature inspire computational intelligence.
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertTitle>Further Learning</AlertTitle>
            <AlertDescription>
              Explore concepts like Adaptive Resonance Theory (Grossberg), Stigmergy (Grassé), Swarm Intelligence 
              (Bonabeau), and Multi-Agent Systems to deepen your understanding of the principles demonstrated here.
            </AlertDescription>
          </Alert>
        </section>

        {/* Quick Links */}
        <section className="space-y-6 mb-16">
          <Card className="p-8 bg-gradient-swarm/5 border-primary/30">
            <h3 className="text-xl font-bold text-center mb-6">Ready to Explore?</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="/chat" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Start Chatting
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/dashboard" 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors inline-flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Tutorial;
