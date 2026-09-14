export function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 20, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse(data, total, page, pageSize) {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}
