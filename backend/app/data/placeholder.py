"""PLACEHOLDER constants so the app runs end to end.

Every number here is approximate and NOT sourced from a vetted dataset. Replace
with real data (life tables, hazard ratios from meta-analyses) before showing
any estimate as fact. Ethnicity hazard ratios are deliberately 1.0 until real
data is chosen.
"""

# (id, label)
SEXES = [("female", "Female"), ("male", "Male")]

ETHNICITIES = [
    ("asian", "Asian"),
    ("black", "Black"),
    ("hispanic", "Hispanic / Latino"),
    ("white", "White"),
    ("other", "Other / mixed"),
]
ETHNICITY_HR = {eid: 1.0 for eid, _ in ETHNICITIES}

# id -> (label, {sex: life expectancy at birth})
LOCATIONS = {
    "US": ("United States", {"female": 79.3, "male": 73.5}),
    "GB": ("United Kingdom", {"female": 82.9, "male": 79.0}),
    "DE": ("Germany", {"female": 83.2, "male": 78.2}),
    "JP": ("Japan", {"female": 87.6, "male": 81.5}),
    "CN": ("China", {"female": 80.5, "male": 75.0}),
    "IN": ("India", {"female": 70.2, "male": 67.3}),
    "BR": ("Brazil", {"female": 77.3, "male": 70.4}),
    "NG": ("Nigeria", {"female": 54.9, "male": 52.2}),
}

# factor id -> (label, default option id, [(option id, label, mortality hazard ratio)])
FACTORS = {
    "smoking": (
        "Smoking",
        "never",
        [("never", "Never", 1.0), ("former", "Former", 1.3), ("current", "Current", 2.0)],
    ),
    "alcohol": (
        "Alcohol",
        "moderate",
        [("none", "None", 1.0), ("moderate", "Moderate", 1.0), ("heavy", "Heavy", 1.5)],
    ),
    "exercise": (
        "Exercise",
        "light",
        [("sedentary", "Sedentary", 1.35), ("light", "Light", 1.0), ("active", "Active", 0.75)],
    ),
    "diet": (
        "Diet",
        "average",
        [("poor", "Poor", 1.2), ("average", "Average", 1.0), ("good", "Good", 0.85)],
    ),
    "bmi": (
        "Body weight",
        "normal",
        [
            ("under", "Under", 1.3),
            ("normal", "Normal", 1.0),
            ("over", "Over", 1.1),
            ("obese", "Obese", 1.4),
        ],
    ),
    "sleep": (
        "Sleep",
        "7-8",
        [("short", "<6 h", 1.15), ("7-8", "7-8 h", 1.0), ("long", ">9 h", 1.15)],
    ),
}
