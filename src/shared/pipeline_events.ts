/**
 * Backward-compatibility re-exports.
 * New code should import from './types/pipeline.js' or './types/index.js'.
 */
export type {
  DetectionStatus,
  PipelineEvent,
  PipelineEventType,
  PipelineEventPayload,
} from './types/pipeline.js';
export { PipelineStage } from './types/pipeline.js';
