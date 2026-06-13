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

    