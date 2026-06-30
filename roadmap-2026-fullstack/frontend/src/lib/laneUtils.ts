import type { RoadmapItem } from '../types';

export interface LanedItem extends RoadmapItem {
  lane: number;
}

export function packLanes(items: RoadmapItem[]): LanedItem[] {
  const laneEnd: number[] = [];
  return items.map(p => {
    const eff = p.ongoingEnd ?? p.end;
    let l = 0;
    while (laneEnd[l] !== undefined && laneEnd[l] >= p.start) l++;
    laneEnd[l] = eff;
    return { ...p, lane: l };
  });
}
