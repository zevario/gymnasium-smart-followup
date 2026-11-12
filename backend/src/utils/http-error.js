/**
 * Throws an error carrying an HTTP status code. The error handler turns it into
 * a JSON response with that status and the given message.
 */
export function reject(message, statusCode = 409) {
  throw Object.assign(new Error(message), { statusCode });
}
