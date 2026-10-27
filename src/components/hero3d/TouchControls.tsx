'use client';

import { useRef, useState, type RefObject } from 'react';
import type { InputController } from './input';

/**
 * On-screen joystick + jump/interact buttons, shown only on coarse-pointer (touch) devices.
 * Pushing the stick to its edge runs.
 */
export function TouchControls({ input, onInteract, canInteract }: { input: RefObject<InputController | null>; onInteract: () => void; canInteract: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointer = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const rect = base.current!.getBoundingClientRect();
    const r = rect.width / 2;
    let x = (clientX - rect.left - r) / r;
    let y = (clientY - rect.top - r) / r;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    setKnob({ x, y });
    input.current?.setStick(x, -y);
  };
  const end = () => {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    input.current?.setStick(0, 0);
  };

  return (
    <div data-hud className="pointer-coarse:flex absolute inset-x-0 bottom-0 z-20 hidden items-end justify-between p-5">
      <div
        ref={base}
        className="relative size-28 touch-none rounded-full border border-border-strong bg-bg-elevated/50 backdrop-blur"
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointer.current === e.pointerId) update(e.clientX, e.clientY);
        }}
        onPointerUp={end}
        onPointerCancel={end}
        role="presentation"
      >
        <span
          className="absolute left-1/2 top-1/2 size-12 rounded-full border border-accent bg-accent/30"
          style={{ transform: `translate(calc(-50% + ${knob.x * 2.2}rem), calc(-50% + ${knob.y * 2.2}rem))` }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="size-14 rounded-full border border-border-strong bg-bg-elevated/70 text-xs backdrop-blur"
          onPointerDown={() => input.current?.setJump(true)}
          onPointerUp={() => input.current?.setJump(false)}
          onPointerCancel={() => input.current?.setJump(false)}
        >
          Jump
        </button>
        <button
          type="button"
          disabled={!canInteract}
          onClick={onInteract}
          className="size-14 rounded-full border border-accent bg-accent/25 text-xs backdrop-blur disabled:opacity-40"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
