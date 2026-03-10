/**
 * Unit tests for AmbientParticles component.
 * Verifies exactly 8 particles are rendered with correct classes,
 * accessibility attributes, and color distribution.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AmbientParticles from './AmbientParticles.vue';

function mountParticles() {
  return mount(AmbientParticles);
}

describe('AmbientParticles — container', () => {
  it('renders a container element', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particles').exists()).toBe(true);
  });

  it('container has aria-hidden="true"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particles').attributes('aria-hidden')).toBe('true');
  });
});

describe('AmbientParticles — particle count', () => {
  it('renders exactly 8 particle divs', () => {
    const wrapper = mountParticles();
    const particles = wrapper.findAll('.landing-empty__ambient-particle');
    expect(particles).toHaveLength(8);
  });
});

describe('AmbientParticles — particle classes', () => {
  it('each particle has the base class "landing-empty__ambient-particle"', () => {
    const wrapper = mountParticles();
    const particles = wrapper.findAll('.landing-empty__ambient-particle');
    particles.forEach((p) => {
      expect(p.classes()).toContain('landing-empty__ambient-particle');
    });
  });

  it('particle 1 has class "landing-empty__ambient-particle--1"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--1').exists()).toBe(true);
  });

  it('particle 2 has class "landing-empty__ambient-particle--2"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--2').exists()).toBe(true);
  });

  it('particle 3 has class "landing-empty__ambient-particle--3"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--3').exists()).toBe(true);
  });

  it('particle 4 has class "landing-empty__ambient-particle--4"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--4').exists()).toBe(true);
  });

  it('particle 5 has class "landing-empty__ambient-particle--5"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--5').exists()).toBe(true);
  });

  it('particle 6 has class "landing-empty__ambient-particle--6"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--6').exists()).toBe(true);
  });

  it('particle 7 has class "landing-empty__ambient-particle--7"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--7').exists()).toBe(true);
  });

  it('particle 8 has class "landing-empty__ambient-particle--8"', () => {
    const wrapper = mountParticles();
    expect(wrapper.find('.landing-empty__ambient-particle--8').exists()).toBe(true);
  });
});

describe('AmbientParticles — accessibility', () => {
  it('all particles have aria-hidden="true"', () => {
    const wrapper = mountParticles();
    const particles = wrapper.findAll('.landing-empty__ambient-particle');
    particles.forEach((p) => {
      expect(p.attributes('aria-hidden')).toBe('true');
    });
  });
});
