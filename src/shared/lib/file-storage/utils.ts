/**
 * Sanitizes a file name by replacing non-alphanumeric characters
 * (except dots and hyphens) with underscores and truncating to 200 chars.
 */
export const sanitizeFileName = (name: string) =>
  name.replaceAll(/[^\w.-]+/g, '_').slice(-200)
