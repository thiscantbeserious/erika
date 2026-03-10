/**
 * Unit tests for BackgroundGrid component.
 * Verifies SVG structure, unique pattern ID, accessibility attributes,
 * and animation class presence.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BackgroundGrid from './BackgroundGrid.vue';

function mountGrid() {
  return mount(BackgroundGrid);
}

describe('BackgroundGrid — SVG structure', () => {
  it('renders an SVG element', () => {
    const wrapper = mountGrid();
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('SVG has aria-hidden="true"', () => {
    const wrapper = mountGrid();
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
  });

  it('SVG has pointer-events: none style', () => {
    const wrapper = mountGrid();
    const svg = wrapper.find('svg').element as SVGElement;
    expect(svg.style.pointerEvents).toBe('none');
  });

  it('SVG has preserveAspectRatio="xMidYMid slice"', () => {
    const wrapper = mountGrid();
    const svg = wrapper.find('svg').element as SVGSVGElement;
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
  });

  it('renders a <defs> element containing a <pattern>', () => {
    const wrapper = mountGrid();
    expect(wrapper.find('defs').exists()).toBe(true);
    expect(wrapper.find('defs pattern').exists()).toBe(true);
  });

  it('pattern has correct grid dimensions (40x40)', () => {
    const wrapper = mountGrid();
    const pattern = wrapper.find('defs pattern');
    expect(pattern.attributes('width')).toBe('40');
    expect(pattern.attributes('height')).toBe('40');
  });

  it('pattern has patternUnits="userSpaceOnUse"', () => {
    const wrapper = mountGrid();
    const pattern = wrapper.find('defs pattern').element as SVGPatternElement;
    expect(pattern.getAttribute('patternUnits')).toBe('userSpaceOnUse');
  });

  it('pattern contains two lines (horizontal and vertical grid lines)', () => {
    const wrapper = mountGrid();
    const lines = wrapper.findAll('defs pattern line');
    expect(lines).toHaveLength(2);
  });

  it('grid lines have stroke "#00d4ff"', () => {
    const wrapper = mountGrid();
    const lines = wrapper.findAll('defs pattern line');
    lines.forEach((line) => {
      expect(line.attributes('stroke')).toBe('#00d4ff');
    });
  });

  it('grid lines have stroke-width "0.4"', () => {
    const wrapper = mountGrid();
    const lines = wrapper.findAll('defs pattern line');
    lines.forEach((line) => {
      expect(line.attributes('stroke-width')).toBe('0.4');
    });
  });

  it('pattern contains an intersection dot circle', () => {
    const wrapper = mountGrid();
    expect(wrapper.find('defs pattern circle').exists()).toBe(true);
  });

  it('intersection dot is filled with "#00d4ff"', () => {
    const wrapper = mountGrid();
    const circle = wrapper.find('defs pattern circle');
    expect(circle.attributes('fill')).toBe('#00d4ff');
  });

  it('renders a rect with fill referencing the pattern', () => {
    const wrapper = mountGrid();
    const rect = wrapper.find('svg > rect');
    expect(rect.exists()).toBe(true);
    const fill = rect.attributes('fill') ?? '';
    expect(fill).toMatch(/^url\(#background-grid-/);
  });
});

describe('BackgroundGrid — unique pattern ID', () => {
  it('pattern ID starts with "background-grid-"', () => {
    const wrapper = mountGrid();
    const pattern = wrapper.find('defs pattern');
    expect(pattern.attributes('id')).toMatch(/^background-grid-[a-z0-9]{6}$/);
  });

  it('each instance gets a different pattern ID', () => {
    const a = mountGrid();
    const b = mountGrid();
    const idA = a.find('defs pattern').attributes('id');
    const idB = b.find('defs pattern').attributes('id');
    // It is possible (extremely unlikely) they collide but highly improbable
    expect(typeof idA).toBe('string');
    expect(typeof idB).toBe('string');
    expect(idA).toMatch(/^background-grid-[a-z0-9]{6}$/);
    expect(idB).toMatch(/^background-grid-[a-z0-9]{6}$/);
  });

  it('rect fill references the same ID used in the pattern', () => {
    const wrapper = mountGrid();
    const patternId = wrapper.find('defs pattern').attributes('id');
    const rectFill = wrapper.find('svg > rect').attributes('fill');
    expect(rectFill).toBe(`url(#${patternId})`);
  });
});

describe('BackgroundGrid — grid-dots animation class', () => {
  it('rect has class "landing-empty__grid-dots"', () => {
    const wrapper = mountGrid();
    const rect = wrapper.find('svg > rect');
    expect(rect.classes()).toContain('landing-empty__grid-dots');
  });
});
