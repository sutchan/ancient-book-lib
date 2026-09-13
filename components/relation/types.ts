// components/relation/types.ts v1.15.8

/** 社会关系溯源页共享类型 */
export interface SelectedPerson {
  id: number;
  name: string;
}

export interface RelItem {
  id: number;
  name: string;
  rel: string;
  year?: number;
}
