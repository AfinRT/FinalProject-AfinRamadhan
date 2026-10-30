const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function parsePagination(query = {}) {
  const rawPage = query.page ?? "1";
  const rawPageSize = query.page_size ?? String(DEFAULT_PAGE_SIZE);

  if (
    typeof rawPage !== "string" ||
    !/^[1-9]\d*$/.test(rawPage) ||
    !Number.isSafeInteger(Number(rawPage))
  ) {
    return { error: "Halaman harus berupa bilangan bulat positif." };
  }

  if (
    typeof rawPageSize !== "string" ||
    !/^[1-9]\d*$/.test(rawPageSize) ||
    !Number.isSafeInteger(Number(rawPageSize)) ||
    Number(rawPageSize) > MAX_PAGE_SIZE
  ) {
    return {
      error: `Ukuran halaman harus berupa bilangan bulat antara 1 dan ${MAX_PAGE_SIZE}.`,
    };
  }

  return { page: Number(rawPage), pageSize: Number(rawPageSize) };
}

export function createPagination(page, pageSize, totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  return {
    page: currentPage,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    offset: (currentPage - 1) * pageSize,
  };
}
