# MADDM-Swarm

**Multi-Agent Decision-Making Swarm** - An AI coordination system implementing **stigmergic architecture** and **ADDM (Adaptive Decision-Making) loop control** for parallel multi-specialist execution. Harness the power of emergent intelligence where AI specialists coordinate indirectly through environmental signals (like ant pheromone trails), enabling parallel task resolution with adaptive resonance, quality-based selection, and intelligent loop termination.

## 🚀 Quick Start

Choose your preferred deployment method:

### Option 1: Online Platform (Recommended for beginners)
Visit **[https://maddm-swarm.oragenai.com](https://maddm-swarm.oragenai.com)**

- ✨ **Only requires OpenRouter.ai API key** - no local installation needed
- 🎓 **Interactive tutorial** introducing the Stigmergic Coordinator and ADDM Loop Regulator
- 🔥 **Full-featured experience** with guided experimentation
- 🧪 **ADDM mode** for intelligent iterative content refinement

### Option 2: Local Development

For developers who want to contribute, customize, or run locally:

#### Prerequisites
- **Node.js** (v18+) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Python 3.9+** (for ADDM service)
- **OpenRouter.ai API key** for LLM access
- **ADDM Service** (included in this repository)

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MushroomFleet/MADDM-Swarm-UI/
   cd swarm-forge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Handle Windows native dependencies** (npm optional dependencies bug)
   ```bash
   # Required on Windows - these fix npm's optional dependency installation issues
   npm install @rollup/rollup-win32-x64-msvc
   npm install @swc/core-win32-x64-msvc
   ```

4. **Start the ADDM service** (in a separate terminal)
   ```bash
   cd ../addm-service
   pip install -r requirements.txt
   python run.py
   ```

5. **Start the development server**
   ```bash
   cd ../swarm-forge
   npm run dev
   ```

6. **Open your browser** to `http://localhost:8080`

7. **Configure API keys** in Settings → API Configuration and ADDM Configuration

#### Build for Production
```bash
npm run build
npm run preview
```

## 🧠 How It Works

### Dual Intelligence Architecture

MADDM-Swarm combines two complementary AI coordination approaches:

#### 1. Stigmergic Coordination
Unlike traditional AI orchestration that uses direct communication or central control, MADDM-Swarm employs **stigmergy** - indirect coordination through environmental signals. AI specialists modify their shared environment (signal boundaries) which influences other specialists' behavior, creating emergent coordination patterns similar to ant colonies building complex structures through pheromone trails.

#### 2. ADDM Loop Regulation (New!)
The **Adaptive Decision-Making (ADDM)** system provides intelligent loop control using **drift-diffusion models** to determine when content is ready for delivery. Instead of fixed iteration limits, ADDM continuously evaluates content quality and decides whether to:
- **Enhance**: Continue improving the current response
- **Research**: Gather additional information
- **Complete**: Deliver to user (end loop)

### Parallel Multi-Specialist Execution
- **Adaptive Resonance Layer:** Selects top N specialists most resonant with your task
- **Stigmergic Signals:** Each specialist independently chooses approaches based on environmental signals
- **Parallel Execution:** All selected specialists execute simultaneously for maximum efficiency
- **Quality Voting:** Best response selected based on content quality scores
- **ADDM Loop Control:** Intelligent determination of when iteration should stop
- **Distributed Learning:** All results contribute to system evolution

## 🔧 Features

### Swarm Intelligence
- ⚡ **Parallel Execution:** Execute multiple AI specialists simultaneously
- 🧬 **Adaptive Resonance:** Specialist selection via resonance matching
- 🐜 **Stigmergic Coordination:** Emergent behavior through environmental signals
- 📊 **Quality Assessment:** Content quality scoring and selection
- 💾 **Distributed Learning:** All specialist results contribute to evolution

### ADDM Intelligence (New!)
- 🧠 **Intelligent Loop Control:** ADDM-based quality assessment for loop termination
- 🎯 **Multi-Alternative Decisions:** Enhance/Research/Complete decision framework
- ⚖️ **Configurable Parameters:** Adjustable iteration limits and confidence thresholds
- 📈 **Drift-Diffusion Models:** Neuroscience-inspired decision simulation
- 🔄 **Quality-Based Termination:** Ends loops when content meets standards, not arbitrary limits

### User Experience
- 🎛️ **Interactive Settings:** Configure parallel execution, ADDM parameters, and thresholds
- 📈 **System Monitoring:** Real-time swarm trace visualization and ADDM decision tracking
- 🎯 **Cost Transparency:** Clear cost warnings for both parallel execution and ADDM iteration
- 🎓 **Guided Tutorial:** Interactive introduction to both swarm and ADDM concepts

## 🏗️ Architecture

### Core Components

#### Swarm Intelligence Layer
- **Adaptive Resonance Layer:** Specialist matching and resonance calculation
- **Hybrid Orchestrator:** Stigmergic coordination decision-making
- **Stigmergic Board:** Environmental signal management
- **Parallel Executor:** Simultaneous specialist execution with quality voting
- **Content Analyzer:** Response quality assessment

#### ADDM Intelligence Layer
- **ADDM Loop Manager:** Orchestrates iterative refinement cycles
- **Decision Regulator:** Multi-alternative decision making (enhance/research/complete)
- **Drift-Diffusion Models:** Neuroscience-based decision simulation
- **Quality Assessment:** Content analysis and confidence scoring
- **Loop Termination:** Intelligent stopping conditions

### Key Technologies
- **Frontend:** React + TypeScript with Shadcn/UI components
- **Backend:** Python FastAPI with Pydantic models
- **Build System:** Vite with SWC compilation
- **State Management:** Zustand stores
- **Database:** IndexedDB via Dexie
- **Decision Models:** Custom drift-diffusion model implementation
- **API Integration:** OpenRouter.ai for LLM access

## 🔗 Related Projects

- 🧪 **ADDM Loop Regulator:** [ADDM Agentic Loop Regulator](https://github.com/MushroomFleet/ADDM-Agentic-Loop-Regulator) - Standalone Python ADDM service
- 📋 **Phase Plans:** [Agentic DDM Framework](https://github.com/MushroomFleet/Agentic-DDM-Framework) - Implementation planning
- 🤖 **Claude Code Agent:** [Hybrid Swarm Agent](https://github.com/MushroomFleet/Hybrid-Swarm-Agent) - Code generation agent
- 🧪 **Research Lab:** [Cognition-9 Research](https://github.com/MushroomFleet/Cognition-9) - AI coordination research

## 📋 Usage

### Basic Usage
1. **Set API keys** in Settings for both OpenRouter and ADDM service
2. **Compose your task query** in the chat interface
3. **Choose execution mode:**
   - Sequential: Traditional single-specialist response
   - Parallel: Multi-specialist execution (configurable 2-5 specialists)
   - ADDM: Intelligent iterative refinement with loop control

### ADDM Mode Usage
4. **Configure ADDM parameters:**
   - **Max Iterations:** Maximum refinement cycles (user-adjustable)
   - **Confidence Threshold:** Quality threshold for completion (0.5-0.95)
   - **Workflow Mode:** Research Assembly vs News Analysis
5. **Monitor ADDM decisions** in real-time progress indicators
6. **Review refinement history** to understand the iterative improvement process

## 🎛️ Configuration

### Parallel Execution Settings
- **Enable/Disable:** Toggle multi-specialist parallel execution
- **Specialist Count:** 2-5 concurrent specialists
- **Timeout Protection:** Individual specialist timeout handling
- **Cost Warnings:** Transparent API cost multiplication

### ADDM Loop Regulator Settings
- **Enable/Disable:** Activate intelligent loop control
- **Maximum Iterations:** User-adjustable loop termination (20-100+ recommended range)
- **Confidence Threshold:** Completion quality requirement (0.5-0.95)
- **Workflow Mode:** Research vs News optimization
- **Service URL:** ADDM service endpoint configuration
- **Advanced Parameters:** Context summarization, request timeouts, retry logic

### System Parameters
- **Vigilance Threshold:** Specialist resonance filtering
- **Pattern Discovery:** Automatic learning enablement
- **Execution History:** Response tracking and learning
- **Context Summarization:** Automatic context management for long conversations

## 🧪 ADDM Technical Details

### Decision-Making Process

The ADDM system uses **drift-diffusion models** - mathematical models inspired by neural decision-making:

1. **Content Analysis:** Evaluates current response quality and completeness
2. **Evidence Accumulation:** Builds parallel decision processes for each option
3. **Diffusion Process:** Adds realistic noise and timing to decision simulation
4. **Threshold Crossing:** First decision to reach confidence threshold wins
5. **Quality Termination:** Content delivered when standards are met

### Quality Assessment Factors
- **Content Length:** Substantive responses favor completion
- **Structural Organization:** Well-formatted content scores higher
- **Confidence Calibration:** User-adjustable quality thresholds
- **Iteration Context:** Later iterations gradually favor completion
- **Workflow Adaptation:** Different criteria for research vs news content

### Configurable Parameters
- **Max Iterations:** Safety limit (but ADDM may complete earlier)
- **Confidence Threshold:** Quality requirement for completion
- **Workflow Mode:** Task-specific quality assessment
- **Decision Timing:** Simulated reaction time parameters

## 🤝 Contributing

We welcome contributions! MADDM-Swarm is an open research platform for studying AI coordination patterns and intelligent loop control.

1. Fork the MADDM-Swarm-UI repository
2. Create a feature branch from `main`
3. Make your changes with proper testing
4. Ensure all tests pass (`npm test`)
5. Submit a pull request with detailed description

### Development Tips
- Run `npm run lint` for code quality checks
- Use the swarm trace and ADDM progress indicators for debugging
- Test with both sequential and ADDM execution modes
- Document new features in both README and code comments

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{maddm_swarm,
  title = {MADDM-Swarm: Multi-Agent Decision-Making Swarm with Stigmergic Architecture},
  author = {[Drift Johnson] and {MushroomFleet Contributors]},
  year = {2025},
  url = {https://github.com/MushroomFleet/MADDM-Swarm-UI},
  version = {1.0.0}
}
```

### Related Publications
- **Stigmergic Coordination in AI Systems** - Emergent behavior patterns
- **Drift-Diffusion Models for AI Decision Making** - Quality-based loop termination
- **Parallel Multi-Agent Execution** - Efficiency optimization techniques

## 📄 License

Copyright 2025 Drift Johnson. All rights reserved.

## ⚠️ Disclaimer

This software is experimental and provided as-is for research purposes. Use of AI systems should follow ethical guidelines and consider potential risks. MADDM-Swarm incorporates both swarm intelligence patterns and advanced decision-making models that may produce unexpected results - always review AI-generated content before use.
