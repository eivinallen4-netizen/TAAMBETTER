'use client';

import { useEffect, useRef } from 'react';

/**
 * Print-style halftone behind an orange section: a 45° screen of ink dots that drifts slowly
 * and swells around the cursor. Drawn with three.js on a transparent canvas, so the section's
 * own orange stays the background and outlined type (filled with --tone-bg) knocks the dots out.
 *
 * The parent section needs `isolate` so the canvas (z -1) sits above its background but below
 * its content. three.js is only fetched once the section comes near the screen, it only renders
 * while visible, and with reduced motion it draws one still frame and stops.
 */

/** Dot pitch in CSS px. */
const CELL = 13;
/** Base ink opacity, plus the extra the cursor adds. Kept low so white type stays the loudest thing. */
const INK_ALPHA = 0.09;
const CURSOR_ALPHA = 0.1;
/** Radius of the cursor's influence, CSS px. */
const CURSOR_RADIUS = 240;

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uDpr;
  uniform float uTime;
  uniform vec2 uMouse;      // CSS px, origin bottom-left
  uniform float uStrength;  // 0..1, how present the cursor is
  uniform float uEnergy;    // 0..1, how fast it's moving
  uniform float uCell;
  uniform float uRadius;
  uniform float uInkAlpha;
  uniform float uCursorAlpha;
  uniform vec3 uInk;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 px = gl_FragCoord.xy / uDpr;

    // A 45° screen, like a print halftone.
    const float c = 0.70710678;
    vec2 g = mat2(c, c, -c, c) * px / uCell;
    vec2 cell = floor(g) + 0.5;
    vec2 local = g - cell;
    vec2 center = mat2(c, -c, c, c) * (cell * uCell);

    // Slow ink drift: two octaves of value noise, pushed toward patches.
    float n = noise(center * 0.0035 + vec2(uTime * 0.035, uTime * 0.022)) * 0.65
            + noise(center * 0.011 - vec2(uTime * 0.02, -uTime * 0.03)) * 0.35;
    n = smoothstep(0.38, 0.82, n);

    // The cursor: a soft lens that swells the dots, a little more when it moves fast.
    float d = distance(center, uMouse) / uRadius;
    float m = exp(-d * d * 2.2) * uStrength;

    float r = 0.05 + 0.2 * n + m * (0.17 + 0.11 * uEnergy);
    r = min(r, 0.5);

    float aa = 0.9 / uCell;
    float disc = 1.0 - smoothstep(r - aa, r + aa, length(local));
    float alpha = disc * (uInkAlpha + m * uCursorAlpha);

    gl_FragColor = vec4(uInk, alpha);
  }
`;

export default function HalftoneField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host = canvas.parentElement ?? canvas;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const THREE = await import('three');
      if (disposed) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      } catch {
        return; // No WebGL: the plain orange field is the fallback.
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);

      const uniforms = {
        uDpr: { value: dpr },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(-9999, -9999) },
        uStrength: { value: 0 },
        uEnergy: { value: 0 },
        uCell: { value: CELL },
        uRadius: { value: CURSOR_RADIUS },
        uInkAlpha: { value: INK_ALPHA },
        uCursorAlpha: { value: CURSOR_ALPHA },
        uInk: { value: new THREE.Color('#111111') },
      };
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false });
      const geometry = new THREE.PlaneGeometry(2, 2);
      const scene = new THREE.Scene();
      scene.add(new THREE.Mesh(geometry, material));
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      let width = 0;
      let height = 0;
      const resize = () => {
        width = host.clientWidth;
        height = host.clientHeight;
        renderer.setSize(width, height, false);
        if (still) renderer.render(scene, camera);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();

      const reveal = () => requestAnimationFrame(() => (canvas.style.opacity = '1'));

      if (still) {
        renderer.render(scene, camera);
        reveal();
        cleanup = () => {
          ro.disconnect();
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
        return;
      }

      // Pointer: tracked on the window (the canvas ignores pointer events), eased per frame.
      const target = { x: -9999, y: -9999, inside: false };
      let last: { x: number; y: number } | null = null;
      let speed = 0;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        const rect = canvas.getBoundingClientRect();
        target.x = e.clientX - rect.left;
        target.y = rect.bottom - e.clientY;
        target.inside = target.x >= 0 && target.x <= rect.width && target.y >= 0 && target.y <= rect.height;
        if (last) speed += Math.hypot(e.clientX - last.x, e.clientY - last.y);
        last = { x: e.clientX, y: e.clientY };
      };
      const onLeave = () => {
        target.inside = false;
        last = null;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);

      // Only render while the section is on screen and the tab is visible.
      let visible = false;
      let frame = 0;
      let prev = 0;
      let time = Math.random() * 100;
      const mouse = uniforms.uMouse.value;

      const tick = (now: number) => {
        const dt = Math.min((now - (prev || now)) / 1000, 0.05);
        prev = now;
        time += dt;
        uniforms.uTime.value = time;

        if (target.inside) {
          if (uniforms.uStrength.value < 0.01) mouse.set(target.x, target.y); // Don't sweep in from the old spot.
          mouse.x += (target.x - mouse.x) * Math.min(1, dt * 9);
          mouse.y += (target.y - mouse.y) * Math.min(1, dt * 9);
        }
        uniforms.uStrength.value += ((target.inside ? 1 : 0) - uniforms.uStrength.value) * Math.min(1, dt * 4);
        uniforms.uEnergy.value = Math.min(1, uniforms.uEnergy.value * Math.exp(-dt * 2.5) + speed * 0.0025);
        speed = 0;

        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };

      const play = () => {
        if (frame || !visible || document.hidden) return;
        prev = 0;
        frame = requestAnimationFrame(tick);
      };
      const pause = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else pause();
      });
      io.observe(host);
      const onVisibility = () => (document.hidden ? pause() : play());
      document.addEventListener('visibilitychange', onVisibility);

      renderer.render(scene, camera);
      reveal();

      cleanup = () => {
        pause();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    };

    // Fetch three.js only when the section is about to scroll in.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        start();
      },
      { rootMargin: '300px 0px' },
    );
    near.observe(host);

    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-[1200ms]"
    />
  );
}
