"""
API endpoint tests for ADDM service
Tests FastAPI endpoints with proper mocking
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime

from main import app
from models.schemas import DecisionRequest, DecisionResponse


@pytest.fixture
def client():
    """Test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
def sample_request_data():
    """Sample request data for testing"""
    return {
        "content": "This is test content about quantum computing.",
        "context": "Previous discussion covered basic concepts.",
        "workflow_mode": "research_assembly",
        "iteration": 1,
        "confidence_threshold": 0.85,
        "max_iterations": 10
    }


class TestHealthEndpoint:
    """Test suite for health check endpoint"""

    def test_health_returns_success(self, client):
        """Test health endpoint returns healthy status"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert data["service"] == "addm-regulator"
        assert "version" in data

    def test_health_content_type(self, client):
        """Test health endpoint returns correct content type"""
        response = client.get("/health")

        assert response.headers["content-type"] == "application/json"


class TestDecisionEndpoint:
    """Test suite for decision API endpoint"""

    def test_decide_post_success(self, client, sample_request_data):
        """Test successful decision POST request"""
        response = client.post("/api/v1/decide", json=sample_request_data)

        assert response.status_code == 200
        data = response.json()

        # Validate response structure
        assert "decision" in data
        assert "confidence" in data
        assert "reaction_time" in data
        assert "reasoning" in data
        assert "metrics" in data
        assert "timestamp" in data

        # Validate decision values
        assert data["decision"] in ["enhance", "research", "complete"]
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["reaction_time"] >= 0

        # Validate metrics structure
        metrics = data["metrics"]
        assert "quality_score" in metrics
        assert "completeness_score" in metrics
        assert "improvement_potential" in metrics

        # Validate timestamp is recent
        timestamp = datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
        now = datetime.utcnow()
        time_diff = abs((now - timestamp).total_seconds())
        assert time_diff < 5  # Within 5 seconds

    def test_decide_handles_empty_context(self, client):
        """Test decision with empty context"""
        request_data = {
            "content": "Test content",
            "context": "",  # Empty context
            "workflow_mode": "news_analysis",
            "iteration": 0,
            "confidence_threshold": 0.8,
            "max_iterations": 5
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["decision"] in ["enhance", "research", "complete"]

    def test_decide_validation_error_empty_content(self, client):
        """Test validation error for empty content"""
        request_data = {
            "content": "",  # Invalid empty content
            "context": "some context",
            "workflow_mode": "research_assembly",
            "iteration": 1,
            "confidence_threshold": 0.85,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_decide_validation_error_invalid_workflow_mode(self, client):
        """Test validation error for invalid workflow mode"""
        request_data = {
            "content": "Test content",
            "context": "some context",
            "workflow_mode": "invalid_mode",  # Invalid
            "iteration": 1,
            "confidence_threshold": 0.85,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 422  # Validation error

    @pytest.mark.parametrize("iteration", [0, 5, 9])
    def test_decide_handles_different_iterations(self, client, iteration):
        """Test decision handling for different iteration values"""
        request_data = {
            "content": "Test content for iteration handling",
            "context": f"Context for iteration {iteration}",
            "workflow_mode": "research_assembly",
            "iteration": iteration,
            "confidence_threshold": 0.85,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["decision"] in ["enhance", "research", "complete"]

    @pytest.mark.parametrize("confidence_threshold", [0.5, 0.75, 0.9])
    def test_decide_handles_different_confidence_thresholds(self, client, confidence_threshold):
        """Test decision handling for different confidence thresholds"""
        request_data = {
            "content": "Test content",
            "context": "",
            "workflow_mode": "research_assembly",
            "iteration": 1,
            "confidence_threshold": confidence_threshold,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["decision"] in ["enhance", "research", "complete"]

    def test_decide_next_prompt_included_when_needed(self, client):
        """Test that next_prompt is included for enhance/research but not complete"""
        # Mock regulator to return enhance decision
        with patch('main.regulator') as mock_regulator:
            mock_regulator.make_decision.return_value = (
                "enhance", 0.8, 150.0, "Test reasoning", "Continue with more details"
            )

            request_data = {
                "content": "Test content",
                "context": "",
                "workflow_mode": "research_assembly",
                "iteration": 1,
                "confidence_threshold": 0.85,
                "max_iterations": 10
            }

            response = client.post("/api/v1/decide", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["decision"] == "enhance"
            assert "next_prompt" in data
            assert data["next_prompt"] == "Continue with more details"

    def test_decide_next_prompt_none_for_complete(self, client):
        """Test that next_prompt is null for complete decisions"""
        # Mock regulator to return complete decision
        with patch('main.regulator') as mock_regulator:
            mock_regulator.make_decision.return_value = (
                "complete", 0.95, 200.0, "Content is complete", None
            )

            request_data = {
                "content": "Perfect content",
                "context": "",
                "workflow_mode": "research_assembly",
                "iteration": 5,
                "confidence_threshold": 0.85,
                "max_iterations": 10
            }

            response = client.post("/api/v1/decide", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["decision"] == "complete"
            assert data["next_prompt"] is None

    def test_decide_should_summarize_based_on_content_length(self, client):
        """Test that should_summarize is true for long content + context"""
        long_content = "x" * 20000  # Very long content
        long_context = "y" * 20000  # Very long context

        request_data = {
            "content": long_content,
            "context": long_context,
            "workflow_mode": "research_assembly",
            "iteration": 1,
            "confidence_threshold": 0.85,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["should_summarize"] is True

    def test_decide_should_summarize_false_for_short_content(self, client):
        """Test that should_summarize is false for short content"""
        request_data = {
            "content": "Short content",
            "context": "Short context",
            "workflow_mode": "research_assembly",
            "iteration": 1,
            "confidence_threshold": 0.85,
            "max_iterations": 10
        }

        response = client.post("/api/v1/decide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["should_summarize"] is False

    def test_decide_error_handling(self, client):
        """Test error handling when regulator raises exception"""
        with patch('main.regulator') as mock_regulator:
            mock_regulator.make_decision.side_effect = Exception("Test error")

            request_data = {
                "content": "Test content",
                "context": "",
                "workflow_mode": "research_assembly",
                "iteration": 1,
                "confidence_threshold": 0.85,
                "max_iterations": 10
            }

            response = client.post("/api/v1/decide", json=request_data)

            assert response.status_code == 500
            data = response.json()
            assert "error" in data or "detail" in data

    def test_decide_response_matches_schema(self, client, sample_request_data):
        """Test that response matches DecisionResponse schema"""
        response = client.post("/api/v1/decide", json=sample_request_data)

        assert response.status_code == 200
        data = response.json()

        # Can validate against schema if pydantic validation is available
        DecisionResponse(**data)  # Should not raise exception

        # Additional schema checks
        assert isinstance(data["decision"], str)
        assert isinstance(data["confidence"], float)
        assert isinstance(data["reaction_time"], float)
        assert isinstance(data["reasoning"], str)
        assert isinstance(data["metrics"], dict)
        assert isinstance(data["should_summarize"], bool)
        assert isinstance(data["timestamp"], str)


class TestStatusEndpoint:
    """Test suite for status endpoint"""

    def test_status_returns_operational(self, client):
        """Test status endpoint returns operational status"""
        response = client.get("/api/v1/status")

        assert response.status_code == 200
        data = response.json()

        assert data["service"] == "addm-regulator"
        assert data["status"] == "operational"
        assert "version" in data

    def test_status_content_type(self, client):
        """Test status endpoint returns correct content type"""
        response = client.get("/api/v1/status")

        assert response.headers["content-type"] == "application/json"


class TestHTTPMethods:
    """Test HTTP method restrictions"""

    def test_decide_post_only(self, client):
        """Test that /api/v1/decide only accepts POST"""
        # GET should fail
        response = client.get("/api/v1/decide")
        assert response.status_code == 405

        # PUT should fail
        response = client.put("/api/v1/decide", json={})
        assert response.status_code == 405

        # DELETE should fail
        response = client.delete("/api/v1/decide")
        assert response.status_code == 405

    def test_health_get_only(self, client):
        """Test that /health only accepts GET"""
        # POST should fail
        response = client.post("/health")
        assert response.status_code == 405

    def test_status_get_only(self, client):
        """Test that /api/v1/status only accepts GET"""
        # POST should fail
        response = client.post("/api/v1/status")
        assert response.status_code == 405


class TestCORS:
    """Test CORS middleware configuration"""

    def test_cors_headers_present(self, client):
        """Test that CORS headers are included in responses"""
        response = client.options("/health")

        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers

    def test_cors_allow_all_origins(self, client):
        """Test that all origins are allowed"""
        response = client.get("/health")

        assert response.headers["access-control-allow-origin"] == "*"
