export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

export interface OpenedFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}
