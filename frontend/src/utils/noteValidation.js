export const NOTE_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"];
export const NOTE_MAX_FILES = 5;
export const NOTE_MAX_FILE_MB = 20;

const extOf = (name = "") => name.split(".").pop().toLowerCase();

/**
 * Pure validation shared by the form (and unit-testable without React).
 * @returns {{ errors: Record<string,string>, valid: boolean }}
 */
export function validateNoteForm({ title, description, keptFileCount = 0, newFiles = [] }) {
  const errors = {};

  if (!title || !title.trim()) errors.title = "Title is required";
  else if (title.trim().length > 120) errors.title = "Title cannot be more than 120 characters";

  if (description && description.length > 2000) {
    errors.description = "Description cannot be more than 2000 characters";
  }

  if (keptFileCount + newFiles.length > NOTE_MAX_FILES) {
    errors.files = `A note can have at most ${NOTE_MAX_FILES} files`;
  } else {
    const bad = newFiles.find((f) => !NOTE_ALLOWED_EXTENSIONS.includes(extOf(f.name)));
    const big = newFiles.find((f) => f.size > NOTE_MAX_FILE_MB * 1024 * 1024);
    if (bad) errors.files = `"${bad.name}" is not supported. Allowed: PDF, Word, PowerPoint, Excel, TXT`;
    else if (big) errors.files = `"${big.name}" is larger than ${NOTE_MAX_FILE_MB} MB`;
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}
