export interface Project {
  name: string;
  created?: boolean;
}

export interface ProjectDetail {
  name: string;
  images: ImageInfo[];
  readme: string;
}

export interface ImageInfo {
  filename: string;
  url: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}