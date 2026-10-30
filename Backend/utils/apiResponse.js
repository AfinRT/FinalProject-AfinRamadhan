export const EMPTY_LIST_MESSAGE = "Data tidak ditemukan.";

// Mengirim respons JSON standar untuk request yang berhasil.
export function sendSuccess(res, status, message, data) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginatedSuccess(res, status, message, items, pagination) {
  const { offset, ...metadata } = pagination;
  return sendSuccess(
    res,
    status,
    items.length === 0 ? EMPTY_LIST_MESSAGE : message,
    {
      items,
      pagination: metadata,
    },
  );
}

// Mengirim respons JSON standar untuk kegagalan beserta detail opsional.
export function sendError(res, status, message, errors) {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(status).json(response);
}
