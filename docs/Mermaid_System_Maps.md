# Mermaid System Maps: Visual Architecture

**Source:** Holistic_Redesign_V2.md
**Date:** 2025-10-06

---

## 1. UNIFIED INFORMATION ARCHITECTURE

```mermaid
graph TD
    Landing[/ Landing Page<br/>Choose your path] --> QuickEst[Tier 1: Quick Estimator<br/>30 seconds]
    Landing --> FullPlan[Tier 2: Project Builder<br/>10 minutes]
    Landing --> Admin[Admin Dashboard]

    QuickEst --> EstResult[Estimate Results<br/>180 MD, 6 months]
    EstResult --> Bridge{Build Full Plan?}
    Bridge -->|Yes| Capture
    Bridge -->|No| Export1[Download PDF]

    FullPlan --> Capture[Capture Mode<br/>Extract from RFP]
    Capture --> Decide[Decide Mode<br/>5 decisions]
    Decide --> Plan[Plan Mode<br/>Timeline + Resources + RICEFW]
    Plan --> Present[Present Mode<br/>Client slides]
    Present --> Export2[Export PDF/PPTX]

    Export2 --> Loop{Edit more?}
    Loop -->|Yes| Plan
    Loop -->|No| Done[Done]

    style QuickEst fill:#dbeafe
    style Capture fill:#f3e8ff
    style Decide fill:#f3e8ff
    style Plan fill:#dcfce7
    style Present fill:#f3f4f6
    style Bridge fill:#fef3c7
```

---

## 2. UNIFIED STATE MODEL

```mermaid
classDiagram
    class UnifiedProject {
        +string id
        +string name
        +source: estimator|rfp|manual
        +Date createdAt
        +Date updatedAt
        +estimate?: EstimateData
        +presales: PresalesData
        +timeline: TimelineData
        +presentation: PresentationData
        +currentMode: Mode
        +currentTier: 1|2|3
    }

    class EstimateData {
        +number totalMD
        +number bce
        +Multipliers multipliers
        +number fw
        +number confidence
        +EstimatorInputs inputs
    }

    class PresalesData {
        +Chip[] chips
        +Decisions decisions
        +Completeness completeness
    }

    class TimelineData {
        +Phase[] phases
        +string[] selectedPackages
        +RicefwItem[] ricefwItems
        +Record manualOverrides
    }

    class PresentationData {
        +Slide[] slides
        +string templateId
        +string? clientLogo
        +Date? exportedAt
    }

    UnifiedProject *-- EstimateData
    UnifiedProject *-- PresalesData
    UnifiedProject *-- TimelineData
    UnifiedProject *-- PresentationData
```

---

## 3. ESTIMATOR → PROJECT HANDOFF FLOW

```mermaid
sequenceDiagram
    participant User
    participant Estimator
    participant Converter
    participant UnifiedStore
    participant Project

    User->>Estimator: Fill inputs & see estimate
    User->>Estimator: Click "Build Full Plan"
    Estimator->>Converter: convertEstimateToChips(inputs)
    Converter-->>Estimator: chips[]

    Estimator->>UnifiedStore: createProject('estimator')
    UnifiedStore-->>Estimator: projectId

    Estimator->>UnifiedStore: updateProject(id, {estimate, presales})
    UnifiedStore->>UnifiedStore: Calculate completeness
    UnifiedStore->>UnifiedStore: Auto-generate timeline

    Estimator->>Project: Navigate to /project?projectId=X&mode=plan
    Project->>UnifiedStore: loadProject(projectId)
    UnifiedStore-->>Project: UnifiedProject data

    Project->>User: Show timeline with banner<br/>"From Quick Estimate"
```

---

## 4. DATA FLOW: CHIPS → TIMELINE → SLIDES

```mermaid
flowchart LR
    RFP[RFP Text] --> Parser[Chip Parser]
    Parser --> Chips[Chips<br/>modules, scope,<br/>geo, etc]

    Estimator[Estimator Inputs] --> Converter[Chip Converter]
    Converter --> Chips

    Chips --> Bridge[presales-to-timeline-bridge]
    Bridge --> ClientProfile[Client Profile]
    Bridge --> Packages[SAP Packages]

    ClientProfile --> ScenarioGen[Scenario Generator]
    Packages --> ScenarioGen
    ScenarioGen --> BasePhases[Base Phases]

    BasePhases --> PhaseGen[Phase Generator]
    PhaseGen --> Timeline[Timeline<br/>phases, dates,<br/>resources]

    Timeline --> SlideGen[Slide Generator]
    SlideGen --> Slides[Presentation Slides]

    Slides --> Export[PDF/PPTX Export]

    style Chips fill:#dbeafe
    style Timeline fill:#dcfce7
    style Slides fill:#fef3c7
```

---

## 5. OPTIMIZE MODE MERGE (BEFORE → AFTER)

**BEFORE (5 Modes):**
```mermaid
graph LR
    A[Capture] --> B[Decide]
    B --> C[Plan]
    C --> D[Optimize]
    D --> E[Present]

    style D fill:#fee2e2
```

**AFTER (4 Modes, Optimize merged into Plan):**
```mermaid
graph LR
    A[Capture] --> B[Decide]
    B --> C[Plan<br/><small>Tabs: Timeline | Resources | RICEFW</small>]
    C --> D[Present]

    style C fill:#dcfce7
```

---

## 6. ADMIN WORKFLOW: USER APPROVAL

```mermaid
stateDiagram-v2
    [*] --> UserRequest: User signs up
    UserRequest --> RiskAssessment: Auto-check

    RiskAssessment --> LowRisk: Domain whitelisted<br/>+ known location
    RiskAssessment --> MediumRisk: Unknown domain<br/>OR first user
    RiskAssessment --> HighRisk: Suspicious patterns<br/>OR blocklist

    LowRisk --> AutoApproved: Auto-approve
    AutoApproved --> [*]

    MediumRisk --> PendingQueue: Flag for review
    HighRisk --> PendingQueue: Flag + alert admin

    PendingQueue --> AdminReview: Admin checks
    AdminReview --> Approved: Manual approve
    AdminReview --> Rejected: Manual reject

    Approved --> [*]
    Rejected --> [*]
```

---

## 7. A/B TEST FRAMEWORK

```mermaid
flowchart TD
    User[User visits] --> Assignment{Assign variant}
    Assignment -->|50%| ControlVariant[Control: A]
    Assignment -->|50%| TreatmentVariant[Treatment: B]

    ControlVariant --> Interact1[User interacts]
    TreatmentVariant --> Interact2[User interacts]

    Interact1 --> Track1[Track events:<br/>clicks, conversions]
    Interact2 --> Track2[Track events:<br/>clicks, conversions]

    Track1 --> Analytics[Analytics DB]
    Track2 --> Analytics

    Analytics --> Calculate[Calculate significance]
    Calculate --> Decision{p < 0.05?}

    Decision -->|Yes| Winner[Declare winner<br/>Roll out to 100%]
    Decision -->|No| Continue[Continue test<br/>Need more data]

    Winner --> Done[Done]
    Continue --> Assignment
```

---

## 8. ERROR HANDLING & RECOVERY

```mermaid
flowchart TD
    Action[User action] --> Try{Try operation}
    Try -->|Success| Success[Show result]
    Try -->|Error| Classify{Error type}

    Classify -->|Network| Retry[Show retry option<br/>+ offline mode]
    Classify -->|Validation| Fix[Show inline fix<br/>Helpful message]
    Classify -->|Server 500| Report[Log + alert eng<br/>Show fallback]

    Retry --> Save[Auto-save state]
    Fix --> Correct[User corrects]
    Report --> Fallback[Graceful degradation]

    Save --> Success
    Correct --> Try
    Fallback --> Success

    style Success fill:#dcfce7
    style Retry fill:#fef3c7
    style Report fill:#fee2e2
```

---

**End of Mermaid System Maps**
