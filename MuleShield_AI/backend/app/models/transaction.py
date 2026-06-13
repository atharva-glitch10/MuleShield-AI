from pydantic import BaseModel

class Transaction(BaseModel):
    account_age_days: int
    transaction_count: int
    total_credit_amount: float
    total_debit_amount: float
    unique_beneficiaries: int
    cash_withdrawals: float
    