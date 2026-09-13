// lib/cbdb/relation-path.ts v1.15.7
import { loadRelMeta, locateShard, loadShardFile } from "./rel";
import type { RelMeta, KinEdge, AssocEdge } from "./rel";

export interface RelationPathStep {
  from: number;
  to: number;
  rel: string;
  kind: "kin" | "assoc";
}

export interface TraceOptions {
  maxDepth?: number; // 最大探索深度（1=直接，2=二级，3=三级），默认 2
  maxBreadth?: number; // 第一层探索宽度，后续层按 2 的幂递减，默认 12
}

export interface TraceResult {
  steps: RelationPathStep[];
  explored: number; // 实际展开的人物数
}

// 邻居缓存：personId → Map(邻居id → {rel, kind})，避免 BFS 中重复加载分片
const neighborsCache = new Map<number, Map<number, { rel: string; kind: "kin" | "assoc" }>>();

/** 获取某人的全部关系对象（亲属+社会，带缓存） */
async function getNeighborsCached(
  personId: number,
  meta: RelMeta
): Promise<Map<number, { rel: string; kind: "kin" | "assoc" }>> {
  const cached = neighborsCache.get(personId);
  if (cached) return cached;
  const shard = locateShard(meta, personId);
  const neighbors = new Map<number, { rel: string; kind: "kin" | "assoc" }>();
  if (shard) {
    if (shard.kinFile) {
      const edges = await loadShardFile<KinEdge[]>(shard.kinFile);
      for (const e of edges) {
        if (e[0] !== personId) continue;
        const rel = meta.kinCodes[e[2]];
        if (rel) neighbors.set(e[1], { rel, kind: "kin" });
      }
    }
    if (shard.assocFile) {
      const edges = await loadShardFile<AssocEdge[]>(shard.assocFile);
      for (const e of edges) {
        if (e[0] !== personId) continue;
        const rel = meta.assocCodes[e[2]];
        if (rel && !neighbors.has(e[1])) neighbors.set(e[1], { rel, kind: "assoc" });
      }
    }
  }
  neighborsCache.set(personId, neighbors);
  return neighbors;
}

/**
 * 双人关系溯源（分层 BFS）：
 * 逐层展开 A 的关系网络，支持直接（1 级）/ 二级 / 三级中间关系。
 * 每层广度递减（breadth(level) = max(4, maxBreadth / 2^(level-1))），
 * 通过 visited 去重与邻居缓存控制分片加载次数。
 */
export async function findRelationPath(
  a: number,
  b: number,
  opts: TraceOptions = {}
): Promise<TraceResult> {
  const maxDepth = Math.min(3, Math.max(1, opts.maxDepth ?? 2));
  const maxBreadth = Math.max(4, opts.maxBreadth ?? 12);
  const meta = await loadRelMeta();
  if (a === b) return { steps: [], explored: 0 };

  const visited = new Set<number>([a]);
  let queue: { id: number; path: RelationPathStep[] }[] = [{ id: a, path: [] }];
  let explored = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const breadth = Math.max(4, Math.floor(maxBreadth / Math.pow(2, depth - 1)));
    const next: { id: number; path: RelationPathStep[] }[] = [];
    for (const node of queue) {
      const neighbors = await getNeighborsCached(node.id, meta);
      explored++;
      let count = 0;
      for (const [nid, info] of Array.from(neighbors.entries())) {
        if (count++ >= breadth) break;
        const step: RelationPathStep = { from: node.id, to: nid, rel: info.rel, kind: info.kind };
        if (nid === b) return { steps: [...node.path, step], explored };
        if (!visited.has(nid)) {
          visited.add(nid);
          next.push({ id: nid, path: [...node.path, step] });
        }
      }
    }
    queue = next;
    if (!queue.length) break;
  }
  return { steps: [], explored };
}
