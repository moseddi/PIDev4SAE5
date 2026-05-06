"""
Event & Club Recommendation API
=================================
Adapted from the ML Notebook: fullversionenglishlearning.ipynb
Original: Random Forest + XGBoost predicting personalized_content_effectiveness
Adapted:  Content-Based Filtering for Event/Club Recommendations

Key Algorithm Concepts Preserved from Notebook:
  - Engagement Level Classification (High/Medium/Low) from Phase 2
  - Content Type Effectiveness analysis from Objective 3 (Step 2)
  - Combination analysis (type + style + difficulty) from Objective 3 (Step 3)
  - RobustScaler normalization concept (scores normalized 0-1)
  - Feature importance weighting (from Random Forest feature importance)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI(
    title="Event & Club Recommendation API",
    description="ML-powered recommendation engine adapted from English Learning Platform notebook",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATA MODELS
# ============================================================

class EventData(BaseModel):
    id: int
    title: str
    type: str                          # Workshop, Seminar, Conference, Competition, Other
    status: str                        # PLANNED, ONGOING, COMPLETED
    maxParticipants: int
    currentParticipants: int
    clubId: Optional[int] = None
    estimatedCost: Optional[float] = 0.0
    startDate: Optional[str] = None

class UserProfile(BaseModel):
    userId: int
    specialty: Optional[str] = None          # INFO, BUSINESS, ART, ENGINEERING, OTHER
    engagementLevel: Optional[str] = None    # High, Medium, Low (passed in or calculated)
    registeredEventTypes: Optional[List[str]] = []
    registeredClubIds: Optional[List[int]] = []
    totalRegistrations: Optional[int] = 0
    preferredPayment: Optional[str] = None

class RecommendationRequest(BaseModel):
    user: UserProfile
    events: List[EventData]
    topN: Optional[int] = 5

class RecommendedEvent(BaseModel):
    eventId: int
    title: str
    score: float
    percentage: int       # 0-100 for progress bar display
    reason: str
    badge: str            # "Top Pick", "Trending", "Perfect Match", etc.
    engagementTag: str    # "For Active Members", "Great for Beginners", etc.

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedEvent]
    userEngagementLevel: str
    algorithm: str
    totalAnalyzed: int


# ============================================================
# ALGORITHM CONSTANTS
# Derived from Notebook's "OBJECTIF 3: SYSTÈME DE RECOMMANDATION"
# Original: content_type effectiveness rates (Game>Quiz>Video>Text)
# Adapted:  event_type effectiveness for engagement
# ============================================================

# Adapted from notebook's content_type effectiveness analysis:
# Game (high interaction) → Competition
# Quiz (assessment)       → Workshop (hands-on)
# Video (passive)         → Conference (presentations)
# Text (reading)          → Seminar (lecture-based)
EVENT_TYPE_BASE_SCORES = {
    "Competition": 0.92,   # Highest engagement (like "Game" in notebook)
    "Workshop":    0.88,   # Hands-on, high interaction (like "Quiz")
    "Conference":  0.74,   # Presentations, moderate (like "Video")
    "Seminar":     0.68,   # Lecture-based (like "Text")
    "Other":       0.60,   # Unknown
}

# Adapted from notebook's engagement_level multipliers
# Low/Medium → 100% target=0; High → 33.9% target=1
# We adapt this: High users need more challenging/diverse events
ENGAGEMENT_MULTIPLIERS = {
    "High":   1.25,   # Active: boost competitive/conference events
    "Medium": 1.00,   # Normal recommendations
    "Low":    0.90,   # New: boost free/beginner events slightly less overall
}

# Specialty-to-EventType affinity matrix
# Adapted from notebook's teaching_style analysis
SPECIALTY_TYPE_AFFINITY = {
    "INFO":        {"Workshop": 0.25, "Competition": 0.20, "Conference": 0.15, "Seminar": 0.10, "Other": 0.05},
    "BUSINESS":    {"Conference": 0.25, "Seminar": 0.20, "Workshop": 0.15, "Competition": 0.10, "Other": 0.05},
    "ART":         {"Workshop": 0.25, "Other": 0.20, "Seminar": 0.15, "Conference": 0.10, "Competition": 0.05},
    "ENGINEERING": {"Workshop": 0.25, "Competition": 0.22, "Conference": 0.15, "Seminar": 0.08, "Other": 0.05},
    "OTHER":       {"Workshop": 0.15, "Conference": 0.15, "Seminar": 0.15, "Competition": 0.15, "Other": 0.10},
}

BADGE_THRESHOLDS = {
    0.85: ("🏆 Top Pick",     "top-pick"),
    0.75: ("🔥 Trending",     "trending"),
    0.65: ("✨ Perfect Match", "perfect-match"),
    0.50: ("👍 Recommended",  "recommended"),
    0.00: ("📅 Suggested",    "suggested"),
}


# ============================================================
# CORE FUNCTIONS
# ============================================================

def classify_engagement_level(total_registrations: int) -> str:
    """
    Adapted from Notebook Phase 2 - engagement_level classification.
    Original: Low (0-low activity) / Medium / High (most active)
    Threshold from notebook: High engagement correlates with target=1
    """
    if total_registrations >= 5:
        return "High"
    elif total_registrations >= 2:
        return "Medium"
    else:
        return "Low"


def compute_fill_rate_score(current: int, max_participants: int) -> float:
    """
    Popularity score based on fill rate.
    Adapted from notebook's session count weighting (n_sessions >= 10 threshold).
    Sweet spot: 30-75% filled → popular but accessible
    """
    if max_participants <= 0:
        return 0.05
    fill_rate = current / max_participants

    if 0.30 <= fill_rate <= 0.75:
        # Peak appeal: popular but has available spots
        return 0.18
    elif fill_rate < 0.30:
        # Low demand
        return 0.08
    elif fill_rate < 0.90:
        # High demand, few spots
        return 0.14
    else:
        # Nearly full
        return 0.06


def score_event_for_user(event: EventData, user: UserProfile, engagement_level: str) -> tuple:
    """
    Main recommendation scoring function.

    Adapted from Notebook Objective 3, ÉTAPE 4: RECOMMANDATIONS FINALES
    Original: scores content + teaching_style + difficulty combinations
    Adapted:  scores event based on type, user profile, popularity, affinity

    Feature weights derived from notebook's Random Forest feature_importance:
      - engagement_level features were top importance → engagement match weight: 0.30
      - content_type → event type base score: 0.25
      - adaptive_score (personalization) → specialty affinity: 0.20
      - student_feedback_score → popularity/fill_rate: 0.15
      - other features → club/status/cost: 0.10
    """
    score = 0.0
    reasons = []

    event_type = event.type.capitalize() if event.type else "Other"
    if event_type not in EVENT_TYPE_BASE_SCORES:
        event_type = "Other"

    # ── FEATURE 1: Event Type Base Score (weight: 0.25) ──────────────────
    # Notebook: content_type_displayed effectiveness rates
    # Adapted: event type engagement effectiveness
    type_score = EVENT_TYPE_BASE_SCORES.get(event_type, 0.60)
    score += type_score * 0.25

    # ── FEATURE 2: User History Match (weight: 0.30) ─────────────────────
    # Notebook: engagement_level was top-1 feature (data-driven insight)
    # Adapted: if user previously attended this event type → strong preference signal
    registered_types = [t.capitalize() for t in (user.registeredEventTypes or [])]
    if event_type in registered_types:
        freq = registered_types.count(event_type)
        history_bonus = min(0.30, 0.15 + (freq * 0.05))  # caps at 0.30
        score += history_bonus
        reasons.append(f"Matches your passion for {event_type}s")
    else:
        # Novelty bonus for new types (diversity recommendation)
        score += 0.05
        if engagement_level == "High":
            reasons.append(f"Explore a new {event_type} event")

    # ── FEATURE 3: Specialty-Type Affinity (weight: 0.20) ────────────────
    # Notebook: teaching_style match analysis (Kinesthetic/Auditory/Visual/Mixed)
    # Adapted: specialty (INFO/BUSINESS/ART/ENGINEERING) → event type affinity
    specialty = (user.specialty or "OTHER").upper()
    affinity_map = SPECIALTY_TYPE_AFFINITY.get(specialty, SPECIALTY_TYPE_AFFINITY["OTHER"])
    affinity_score = affinity_map.get(event_type, 0.05)
    score += affinity_score
    if affinity_score >= 0.20:
        specialty_labels = {
            "INFO": "IT students", "BUSINESS": "Business students",
            "ART": "Art students", "ENGINEERING": "Engineering students"
        }
        reasons.append(f"Popular with {specialty_labels.get(specialty, 'your specialty')}")

    # ── FEATURE 4: Club Affinity (weight: 0.10) ──────────────────────────
    # Notebook: teacher_id affiliation → familiar instructor bonus
    # Adapted: user's club membership → club event affinity
    if event.clubId and event.clubId in (user.registeredClubIds or []):
        score += 0.12
        reasons.append("From your club")

    # ── FEATURE 5: Popularity / Fill Rate (weight: 0.15) ─────────────────
    # Notebook: n_sessions >= 10 threshold for statistical significance
    # Adapted: fill rate as popularity signal
    fill_score = compute_fill_rate_score(event.currentParticipants, event.maxParticipants)
    score += fill_score
    if fill_score >= 0.15:
        spots_left = event.maxParticipants - event.currentParticipants
        if spots_left <= 10:
            reasons.append(f"Only {spots_left} spots left!")
        else:
            reasons.append("High demand event")

    # ── FEATURE 6: Status Score ───────────────────────────────────────────
    status_upper = (event.status or "").upper()
    if status_upper in ["PLANNED", "ACTIVE", "ONGOING", "SCHEDULED"]:
        score += 0.08
    elif status_upper == "IN_PROGRESS":
        score += 0.04

    # ── FEATURE 7: Cost Score ─────────────────────────────────────────────
    # Notebook: recommendation_used binary feature
    # Adapted: free events = accessible, especially for low-engagement users
    cost = event.estimatedCost or 0.0
    if cost == 0.0:
        score += 0.05
        if engagement_level == "Low":
            score += 0.03
            reasons.append("Free event — perfect to get started!")
    elif cost <= 10.0:
        score += 0.03

    # ── ENGAGEMENT MULTIPLIER ──────────────────────────────────────────────
    # Notebook key finding: High engagement → multiplicative effect on effectiveness
    # engagement_level was deterministic for target in synthetic data
    multiplier = ENGAGEMENT_MULTIPLIERS.get(engagement_level, 1.0)

    # Contextual multiplier boost (from notebook's scenario comparison)
    if engagement_level == "High" and event_type in ["Competition", "Conference"]:
        multiplier *= 1.10
        if "competition" not in " ".join(reasons).lower():
            reasons.append("Ideal for active members")
    elif engagement_level == "Low" and event_type in ["Workshop", "Seminar"]:
        multiplier *= 1.08
        if not any("beginner" in r.lower() or "started" in r.lower() for r in reasons):
            reasons.append("Great first event!")

    score *= multiplier

    # Normalize to [0, 1]
    final_score = min(1.0, max(0.0, score))

    # Build final reason string (top 2 reasons)
    if not reasons:
        reasons = [f"Recommended {event_type} for you"]
    reason_text = " • ".join(reasons[:2])

    return final_score, reason_text


def get_badge(score: float) -> tuple:
    """Assign a badge and tag based on score threshold."""
    for threshold, (badge_label, badge_class) in sorted(BADGE_THRESHOLDS.items(), reverse=True):
        if score >= threshold:
            return badge_label, badge_class
    return "📅 Suggested", "suggested"


def get_engagement_tag(event_type: str, engagement_level: str, score: float) -> str:
    """Generate a contextual engagement tag."""
    if engagement_level == "High":
        if event_type in ["Competition", "Conference"]:
            return "For Active Members"
        return "Top Rated for You"
    elif engagement_level == "Low":
        if event_type in ["Workshop", "Seminar"]:
            return "Perfect for Beginners"
        return "Discover Something New"
    else:
        if score >= 0.75:
            return "Highly Recommended"
        return "You Might Like This"


# ============================================================
# API ENDPOINTS
# ============================================================

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Event Recommendation Endpoint

    Algorithm adapted from:
      - Notebook Objective 3: Système de Recommandation
      - Feature importance from Random Forest (Phase 3)
      - Engagement level classification from Phase 2
      - Content-type effectiveness analysis from Objective 3 Step 2
      - Combination analysis from Objective 3 Step 3

    Returns top-N recommended events with scores, reasons, and badges.
    """
    user = request.user
    events = request.events
    top_n = request.topN or 5

    # Step 1: Determine engagement level
    # (Notebook Phase 2 classification: Low/Medium/High)
    engagement_level = user.engagementLevel
    if not engagement_level or engagement_level not in ["High", "Medium", "Low"]:
        engagement_level = classify_engagement_level(user.totalRegistrations or 0)

    # Step 2: Filter relevant events (exclude completed)
    candidate_events = [
        e for e in events
        if (e.status or "").upper() not in ["COMPLETED", "CANCELLED", "FINISHED"]
    ]
    if not candidate_events:
        candidate_events = events

    # Step 3: Score all candidate events
    # (Notebook Objective 3 Step 3: combination scoring)
    scored = []
    for event in candidate_events:
        score, reason = score_event_for_user(event, user, engagement_level)
        badge_label, badge_class = get_badge(score)
        event_type = event.type.capitalize() if event.type else "Other"
        engagement_tag = get_engagement_tag(event_type, engagement_level, score)
        percentage = int(round(score * 100))

        scored.append(RecommendedEvent(
            eventId=event.id,
            title=event.title,
            score=round(score, 3),
            percentage=percentage,
            reason=reason,
            badge=badge_label,
            engagementTag=engagement_tag,
        ))

    # Step 4: Sort by score descending
    # (Notebook: TOP configurations ranking like combo_df.sort_values)
    scored.sort(key=lambda x: x.score, reverse=True)

    return RecommendationResponse(
        recommendations=scored[:top_n],
        userEngagementLevel=engagement_level,
        algorithm="Content-Based Filtering — Adapted from Random Forest Recommendation Engine (Notebook Objective 3)",
        totalAnalyzed=len(candidate_events),
    )


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Event & Club Recommendation API",
        "version": "1.0.0",
        "algorithm": "Content-Based Filtering (adapted from ML notebook)"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050, reload=True)
