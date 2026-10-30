function writeLog(level, message, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...details,
  };
  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
}

export function logInfo(message, context = {}) {
  writeLog("info", message, context);
}

export function logError(message, error, context = {}) {
  const errorDetails =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          ...(error.code ? { code: error.code } : {}),
        }
      : { message: String(error) };

  writeLog("error", message, { ...context, error: errorDetails });
}
