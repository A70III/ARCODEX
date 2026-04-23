export interface CodexItem {
  id: string;
  name: string;
  path: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodexCategory {
  folder: string;
  label: string;
  items: CodexItem[];
}