from fastapi import APIRouter
import networkx as nx

from app.services.graph_service import (
    build_graph
)

router = APIRouter(
    tags=["Graph Intelligence"]
)


@router.get("/graph/summary")
def graph_summary():

    G = build_graph()

    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "connected_components":
            nx.number_connected_components(G)
    }


@router.get("/graph/high-risk-nodes")
def high_risk_nodes():

    G = build_graph()

    result = []

    for node, data in G.nodes(data=True):

        result.append({
            "node_id": node,
            "risk_score":
                round(
                    data["risk_score"],
                    2
                )
        })

    result = sorted(
        result,
        key=lambda x: x["risk_score"],
        reverse=True
    )

    return result[:20]


@router.get("/graph/mule-clusters")
def mule_clusters():

    G = build_graph()

    clusters = []

    for idx, component in enumerate(
        nx.connected_components(G)
    ):

        clusters.append({
            "cluster_id": idx + 1,
            "accounts":
                list(component)
        })

    return clusters