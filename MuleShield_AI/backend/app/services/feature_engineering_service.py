import pandas as pd


def generate_features(df):

    if (
        "total_credit_amount" in df.columns
        and
        "total_debit_amount" in df.columns
    ):

        df["credit_debit_ratio"] = (
            df["total_credit_amount"]
            /
            (
                df["total_debit_amount"]
                + 1
            )
        )

    if (
        "transaction_count" in df.columns
        and
        "account_age_days" in df.columns
    ):

        df["txn_velocity"] = (
            df["transaction_count"]
            /
            (
                df["account_age_days"]
                + 1
            )
        )

    return df

import numpy as np

# The 18 bank-specified features commonly used for fraud detection
BANK_FEATURES = [
    "F115", "F321", "F527", "F531", "F670", "F1692",
    "F2082", "F2122", "F2582", "F2678", "F2737",
    "F2956", "F3043", "F3836", "F3887", "F3889",
    "F3891", "F3894",
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create derived features from the 18 bank-specified columns."""
    eng = df.copy()

    # Get available bank columns in the current dataframe
    bank_cols = [c for c in BANK_FEATURES if c in df.columns]
    
    if not bank_cols:
        return eng

    # 1. Statistical aggregates across bank features
    # (Checking for numeric dtype first to avoid errors on categorical columns if any)
    numeric_bank_cols = eng[bank_cols].select_dtypes(include=[np.number]).columns.tolist()
    
    if numeric_bank_cols:
        eng["bank_feat_mean"]   = eng[numeric_bank_cols].mean(axis=1)
        eng["bank_feat_std"]    = eng[numeric_bank_cols].std(axis=1)
        eng["bank_feat_max"]    = eng[numeric_bank_cols].max(axis=1)
        eng["bank_feat_min"]    = eng[numeric_bank_cols].min(axis=1)
        eng["bank_feat_range"]  = eng["bank_feat_max"] - eng["bank_feat_min"]
        eng["bank_feat_skew"]   = eng[numeric_bank_cols].skew(axis=1)
        eng["bank_feat_kurtosis"] = eng[numeric_bank_cols].kurtosis(axis=1)

        # 2. Z-score normalisation per row (how far is each record from global average)
        global_mean = eng[numeric_bank_cols].values.mean()
        global_std  = eng[numeric_bank_cols].values.std() or 1
        eng["bank_feat_zscore"] = (eng["bank_feat_mean"] - global_mean) / global_std

    # 3. Pairwise ratios between specific suspicious feature pairs
    ratio_pairs = [("F115", "F321"), ("F531", "F670"), ("F2082", "F2122"),
                   ("F3887", "F3889"), ("F3891", "F3894")]
    for a, b in ratio_pairs:
        if a in df.columns and b in df.columns:
            try:
                # Replace 0 with NaN to avoid division by zero, then fill resulting NaNs with 0
                num_a = pd.to_numeric(df[a], errors='coerce').fillna(0)
                num_b = pd.to_numeric(df[b], errors='coerce').replace(0, np.nan)
                eng[f"ratio_{a}_{b}"] = num_a / num_b
                eng[f"ratio_{a}_{b}"] = eng[f"ratio_{a}_{b}"].fillna(0)
            except Exception:
                eng[f"ratio_{a}_{b}"] = 0.0

    # 4. Binary flags for extreme values (top/bottom 5%)
    # This identifies features pushing into the 95th percentile or dropping below 5th
    for col in numeric_bank_cols:
        q95 = df[col].quantile(0.95)
        q05 = df[col].quantile(0.05)
        eng[f"{col}_extreme_high"] = (df[col] > q95).astype(int)
        eng[f"{col}_extreme_low"]  = (df[col] < q05).astype(int)

    # 5. Count of how many bank features are in the extreme range
    extreme_cols = [c for c in eng.columns if c.endswith("_extreme_high")]
    if extreme_cols:
        eng["extreme_feature_count"] = eng[extreme_cols].sum(axis=1)

    return eng