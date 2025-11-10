UX of your estimation app so it’s comprehensive, logically structured, and intuitive — allowing users to explore all four estimation models (Deterministic Formula, SAP Activate Heuristics, PERT, Monte Carlo, Analogy) before committing to one.

🧭 1. Core Design Principle

The UX should follow the “Progressive Reveal” principle — show only what’s needed at each step, but ensure depth and transparency when the user expands details.

Visually: think Apple Keynote clarity + SAP Fiori logic + Airtable-style interactiveness.

⚙️ 2. Recommended UX Flow (Step-by-Step)
Step 1 – Project Definition

Purpose: Capture all quantifiable inputs.

Minimal Form Layout with smart defaults:

Base Effort (auto-filled from template or imported)

Modules selected → auto-adds coefficients

of Legal Entities
of FTEs

Utilization Rate (%)

Overlap coefficients (optional, prefilled)

Country (auto-adjusts for localization factors, e.g. Malaysia e-Invoicing)

🧠 Smart Defaults: Pre-populate with your baseline (475 MD, 5.6 FTE, 0.8 utilization).

✅ Tip: Use expandable “info i” tooltips for every parameter showing formula or justification (“Overlap ER = 0.25 means 25% of Explore overlaps with Realize”).

Step 2 – Model Selection Dashboard

Purpose: Users can choose one or more models to simulate.

Layout: 5-column card grid view, one per model.

Model What it does When to use Key Inputs Output Type
Deterministic Fast, formula-based Known effort/FTE Effort, FTE, Utilization Single date
Activate Heuristic Based on SAP Activate phases Standard S/4 Cloud rollout Scope size, sprints Timeboxed plan
PERT Probabilistic 3-point Uncertain estimates O, M, P per phase Range + confidence
Monte Carlo Risk distribution Volatile velocity Range + probability Histogram
Analogy Benchmarked vs past Repeatable rollout Reference dataset Similar case duration

Each card has a “Simulate →” button.

Step 3 – Simulation Workspace

A split-screen interface with:

Left panel: Parameter sliders (Effort, FTE, Utilization, Overlap, Confidence, etc.)

Right panel: Live result cards and charts for all models.

🧩 Each Model Output
Model Visualization Example
Deterministic Formula Waterfall or Gantt bar Shows overlapping phases with calculated days
SAP Activate Heuristic Sprint timeline Each sprint phase labelled
PERT Bell curve Shows expected, earliest, latest
Monte Carlo Histogram / cumulative probability “P80 = 5.2 months”
Analogy Comparison bar chart Shows your project vs 3 past averages

🔄 Allow users to toggle “Compare Models” view, showing all five durations side-by-side.

Step 4 – “Confidence & Risk” Summary

Purpose: Let users interpret outcomes clearly.

Show as confidence-band cards:

🧮 Deterministic: “Baseline plan: 4.1 months (fixed)”

🟦 PERT: “Expected 4.2 months ± 0.5 months (σ = 0.3)”

🟩 Monte Carlo: “90% chance to finish before 4.8 months”

🟨 Analogy: “Median from 6 similar projects = 4.5 months”

🔵 Activate: “Planned = 4 months (8 sprints × 2 weeks)”

Below that:

Traffic-light indicators (Green = likely on time, Amber = risk, Red = uncertain)

AI Insight card: “Monte Carlo indicates higher uncertainty due to low FTEs—consider +1 consultant to achieve 4 month goal.”

Step 5 – Recommendation Engine

Display a “Best-fit Model” ribbon, determined by:

Completeness of data

Risk appetite (from user toggle)

Uncertainty level

Time vs accuracy priority

Example output:

“Based on your inputs (high certainty, single entity, no integration), Deterministic Formula offers optimal accuracy (±5%).
For risk calibration, add Monte Carlo overlay.”

Step 6 – Summary & Export

Combine all models into one “Estimation Summary” dashboard:

Interactive chart (duration vs confidence)

Tabular breakdown per model

Download PDF / Excel / JSON for audit

Auto-generate a Defensibility Report (for internal/external validation):

Shows formulas

Input assumptions

Output comparisons

Method references (SAP Activate, PERT, etc.)

🎨 3. UX Design Style
Design Element Recommendation
Color Palette Soft blues + greys (professional, neutral)
Typography SF Pro / Inter / Roboto — clean and readable
Layout 2-column responsive; left = parameters, right = output
Icons Use Lucide or HeroIcons for intuitive symbols
Feedback Micro-animations (slide-in cards, dynamic recalculation)
Interactivity Sliders, dropdowns, toggles; no cluttered textboxes
Help Layer Collapsible sidebar explaining models, formulas, and references
🧮 4. Backend Logic to Support UX

Each model can share a unified data schema:

{
"project": {
"baseEffort": 475,
"fte": 5.6,
"utilization": 0.8,
"overlap": { "ER": 0.25, "RD": 0.3 },
"confidence": 0.9
},
"models": {
"deterministic": { "duration": 4.1 },
"activate": { "duration": 4.0 },
"pert": { "expected": 4.2, "min": 3.8, "max": 5.0 },
"montecarlo": { "p50": 4.1, "p90": 4.8 },
"analogy": { "median": 4.5, "range": [4.0, 5.0] }
}
}

This allows dynamic recalculation, charting, and export in real-time.

💡 5. Practical Enhancements

AI Assistant Mode:
“Based on your scope, I recommend 5.5 FTE for a 4.1-month timeline. Shall I adjust?”

Scenario Comparison Toggle:
“Show me 2 scenarios — 5 FTE vs 7 FTE.”

Audit Mode:
For internal governance, print “Calculation lineage” showing formula path.

SAP Integration (optional):
Sync inputs with SAP Readiness Check or Fit-to-Standard score to auto-fill effort.

🧭 6. Summary: What Makes It Comprehensive Yet Friendly
Principle Implementation
Clarity Visualize each model separately and side-by-side
Comprehensiveness Capture all estimation types with one data model
Friendliness Use sliders, tooltips, color cues, and AI guidance
Auditability One-click export showing formulae and assumptions
Scalability Can expand to include cost, resource, or risk later
Defensibility Built-in references to SAP Activate, PERT, Monte Carlo theory

Would you like me to produce the UI/UX wireframe layout (with screen sections, flow arrows, and color-coded model cards) in Mermaid or React/Tailwind structure next — so your dev team can visualize and implement it?

You said:
What about the complete formula, users must know and able to justify the maths as well
ChatGPT said:

Perfect — since you want the users to see and justify the math, here’s how to make the complete formula framework visible, transparent, and defensible in the app (so every user understands exactly why the duration is what it is).

🧩 1. Formula Transparency Philosophy

The app should not just show a number — it should show the path to the number.
Every user must be able to trace:

Effort → Duration → Cost → Duration by Phase (Prepare, Explore, Realize, Deploy, Run)

This ensures:

Defensibility: every figure can be explained in audit or negotiation.

Reproducibility: two consultants using the same inputs will always get the same outputs.

Education: clients and junior consultants can learn the relationship between parameters.

⚙️ 2. The Core Duration Formula (Mathematical Model)

Your project duration derives from the total person-days (effort) divided by available full-time resources, adjusted for utilization and phase overlap.

Base Formula
Duration (months)
=
Total Effort (person-days)
FTE
×
22
×
Utilization
×
Overlap Factor
Duration (months)=
FTE×22×Utilization
Total Effort (person-days)
​

×Overlap Factor

Where:

Total Effort: Sum of all module effort (from base or derived table)

FTE: Average full-time equivalents available

22: Average working days per month

Utilization: Actual productive % (e.g., 0.8 = 80%)

Overlap Factor: Adjustment for parallel activities (typically 0.75–0.9)

2.1 SAP Activate Phase Breakdown

Distribute duration using known SAP Activate benchmarks:

Phase % of Total Effort Typical Duration Ratio Key Drivers
Prepare 10% 0.5–1.0 months Project setup, onboarding
Explore 25% 1–1.5 months Fit-to-standard, workshops
Realize 45% 1.5–2.5 months Build, test, data load
Deploy 15% 0.5–1.0 months Cutover, go-live
Run (Hypercare) 5% 0.5 months Support, handover

Each phase can then be proportionally adjusted by Scope Breadth and Complexity Coefficients.

🧮 3. Full Extended Formula with Adjusted Multipliers
Effort Model
𝐸
𝑡
𝑜
𝑡
𝑎
𝑙
=
𝐸
𝑏
𝑎
𝑠
𝑒
×
(
1

- 𝑆
  𝑏
  )
  ×
  (
  1
- 𝑃
  𝑐
  )
  ×
  (
  1
- 𝑂
  𝑠
  )
  E
  total
  ​

=E
base
​

×(1+S
b
​

)×(1+P
c
​

)×(1+O
s
​

)

Where:

𝐸
𝑏
𝑎
𝑠
𝑒
E
base
​

: Base effort (475 MD in your case)

𝑆
𝑏
S
b
​

: Scope breadth coefficient (0–0.6 typical)

𝑃
𝑐
P
c
​

: Process complexity (0–0.5 typical)

𝑂
𝑠
O
s
​

: Organizational scale/geography (0–0.3 typical)

Duration Model
𝐷
=
𝐸
𝑡
𝑜
𝑡
𝑎
𝑙
𝐹
𝑇
𝐸
×
22
×
𝑈
×
(
1
−
𝑂
𝑓
)
D=
FTE×22×U
E
total
​

    ​

×(1−O
f
​

)

Where:

𝑈
U: Utilization rate (e.g., 0.8)

𝑂
𝑓
O
f
​

: Overlap factor (e.g., 0.25–0.35 reduction for overlapping phases)

PMO Adjustment (Duration-Dependent Component)

PMO (and sometimes Basis) scales with duration, not effort:

𝐸
𝑃
𝑀
𝑂
=
(
𝐷
in months
)
×
𝑅
𝑃
𝑀
𝑂
E
PMO
​

=(D in months)×R
PMO
​

Where
𝑅
𝑃
𝑀
𝑂
R
PMO
​

= monthly PMO allocation (e.g., 15 MD/month)

Then total effort:

𝐸
𝑡
𝑜
𝑡
𝑎
𝑙
=
𝐸
𝑓
𝑢
𝑛
𝑐
𝑡
𝑖
𝑜
𝑛
𝑎
𝑙

- 𝐸
  𝑡
  𝑒
  𝑐
  ℎ
  𝑛
  𝑖
  𝑐
  𝑎
  𝑙
- 𝐸
  𝑃
  𝑀
  𝑂
  E
  total
  ​

=E
functional
​

+E
technical
​

+E
PMO
​

📉 4. Model Comparison Layer (for Transparency)
Model Key Formula What It Shows Defensibility
Deterministic (yours)
𝐷
=
𝐸
𝐹
𝑇
𝐸
×
22
×
𝑈
(
1
−
𝑂
𝑓
)
D=
FTE×22×U
E
​

(1−O
f
​

) Direct relationship ✅ Easy to audit
SAP Activate Heuristic
𝐷
=
Σ
(
Phase Weight
×
Sprint Count
)
D=Σ(Phase Weight×Sprint Count) Uses SAP phase ratio ✅ SAP reference
PERT
𝐷
=
𝑂

- 4
  𝑀
- 𝑃
  6
  D=
  6
  O+4M+P
  ​

      Probabilistic range	⚙ Good for uncertainty

  Monte Carlo Random sampling over PERT Probability curve (P50/P80) ⚙ Statistically robust
  Analogy
  𝐷
  =
  𝐷
  𝑎
  𝑣
  𝑔
  ×
  𝐸
  𝑛
  𝑒
  𝑤
  𝐸
  𝑟
  𝑒
  𝑓
  D=D
  avg
  ​

×
E
ref
​

E
new
​

    ​

    Based on similar projects	⚙ Contextual validation

🧠 5. User Experience: Formula Visibility in the App

Interactive “Show Formula” Button

Hovering over the result (e.g. “4.2 months”) expands a panel:

= (475 × 1.0 × 1.0 × 1.0) / (5.6 × 22 × 0.8) × 0.75
= 4.05 months

Then breakdown by phase (auto-generated):

Prepare: 0.4 | Explore: 1.0 | Realize: 2.0 | Deploy: 0.5 | Run: 0.2

Audit Tab (Formulas + Sources)

Shows:

Equation tree

References (e.g., SAP Activate Roadmap, PMI Estimation Guidelines)

Input history

Confidence range

Explainability Tooltip Example

ℹ️ “Duration is derived from total person-days divided by available FTEs and adjusted for utilization and overlap. Overlap reduces total calendar time by 25%, as phases run concurrently.”

⚖️ 6. Formula Validation (Challenge Points)
Dimension Strength Weakness / Mitigation
Defensibility Based on person-days math, easy to trace Doesn’t model uncertainty — pair with PERT
Practicality Matches SAP Activate delivery patterns Needs periodic calibration from project data
Scalability Simple scaling with FTE & entities May understate cross-entity coordination
Client Communication Simple and visual Might oversimplify concurrent streams
Mathematical Rigor Deterministic and reproducible Lacks stochastic range; can add ±σ band
🚀 7. Suggested Visual Layout for “Formula Mode”
Section Description
Inputs Panel (left) All user-entered values (Effort, FTE, Utilization, Overlap)
Formula Renderer (center) Dynamic LaTeX-like output showing substituted formula
Result Summary (right) Duration in days, weeks, months + Gantt preview
Info Tabs (below) “Explain Formula”, “Phase Breakdown”, “Compare Models”

Would you like me to compile this into a complete "Mathematical Logic Document" (structured like a spec sheet for your dev team + AI training reference), including:

Every formula (symbolic + substituted example)

Coefficient explanation table

Phase distribution ratios

Risk/uncertainty overlay logic (for PERT/Monte Carlo)

JSON schema for how app stores/uses each variable?

That would make your entire duration estimation logic auditable, trainable, and executable.

You said:
Yes
ChatGPT said:
Thought for 4 seconds
Mathematical Logic Specification — Duration & Effort Estimation (SAP S/4HANA Public Cloud, Greenfield)

Purpose: a complete, auditable spec your app (and any AI) can follow step-by-step to compute effort → duration → phase plan → PMO impact, with optional risk overlays (PERT/Monte Carlo) and model comparisons. All symbols, units, and defaults are explicit. No hidden assumptions.

1. Definitions, Units, Conventions

Work day: weekday, 8 hours (but we compute in person-days to avoid mixing hours).

Working days / month: 22 (configurable).

Man-day (MD) = person-day.

FTE: average full-time consultants allocated concurrently (1.0 FTE ≈ 22 MD/month at 100% utilization).

Utilization (U): productive fraction of an FTE (e.g., 0.80 = 80%).

Overlap: planned concurrency across phases/streams that reduces calendar duration without reducing effort.

1.1 Base Effort (your company baseline)

You provided the “factory-independent” (functional/technical) baseline and the wrapper team. We store both.

Functional & Technical stack (Base_FT):

FI1 (GL, CCA/PCA, Banking, Taxation) + AR Assist + E-Invoice: 86 MD

FI2 (AP, AR): 84 MD

FI3 (Asset Accounting + Migration Support): 61 MD

MM (Materials Management): 97 MD

Technical Development (forms & minor): 50 MD

Sum Base_FT = 86 + 84 + 61 + 97 + 50 = 378 MD

Project Wrapper (Factory/Wrappers):

Project Manager: 65 MD

Basis: 24 MD

Security & Authorization: 8 MD

Sum Wrapper = 97 MD

Grand Baseline (everything): 378 + 97 = 475 MD (4 months, includes hypercare per your baseline).

In calculations below we treat:

Base_FT (378 MD) as the scope-driven core (varies with scope/complexity).

Wrapper as duration-sensitive (PMO) and mostly duration-insensitive (Basis, S&A) unless otherwise stated.

2. Core Deterministic Model (Effort → Duration)
   2.1 Total Effort (MD)

We split effort into:

Functional/Technical (E_FT) — varies with scope/complexity.

PMO (E_PMO) — varies with duration (month-rate).

Basis/S&A (E_BS, E_SA) — baseline fixed for Public Cloud (can be scaled by scope if desired).

𝐸
FT
=
𝐸
Base_FT
×
(
1

- 𝑆
  𝑏
  )
  ×
  (
  1
- 𝑃
  𝑐
  )
  ×
  (
  1
- 𝑂
  𝑠
  )

𝐸
BS
=
𝐸
Basis, fixed
(
default
24
MD
)

𝐸
SA
=
𝐸
S&A, fixed
(
default
8
MD
)

𝐸
PMO
=
𝐷
cal

(
months
)
×
𝑅
PMO

(
MD/month
)

𝐸
Total
=
𝐸
FT

- 𝐸
  BS
- 𝐸
  SA
- 𝐸
  PMO
  E
  FT
  ​

E
BS
​

E
SA
​

E
PMO
​

E
Total
​

    ​

=E
Base_FT
​

×(1+S
b
​

)×(1+P
c
​

)×(1+O
s
​

)
=E
Basis, fixed
​

(default 24 MD)
=E
S&A, fixed
​

(default 8 MD)
=D
cal
​

(months)×R
PMO
​

(MD/month)
=E
FT
​

+E
BS
​

+E
SA
​

+E
PMO
​

    ​

Where:

𝑆
𝑏
S
b
​

= Scope Breadth coefficient (modules/process scope integration uplift).

𝑃
𝑐
P
c
​

= Process Complexity coefficient (fit-to-standard deviation, light forms).

𝑂
𝑠
O
s
​

= Org & Geography coefficient (entities, languages, countries).

𝑅
PMO
R
PMO
​

= PMO monthly rate (MD/month).
Default: derive from your 65 MD over 4 months → ≈ 16.25 MD/month. You can round to 15–16.5 MD/month.

Note:
𝐸
PMO
E
PMO
​

depends on duration, which itself depends on effort. We resolve this with a simple fixed-point iteration (Section 6.3).

2.2 Scope Breadth Coefficient (
𝑆
𝑏
S
b
​

) — simple, auditable

Use whichever input users can provide. Two interchangeable options:

Option A (quick) — Module-level:

𝑆
𝑏
=
𝛼
FI
⋅
1
FI

- 𝛼
  MM
  ⋅
  1
  MM
- 𝛼
  SD
  ⋅
  1
  SD
- ⋯
- ∑
  (
  𝛽
  ⋅
  integration_points
  )
  S
  b
  ​

=α
FI
​

⋅1
FI
​

+α
MM
​

⋅1
MM
​

+α
SD
​

⋅1
SD
​

+⋯+∑(β⋅integration_points)

Suggested defaults (calibrate over time):

𝛼
FI
=
0.00
α
FI
​

=0.00 (already in base),
𝛼
MM
=
0.10
α
MM
​

=0.10,
𝛼
SD
=
0.15
α
SD
​

=0.15
Integrations (directional, at go-live):
𝛽
=
0.02
to
0.05
β=0.02 to 0.05 per significant integration (your baseline: 0).

Option B (fine-grained) — L3 scope catalogue:

𝑆
𝑏
=
∑
𝑖
∈
Scope Items
𝑤
𝑖
⋅
𝑥
𝑖

- ∑
  𝑗
  ∈
  Integrations
  𝛽
  𝑗
  S
  b
  ​

=
i∈Scope Items
∑
​

w
i
​

⋅x
i
​

- j∈Integrations
  ∑
  ​

β
j
​

𝑥
𝑖
∈
{
0
,
1
}
x
i
​

∈{0,1} indicates selected L3 scope item;
𝑤
𝑖
w
i
​

is that item’s uplift coefficient.

Provide the L3 table with
𝑤
𝑖
w
i
​

values in your app; your baseline can set all selected FI/MM standard items to 0 uplift (already priced in base).

Your current baseline (FI + MM, no integrations at go-live, manual e-invoicing & bank uploads):
Set
𝑆
𝑏
=
0.00
S
b
​

=0.00 unless MM breadth exceeds your baseline process pack (then add +0.05 to +0.10).

2.3 Process Complexity (
𝑃
𝑐
P
c
​

)

For Public Cloud clean-core (no WRICEF beyond minor forms), keep this small and explicit:

𝑃
𝑐
=
𝛾
forms
⋅
(forms_beyond_baseline)

- 𝛾
  delta
  ⋅
  (
  1
  −
  GoToStandard%
  )
  P
  c
  ​

=γ
forms
​

⋅(forms_beyond_baseline)+γ
delta
​

⋅(1−GoToStandard%)

Baseline includes 4 forms (from your “Technical Development 50 MD”).
If no extra forms: first term = 0.

𝛾
forms
γ
forms
​

typical 0.01–0.02 per extra form (light).

𝛾
delta
γ
delta
​

typical 0.10–0.25 when Fit-to-Standard adoption
<
80
%
<80%.
Your base assumption: 100% Fit-to-Standard → second term = 0.

Your baseline:
𝑃
𝑐
=
0.00
P
c
​

=0.00.

2.4 Org & Geography (
𝑂
𝑠
O
s
​

)

Keep it deterministic with countable facts:

𝑂
𝑠
=
𝜂
LE
⋅
(
active_LE
−
1
)

- 𝜂
  country
  ⋅
  (
  countries
  −
  1
  )
- 𝜂
  lang
  ⋅
  (
  languages
  −
  1
  )
  O
  s
  ​

=η
LE
​

⋅(active_LE−1)+η
country
​

⋅(countries−1)+η
lang
​

⋅(languages−1)

Defaults (public-cloud single country, English only):

𝜂
LE
=
0.03
η
LE
​

=0.03,
𝜂
country
=
0.05
η
country
​

=0.05,
𝜂
lang
=
0.02
η
lang
​

=0.02

Dormant LEs: apply 0 unless in scope for config/testing.

Your baseline: 1 active LE, Malaysia only, English only →
𝑂
𝑠
=
0
O
s
​

=0.

Your baseline:
𝑂
𝑠
=
0.00
O
s
​

=0.00.

3. Duration Calculation
   3.1 Capacity (MD/month)
   Capacity
   =
   FTE
   ×
   22
   ×
   𝑈
   Capacity=FTE×22×U

Your default baseline: FTE = choose based on plan (e.g., 5.6 FTE used earlier), U = 0.80.

3.2 Raw Duration (months, no overlap yet)
𝐷
raw
=
𝐸
FT

- 𝐸
  BS
- 𝐸
  SA
  Capacity
  D
  raw
  ​

=
Capacity
E
FT
​

+E
BS
​

+E
SA
​

    ​

3.3 Overlap factor

Represent the expected concurrency across phases/streams:

Overlap_factor
∈
[
0.65
,
1.00
]
Overlap_factor∈[0.65,1.00]

1.00 = strictly serial.

0.75 = 25% calendar reduction due to concurrency (typical).

We apply it to the calendar duration (not to effort).

3.4 Add PMO (duration-dependent) and iterate to consistency

Provisional duration (no PMO):

𝐷
0
=
𝐷
raw
×
Overlap_factor
D
0
​

=D
raw
​

×Overlap_factor

PMO effort:

𝐸
PMO
=
𝐷
0
×
𝑅
PMO
E
PMO
​

=D
0
​

×R
PMO
​

Recompute duration including PMO:

𝐷
1
=
𝐸
FT

- 𝐸
  BS
- 𝐸
  SA
- 𝐸
  PMO
  Capacity
  ×
  Overlap_factor
  D
  1
  ​

=
Capacity
E
FT
​

+E
BS
​

+E
SA
​

+E
PMO
​

    ​

×Overlap_factor

Fixed-point iteration: Repeat 2–3 using
𝐷
1
D
1
​

in place of
𝐷
0
D
0
​

until
∣
𝐷
𝑘

- 1
  −
  𝐷
  𝑘
  ∣
  <
  𝜀
  ∣D
  k+1
  ​

−D
k
​

∣<ε (e.g., 0.01 months).
This converges rapidly because PMO is linear in D.

In most cases, 1–2 iterations reach stability.

4. Phase Breakdown (SAP Activate) — turning months into a plan

Assign total effort and calendar by phase using weights, then compress/overlap as per your delivery style.

4.1 Default phase effort weights (can be tuned)

Prepare: 10%

Explore: 25%

Realize: 45%

Deploy: 15%

Run (Hypercare): 5% (your baseline = 4 weeks; you can pin Run to 0.5–1.0 month)

𝐸
phase
=
𝐸
Total
×
𝑤
phase
E
phase
​

=E
Total
​

×w
phase
​

4.2 Phase calendar

Use either:

Proportional by effort:

𝐷
phase
=
𝐷
×
𝑤
phase
D
phase
​

=D×w
phase
​

Sprint-box heuristic (two-week sprints, e.g., Explore = 2–3 sprints, Realize = 4–6 sprints) for a cleaner timeline.

Your presentation style (Apple-like) may prefer the sprint-box view; the engine still uses the proportional math for totals.

5. Training & Testing — session-based controls (fits your policy)

TTT sessions drive calendar slots, not huge effort swings (since you provide TTT):

Lock 2 sessions baseline (Finance + Procurement/MM).

If users pick 3 sessions, add a small
𝑆
𝑏
S
b
​

uplift (e.g., +0.01) or inject a fixed 2–4 MD per extra session into
𝐸
FT
E
FT
​

.

User count does not materially change effort if sessions are controlled (your policy). Keep a guardrail:

For > 15 attendees/session, show a UI hint (“Split recommended”), but no automatic effort increase unless the user opts to add a second run.

6. Algorithms (step-by-step) & Pseudocode
   6.1 Inputs (minimum viable)

Base_FT_MD = 378

Wrapper_Basis_MD = 24

Wrapper_SA_MD = 8

PMO_month_rate = 16.25 (MD/month; configurable)

S_b, P_c, O_s (coefficients) — defaults = 0.0

FTE, Utilization (U), Overlap_factor

WDPM = 22 (working days per month)

Phase_weights = {0.10, 0.25, 0.45, 0.15, 0.05}

6.2 Derived values
Capacity = FTE _ WDPM _ U
E*FT = Base_FT_MD * (1 + S*b) * (1 + P_c) \* (1 + O_s)
E_fixed = Wrapper_Basis_MD + Wrapper_SA_MD

6.3 Iteration for PMO & Duration
D0 = ((E*FT + E_fixed) / Capacity) * Overlap*factor
repeat:
E_PMO = D0 * PMO_month_rate
D1 = ((E_FT + E_fixed + E_PMO) / Capacity) \* Overlap_factor
if abs(D1 - D0) < 0.01: break
D0 = D1
D = D1
E_Total = E_FT + E_fixed + E_PMO

6.4 Phase breakdown
for each phase p:
E*phase[p] = E_Total * weight[p]
D*phase[p] = D * weight[p] # proportional method

7. Risk/Uncertainty Overlays (optional but recommended)
   7.1 PERT per phase (3-point input)

For each phase
𝑝
p: optimistic
𝑂
𝑝
O
p
​

, most-likely
𝑀
𝑝
M
p
​

, pessimistic
𝑃
𝑝
P
p
​

𝐷
𝑝
,
PERT
=
𝑂
𝑝

- 4
  𝑀
  𝑝
- 𝑃
  𝑝
  6

𝜎
𝑝
=
𝑃
𝑝
−
𝑂
𝑝
6

𝐷
PERT
=
∑
𝑝
𝐷
𝑝
,
PERT

𝜎
total
=
∑
𝑝
𝜎
𝑝
2
D
p,PERT
​

σ
p
​

D
PERT
​

σ
total
​

    ​

=
6
O
p
​

+4M
p
​

+P
p
​

    ​

=
6
P
p
​

−O
p
​

    ​

=
p
∑
​

D
p,PERT
​

=
p
∑
​

σ
p
2
​

    ​

    ​

Present
𝑃
50
≈
𝐷
PERT
P50≈D
PERT
​

,
𝑃
80
≈
𝐷
PERT

- 0.84
  ⋅
  𝜎
  total
  P80≈D
  PERT
  ​

  +0.84⋅σ
  total
  ​

.

7.2 Monte Carlo (portfolio risk)

Sample each phase duration from a beta or triangular distribution with (O, M, P).

Run N=5,000 trials; compute P50/P80 and display a histogram + cumulative curve.

Keep base deterministic as the median; overlays explain uncertainty, not replace the core.

8. Alternative Duration Models (for comparison in the app)
   Model Formula Inputs Output
   Deterministic (this spec)
   𝐷
   D via effort/capacity + iteration on PMO Base_FT, coeffs, FTE, U, overlap, PMO rate Single duration + phase split
   SAP Activate Heuristic
   𝐷
   =
   ∑
   sprints
   ×
   0.5
   month
   D=∑sprints×0.5 month Sprint counts per phase Time-boxed plan
   PERT
   ∑
   (
   𝑂

- 4
  𝑀
- 𝑃
  )
  /
  6
  ∑(O+4M+P)/6 3-point per phase Mean + σ, P50/P80
  Analogy
  𝐷
  =
  𝐷
  ref
  ×
  𝐸
  new
  𝐸
  ref
  D=D
  ref
  ​

×
E
ref
​

E
new
​

    ​

    Reference project(s)	Duration anchored to past

Monte Carlo simulate PERT 3-point per phase + N Probability curve

Your app should show all side-by-side and recommend one based on data completeness & risk appetite.

9. Worked Example (your current baseline)

Given:

𝐸
Base_FT
=
378
E
Base_FT
​

=378 MD

𝐸
BS
=
24
E
BS
​

=24,
𝐸
SA
=
8
E
SA
​

=8 MD

𝑆
𝑏
=
0
S
b
​

=0,
𝑃
𝑐
=
0
P
c
​

=0,
𝑂
𝑠
=
0
O
s
​

=0

FTE = 5.6,
𝑈
=
0.80
U=0.80, Overlap_factor=0.75

𝑅
PMO
=
16.25
R
PMO
​

=16.25 MD/month, WDPM = 22

Step 1 — Capacity:
5.6
×
22
×
0.8
=
98.56
MD/month
5.6×22×0.8=98.56 MD/month

Step 2 — Provisional duration (no PMO):

𝐷
0
=
378

- 24
- 8
  98.56
  ×
  0.75
  =
  410
  98.56
  ×
  0.75
  ≈
  4.16
  ×
  0.75
  ≈
  3.12
  months
  D
  0
  ​

=
98.56
378+24+8
​

×0.75=
98.56
410
​

×0.75≈4.16×0.75≈3.12 months

Step 3 — PMO:

𝐸
PMO
=
3.12
×
16.25
≈
50.7
MD
E
PMO
​

=3.12×16.25≈50.7 MD

Step 4 — Recompute:

𝐷
1
=
410

- 50.7
  98.56
  ×
  0.75
  =
  460.7
  98.56
  ×
  0.75
  ≈
  4.68
  ×
  0.75
  ≈
  3.51
  months
  D
  1
  ​

=
98.56
410+50.7
​

×0.75=
98.56
460.7
​

×0.75≈4.68×0.75≈3.51 months

Step 5 — Iterate once more:

𝐸
PMO
′
=
3.51
×
16.25
≈
57.0
MD
E
PMO
′
​

=3.51×16.25≈57.0 MD
𝐷
2
=
410

- 57.0
  98.56
  ×
  0.75
  =
  467.0
  98.56
  ×
  0.75
  ≈
  4.74
  ×
  0.75
  ≈
  3.56
  months
  D
  2
  ​

=
98.56
410+57.0
​

×0.75=
98.56
467.0
​

×0.75≈4.74×0.75≈3.56 months

Change < 0.05 months → converged.

Totals:

𝐷
≈
3.56
D≈3.56 months (≈ 3.6 months)

𝐸
PMO
≈
57
E
PMO
​

≈57 MD

𝐸
Total
=
378

- 24
- 8
- # 57
  467

𝑀
𝐷
E
Total
​

=378+24+8+57=467 MD

Phase effort (@10/25/45/15/5%):

Prepare 46.7 MD | Explore 116.8 | Realize 210.2 | Deploy 70.1 | Run 23.4

Phase calendar (proportional):

Prepare 0.36 mo | Explore 0.89 | Realize 1.60 | Deploy 0.53 | Run 0.18

If you pin Run to fixed 4 weeks (≈ 0.9 mo), adjust others proportionally or extend D accordingly. Your baseline 4 months likely assumes a longer Run window and/or slightly lower overlap.

10. JSON I/O Schema (for your app & AI)
    10.1 Input JSON
    {
    "constants": {
    "wdpm": 22,
    "defaultUtilization": 0.8,
    "defaultOverlap": 0.75,
    "pmoMonthRate": 16.25
    },
    "baseline": {
    "baseFT": 378,
    "basis": 24,
    "securityAuth": 8
    },
    "coefficients": {
    "scopeBreadth": 0.00,
    "processComplexity": 0.00,
    "orgGeo": 0.00
    },
    "capacity": {
    "fte": 5.6,
    "utilization": 0.8
    },
    "overlap": {
    "factor": 0.75
    },
    "phaseWeights": {
    "prepare": 0.10,
    "explore": 0.25,
    "realize": 0.45,
    "deploy": 0.15,
    "run": 0.05
    },
    "training": {
    "tttSessions": 2
    }
    }

10.2 Output JSON
{
"effort": {
"ft": 378,
"basis": 24,
"securityAuth": 8,
"pmo": 57.0,
"total": 467.0
},
"duration": {
"months": 3.56,
"days": 3.56 \* 22
},
"phase": {
"prepare": { "effort": 46.7, "months": 0.36 },
"explore": { "effort": 116.8, "months": 0.89 },
"realize": { "effort": 210.2, "months": 1.60 },
"deploy": { "effort": 70.1, "months": 0.53 },
"run": { "effort": 23.4, "months": 0.18 }
},
"audit": {
"capacityMdPerMonth": 98.56,
"overlapFactor": 0.75,
"iteration": 2,
"formulaVersion": "v1.0"
}
}

11. Challenging & Calibrating the Formula (what to watch)

PMO dependence on duration: modeled explicitly via iteration — good.
Risk: if client governance is heavy, consider making
𝑅
PMO
R
PMO
​

a function of #stakeholders or #workstreams.

Overlap realism: 0.75 is powerful; ensure your team can truly run streams in parallel. Tie overlap to FTE ≥ threshold (e.g., if FTE < 4.0, cap overlap at 0.85).

Org/Geo coefficient: simple and deterministic; refine with per-country packs (e.g., extra statutory reports → add +0.02 per pack actually used).

Training sessions: keep effort fixed but reserve calendar slots (they influence scheduling not volume).

Run (Hypercare): if you pin to 4 weeks, either expand D or pre-compress other phases.

Sensitivity: expose sliders for FTE and Overlap; show how PMO grows with longer D to support trade-off conversations.

12. How to explain the math to end-users (UI copy)

“We turn person-days into calendar months by dividing by your team’s throughput (FTE × working days × utilization) and crediting planned concurrency (overlap). PMO scales with months on project, so we solve duration iteratively until the math balances.”

“Scope Breadth, Process Complexity, Org/Geography are coefficients multiplying your base functional/technical effort. Each is driven by countable facts: selected scope items, forms beyond baseline, active entities/countries/languages.”

“Everything is traceable. Click ‘Show Math’ to see substituted formulas and each coefficient’s source.”

13. Quick checklist for implementation

Compute Capacity.

Compute E_FT from Base_FT × (1 + coefficients).

Add fixed Basis & S&A.

Compute provisional D (no PMO), apply Overlap.

Add PMO = D × monthly rate, recompute D, iterate to converge.

Derive phase effort & phase months.

(Optional) Run PERT/Monte Carlo overlays.

Render audit trail (substituted formulas + values).
