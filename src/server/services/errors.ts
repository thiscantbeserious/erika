/**
 * Backward-compatibility re-exports.
 * ServiceError and ServiceErrorCode now live in shared types.
 * New code should import from '../../shared/types/errors.js' or '../../shared/types/index.js'.
 */
export { ServiceError } from '../../shared/types/errors.js';
export type { ServiceErrorCode } from '../../shared/types/errors.js';
