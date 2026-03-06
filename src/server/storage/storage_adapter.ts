/**
 * Adapter interface for session file storage.
 * This is the abstraction boundary — implementations can swap filesystem for object storage.
 *
 * The adapter owns path resolution. Constructor receives the data directory;
 * all methods take a session ID and resolve paths internally.
 */
export interface StorageAdapter {
  /**
   * Save session content by ID.
   * Creates parent directories as needed.
   * Returns the absolute filepath where the file was saved.
   */
  save(id: string, content: string): Promise<string>;

  /**
   * Read session content by ID.
   * Throws if the session file does not exist.
   */
  read(id: string): Promise<string>;

  /**
   * Delete session file by ID.
   * Returns true if deleted, false if not found.
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check whether a session file exists.
   */
  exists(id: string): Promise<boolean>;
}
