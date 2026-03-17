/**
 * Branch coverage test for ToolbarPill — template ternary on expandedMaxWidth.
 *
 * Lines targeted:
 *   5 — `:style="expandedMaxWidth ? { '--toolbar-expanded-width': expandedMaxWidth + 'px' } : undefined"`
 *       The truthy branch: when expandedMaxWidth > 0, the CSS custom property is set.
 *       Achieved by stubbing scrollWidth on the content element before onMounted runs.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ToolbarPill from './ToolbarPill.vue';

describe('ToolbarPill — expandedMaxWidth style binding truthy branch (line 5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets --toolbar-expanded-width CSS custom property when scrollWidth is non-zero', async () => {
    // Stub scrollWidth on HTMLElement.prototype to return 240 and getComputedStyle
    // to return known padding values — makes onMounted set expandedMaxWidth = 240+16 = 256
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      get: () => 240,
      configurable: true,
    });
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      paddingLeft: '8px',
      paddingRight: '8px',
    } as unknown as CSSStyleDeclaration);

    const wrapper = mount(ToolbarPill, {
      slots: { default: '<button>Test</button>' },
      attachTo: document.body,
    });

    // Wait for onMounted's nextTick to resolve
    await nextTick();
    await nextTick();

    const pill = wrapper.find('.toolbar-pill');
    const style = pill.attributes('style') ?? '';
    // expandedMaxWidth should be 256, so the truthy branch should set the CSS var
    expect(style).toContain('--toolbar-expanded-width');

    wrapper.unmount();

    // Restore original scrollWidth descriptor
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      get: () => 0,
      configurable: true,
    });
  });
});
