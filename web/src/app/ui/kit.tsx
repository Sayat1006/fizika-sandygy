/* Негізгі компоненттер: хабар, парақша, сегмент, құпиясөз өрісі */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { IcClose, IcEye } from './icons';

/* ───────── хабар (toast) ───────── */
const ToastCtx = createContext<(text: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const [on, setOn] = useState(false);
  const t = useRef(0);
  const show = useCallback((s: string) => {
    setText(s); setOn(true);
    clearTimeout(t.current); t.current = window.setTimeout(() => setOn(false), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={`toast${on ? ' toast--on' : ''}`} role="status" aria-live="polite">{text}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ───────── парақша (dialog) ───────── */
export function Sheet({ open, onClose, title, sub, wide, foot, children, label }: {
  open: boolean; onClose: () => void; title?: ReactNode; sub?: ReactNode; wide?: boolean; foot?: ReactNode; children: ReactNode; label?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`sheet${wide ? ' sheet--wide' : ''}`}
      aria-label={label || (typeof title === 'string' ? title : undefined)}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <>
          <div className="sheet__head">
            <div style={{ flex: 1, minWidth: 0 }}>
              {sub && <div className="t-small" style={{ fontWeight: 600 }}>{sub}</div>}
              {title && <h2>{title}</h2>}
            </div>
            <button className="icon-btn" type="button" onClick={onClose} aria-label="Жабу"><IcClose /></button>
          </div>
          {children}
          {foot && <div className="sheet__foot">{foot}</div>}
        </>
      )}
    </dialog>
  );
}

/* ───────── сегмент: таңдалған батырманың астымен бегунок сырғиды ───────── */
export function Segmented<T extends string | number>({ items, value, onChange, label, large }: {
  items: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; large?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const measure = () => {
      const el = box.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure); if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [value, items.length]);
  useEffect(() => { first.current = false; }, []);
  return (
    <div className={`seg${large ? ' seg--lg' : ''}`} role="group" aria-label={label} ref={box}>
      {thumb && <span className="seg__thumb" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)`, transition: first.current ? 'none' : undefined }} />}
      {items.map((it) => (
        <button key={String(it.value)} type="button" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>{it.label}</button>
      ))}
    </div>
  );
}

/* ───────── құпиясөз өрісі (көрсету / жасыру) ───────── */
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} className="input" type={show ? 'text' : 'password'} />
      <button type="button" aria-pressed={show} aria-label={show ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'} onClick={() => setShow(!show)}><IcEye /></button>
    </div>
  );
}

export function Note({ kind = 'err', children }: { kind?: 'err' | 'ok' | 'info'; children: ReactNode }) {
  if (!children) return null;
  return <div className={`note note--${kind}`} role={kind === 'err' ? 'alert' : 'status'}>{children}</div>;
}
