export interface Link {
  url: string;
  label?: string;
}

export interface StarItem {
  id: string;
  name: string;
  price: number;
  links: Link[];
  notes?: string;
  priority: number;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StarGroup {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
