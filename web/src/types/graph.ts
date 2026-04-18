export interface GraphNode {
  id: string;
  labels: string[];
  props: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  props: Record<string, unknown>;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
