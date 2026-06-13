import networkx as nx
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.services.anomaly_service import (
    get_anomaly_scores
)


def build_graph():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    G = nx.Graph()

    # Create nodes from suspicious records
    suspicious_idx = (
        pd.Series(scores)
        .sort_values()
        .head(100)
        .index
    )

    suspicious_list = list(suspicious_idx)

    for idx in suspicious_list:

        G.add_node(
            int(idx),
            risk_score=float(abs(scores[idx]) * 1000)
        )

    # Feature-based linkage (Cosine Similarity)
    numeric_df = df.iloc[suspicious_list].select_dtypes(include=[np.number]).fillna(0)
    
    # Fallback to sequential if no numeric data
    if numeric_df.empty or numeric_df.shape[1] == 0:
        for i in range(len(suspicious_list) - 1):
            G.add_edge(int(suspicious_list[i]), int(suspicious_list[i + 1]))
        return G

    # Calculate similarity matrix
    similarity_matrix = cosine_similarity(numeric_df)
    
    # Determine dynamic threshold to ensure some connectivity, but cap at 0.99
    # We'll use 90th percentile of similarity scores to define the threshold
    flat_sim = similarity_matrix[np.triu_indices_from(similarity_matrix, k=1)]
    if len(flat_sim) > 0:
        threshold = np.percentile(flat_sim, 90)
    else:
        threshold = 0.95

    # Connect highly similar nodes
    for i in range(len(suspicious_list)):
        for j in range(i + 1, len(suspicious_list)):
            if similarity_matrix[i, j] > threshold:
                G.add_edge(
                    int(suspicious_list[i]),
                    int(suspicious_list[j]),
                    weight=float(similarity_matrix[i, j])
                )

    return G