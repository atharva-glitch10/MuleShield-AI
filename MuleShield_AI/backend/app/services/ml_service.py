def calculate_fraud_score(data):

    score = 0

    if data.transaction_count > 100:
        score += 30

    if data.unique_beneficiaries > 20:
        score += 30

    if data.cash_withdrawals > 100000:
        score += 20

    if data.total_credit_amount > 500000:
        score += 20

    return min(score, 100)