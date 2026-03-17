/**
 * Tests for ToolbarButton component.
 *
 * Covers: rendering, accessibility, icon slot, and click event emission.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ToolbarButton from './ToolbarButton.vue';

function mountButton(props = {}) {
  return mount(ToolbarButton, {
    props: { icon: 'icon-settings', label: 'Settings', ...props },
  });
}

describe('ToolbarButton', () => {
  describe('rendering', () => {
    it('renders a <button> element', () => {
      const wrapper = mountButton();
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('renders the icon span with the base icon class', () => {
      const wrapper = mountButton({ icon: 'icon-settings' });
      expect(wrapper.find('.icon').exists()).toBe(true);
    });

    it('renders the icon span with the specific icon class', () => {
      const wrapper = mountButton({ icon: 'icon-settings' });
      expect(wrapper.find('.icon-settings').exists()).toBe(true);
    });

    it('renders with a different icon class when prop changes', () => {
      const wrapper = mountButton({ icon: 'icon-bell' });
      expect(wrapper.find('.icon-bell').exists()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('sets aria-label from the label prop', () => {
      const wrapper = mountButton({ label: 'Settings' });
      expect(wrapper.find('button').attributes('aria-label')).toBe('Settings');
    });

    it('sets title attribute from the label prop', () => {
      const wrapper = mountButton({ label: 'Notifications' });
      expect(wrapper.find('button').attributes('title')).toBe('Notifications');
    });
  });

  describe('events', () => {
    it('emits a click event when the button is clicked', async () => {
      const wrapper = mountButton();
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });
});
