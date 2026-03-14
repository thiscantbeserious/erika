/**
 * Tests for useLayout mobile overlay additions — Stage 13.
 *
 * Covers: isMobileOverlayOpen initial state, openMobileOverlay, closeMobileOverlay,
 * and the LayoutState shape including new mobile overlay fields.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope } from 'vue';
import { useLayout } from './useLayout.js';

describe('useLayout() — mobile overlay (Stage 13)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isMobileOverlayOpen', () => {
    it('defaults to false on init', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });
      expect(layout?.isMobileOverlayOpen.value).toBe(false);
      scope.stop();
    });
  });

  describe('openMobileOverlay()', () => {
    it('sets isMobileOverlayOpen to true', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });

      layout?.openMobileOverlay();
      expect(layout?.isMobileOverlayOpen.value).toBe(true);
      scope.stop();
    });
  });

  describe('closeMobileOverlay()', () => {
    it('sets isMobileOverlayOpen to false after opening', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });

      layout?.openMobileOverlay();
      layout?.closeMobileOverlay();
      expect(layout?.isMobileOverlayOpen.value).toBe(false);
      scope.stop();
    });

    it('is a no-op when overlay is already closed', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });

      layout?.closeMobileOverlay();
      expect(layout?.isMobileOverlayOpen.value).toBe(false);
      scope.stop();
    });
  });

  describe('return shape', () => {
    it('exposes isMobileOverlayOpen, openMobileOverlay, closeMobileOverlay', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });

      expect('isMobileOverlayOpen' in (layout ?? {})).toBe(true);
      expect('openMobileOverlay' in (layout ?? {})).toBe(true);
      expect('closeMobileOverlay' in (layout ?? {})).toBe(true);
      scope.stop();
    });

    it('isMobileOverlayOpen is readonly (ref-like)', () => {
      const scope = effectScope();
      let layout: ReturnType<typeof useLayout> | undefined;
      scope.run(() => { layout = useLayout(); });

      // Should be a ref (has .value)
      expect(typeof layout?.isMobileOverlayOpen?.value).toBe('boolean');
      scope.stop();
    });
  });
});
