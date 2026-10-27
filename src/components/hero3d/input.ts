/**
 * Keyboard / pointer / touch input for the city. Keys are only captured while the city
 * container has focus, so WASD, arrows and Space never hijack page scrolling or typing
 * elsewhere. All state is cleared when focus or visibility is lost (no "stuck" keys).
 */
export interface InputState {
  forward: number;
  right: number;
  run: boolean;
  jump: boolean;
  /** Touch joystick vector, merged with keys. */
  stick: { x: number; y: number };
  /** Accumulated camera yaw delta from pointer drags (radians). */
  yawDelta: number;
  pitchDelta: number;
}

const MOVE_KEYS: Record<string, [axis: 'forward' | 'right', value: number]> = {
  KeyW: ['forward', 1],
  ArrowUp: ['forward', 1],
  KeyS: ['forward', -1],
  ArrowDown: ['forward', -1],
  KeyA: ['right', -1],
  ArrowLeft: ['right', -1],
  KeyD: ['right', 1],
  ArrowRight: ['right', 1],
};

export function createInput(target: HTMLElement, handlers: { onInteract: () => void; onEscape: () => void; onActivity: () => void }) {
  const pressed = new Set<string>();
  const state: InputState = { forward: 0, right: 0, run: false, jump: false, stick: { x: 0, y: 0 }, yawDelta: 0, pitchDelta: 0 };

  const recompute = () => {
    let f = 0;
    let r = 0;
    for (const code of pressed) {
      const m = MOVE_KEYS[code];
      if (!m) continue;
      if (m[0] === 'forward') f += m[1];
      else r += m[1];
    }
    state.forward = Math.max(-1, Math.min(1, f + state.stick.y));
    state.right = Math.max(-1, Math.min(1, r + state.stick.x));
    state.run = pressed.has('ShiftLeft') || pressed.has('ShiftRight') || Math.hypot(state.stick.x, state.stick.y) > 0.92;
  };

  const reset = () => {
    pressed.clear();
    state.jump = false;
    state.stick = { x: 0, y: 0 };
    dragging = false;
    recompute();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.code === 'Escape') {
      handlers.onEscape();
      return;
    }
    if (e.code === 'KeyE' || (e.code === 'Enter' && e.target === target)) {
      e.preventDefault();
      handlers.onInteract();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      state.jump = true;
      handlers.onActivity();
      return;
    }
    if (MOVE_KEYS[e.code] || e.code.startsWith('Shift')) {
      e.preventDefault();
      pressed.add(e.code);
      recompute();
      handlers.onActivity();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') state.jump = false;
    pressed.delete(e.code);
    recompute();
  };

  // Pointer drag on the canvas orbits the camera.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return; // touch uses the on-screen joystick
    if ((e.target as HTMLElement).closest('[data-hud]')) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    state.yawDelta -= (e.clientX - lastX) * 0.005;
    state.pitchDelta += (e.clientY - lastY) * 0.003;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onPointerUp = () => {
    dragging = false;
  };
  const onBlur = () => reset();
  const onVisibility = () => {
    if (document.hidden) reset();
  };
  const onFocusOut = (e: FocusEvent) => {
    if (!target.contains(e.relatedTarget as Node | null)) reset();
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('focusout', onFocusOut);
  target.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    state,
    setStick(x: number, y: number) {
      state.stick = { x, y };
      recompute();
    },
    setJump(value: boolean) {
      state.jump = value;
    },
    consumeLook() {
      const look = { yaw: state.yawDelta, pitch: state.pitchDelta };
      state.yawDelta = 0;
      state.pitchDelta = 0;
      return look;
    },
    reset,
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('focusout', onFocusOut);
      target.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

export type InputController = ReturnType<typeof createInput>;
