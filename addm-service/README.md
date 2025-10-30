# ADDM Loop Regulator Service

**Agentic Drift-Diffusion Model for Intelligent Loop Control** - A Python FastAPI service that provides neuroscience-inspired decision-making for AI agent iterations. Instead of fixed loop limits, the ADDM Service evaluates content quality and intelligently decides whether to enhance, research further, or complete the iteration cycle.

## 🔮 What is ADDM?

ADDM (Adaptive Decision-Making) implements **drift-diffusion models** - mathematical models inspired by neural decision-making in the brain. The service provides:

- 🧠 **Neuroscience-Inspired Decisions:** Uses evidence accumulation and temporal noise to simulate human-like decision making
- 🎯 **Quality-Based Termination:** Ends loops when content meets standards, not arbitrary iteration counts
- 🏗️ **Multi-Alternative Assessment:** Evaluates three decisions simultaneously: Enhance, Research, and Complete
- ⚖️ **Configurable Thresholds:** User-adjustable confidence requirements and parameters
- 🔄 **Workflow Optimization:** Different evaluation criteria for research vs news analysis workflows

## ⚡ Quick Start

### Prerequisites
- **Python 3.9+**
- **OpenRouter.ai API key** (for content analysis)

### Installation

1. **Clone and navigate:**
   ```bash
   cd addm-service
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

4. **Start the service:**
   ```bash
   # Option 1: Direct Python execution
   python run.py

   # Option 2: Docker
   docker-compose up -d
   ```

5. **Verify running:**
   ```bash
   curl http://localhost:8001/health
   ```

## 🏗️ Architecture

### Decision-Making Process

1. **Content Analysis:** Evaluates response quality, completeness, and structure
2. **Evidence Accumulation:** Builds decision evidence for three alternatives:
   - **Enhance:** Refine and improve the current response
   - **Research:** Gather additional information
   - **Complete:** Content is ready for delivery
3. **Diffusion Simulation:** Adds realistic temporal noise and decision timing
4. **Threshold Crossing:** First decision reaching confidence threshold wins
5. **Quality Termination:** Intelligent stopping based on content standards

### Key Components
- **FastAPI Backend:** REST API for decision requests
- **Multi-Alternative DDM:** Simultaneous evaluation of all decision options
- **Quality Assessment:** Content-based scoring algorithms
- **Workflow Adaptation:** Different logic for research assembly vs news analysis
- **Configurable Parameters:** Adjustable thresholds and behavioral parameters

## 📡 API Usage

### Basic Decision Request

```python
import requests

payload = {
    'content': 'Your AI-generated content here...',
    'context': 'Optional: previous conversation context',
    'workflow_mode': 'research_assembly',  # or 'news_analysis'
    'iteration': 0,
    'confidence_threshold': 0.85,
    'max_iterations': 20
}

response = requests.post('http://localhost:8001/api/v1/decide', json=payload)

if response.status_code == 200:
    decision = response.json()
    print(f"Decision: {decision['decision']}")  # 'enhance', 'research', or 'complete'
    print(f"Confidence: {decision['confidence']}")  # 0.0 to 1.0
    print(f"Next prompt: {decision['next_prompt']}")  # optional refinement suggestion
```

### Response Format

```json
{
  "decision": "enhance",
  "confidence": 0.78,
  "reaction_time": 1250.5,
  "reasoning": "Iteration 1: Content needs enhancement and refinement. (confidence: 0.78)",
  "metrics": {
    "quality_score": 0.78,
    "completeness_score": 0.65,
    "improvement_potential": 0.8
  },
  "next_prompt": "Enhance and refine the previous response...",
  "should_summarize": false
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here

# Environment & Logging
ENVIRONMENT=development
LOG_LEVEL=info

# ADDM Parameters
MAX_ITERATIONS=20
DEFAULT_CONFIDENCE_THRESHOLD=0.85
CONTEXT_SUMMARIZATION_THRESHOLD=32000

# OpenRouter Model
OPENROUTER_MODEL=anthropic/claude-sonnet-4-20250514
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Workflow Modes

- **research_assembly:** Optimizes for thorough, evidence-based research accumulation
- **news_analysis:** Balances speed with analysis depth

## 🧪 Testing

### Docker Testing
```bash
docker-compose run --rm addm-service python test_response.py
```

### Direct Testing
```bash
# Install pytest
pip install pytest

# Run tests
pytest tests/

# Run specific test
python test_response.py
```

## 🔗 Integration

### Full MADDM-Swarm System
This service is designed to work with the complete **[MADDM-Swarm UI](https://github.com/MushroomFleet/MADDM-Swarm-UI)**:

- **Frontend UI:** React + TypeScript interface with swarm coordination
- **Backend Integration:** REST API communication
- **Real-time Decisions:** Live ADDM progress tracking
- **Stigmergic Architecture:** Emergent AI specialist coordination

### Standalone Usage
For standalone AI applications, integrate the ADDM service for intelligent iteration control:

```python
class AIDecisionMaker:
    def __init__(self):
        self.addm_endpoint = "http://localhost:8001/api/v1/decide"

    def should_continue_iteration(self, content, iteration):
        # ADDM decision logic here
        return True/False
```

## 📋 Quality Assessment Factors

The ADDM system evaluates content based on:

- **Content Length:** Substantial responses favor completion
- **Structural Organization:** Well-formatted content scores higher
- **Workflow Adaptation:** Context-aware criteria for different use cases
- **Iteration Context:** Later iterations gradually favor completion
- **Confidence Calibration:** User-defined quality thresholds

## 🤝 Contributing

### Development Setup
```bash
# Install development dependencies
pip install -r requirements.txt

# Install additional dev tools
pip install pytest-cov pytest-mock

# Run with auto-reload
python run.py
```

### Testing Guidelines
- Focus on DDM simulation accuracy
- Test different workflow modes
- Validate confidence threshold behavior
- Ensure API response formats

## 📚 Citation

```bibtex
@software{addm_service,
  title = {ADDM Loop Regulator: Agentic Drift-Diffusion Model Service},
  author = {[Drift Johnson] and {MushroomFleet Contributors]},
  year = {2025},
  url = {https://github.com/MushroomFleet/MADDM-Swarm-UI/tree/main/addm-service},
  version = {1.0.0}
}
```

## ⚠️ Disclaimer

This software implements experimental AI decision-making models based on neuroscience research. Decision quality depends on input content analysis and configurable parameters. Always review AI-generated content and system decisions before use.
