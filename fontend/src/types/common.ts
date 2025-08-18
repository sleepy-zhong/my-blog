export type Id = number | string;

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
};

export type UnknownData = Record<string, unknown>;
