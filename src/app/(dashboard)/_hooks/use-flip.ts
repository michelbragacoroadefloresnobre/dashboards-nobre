import { useLayoutEffect, useRef } from "react";

/**
 * Hook FLIP (First-Last-Invert-Play) para animar reordenação de listas.
 *
 * Uso:
 *   const flipRef = useFlip();
 *   <div ref={flipRef}> ... <div data-flip-key={id}> ... </div> ... </div>
 *
 * Como funciona:
 * - useLayoutEffect roda após cada commit do React (sem deps).
 * - Compara getBoundingClientRect() atual com o armazenado do render anterior.
 * - Se houve delta Y, aplica translateY inverso via Web Animations API e anima até 0.
 * - Armazena apenas animações FLIP criadas por nós (animationsRef).
 *
 * Cuidado ao alterar:
 * - Se uma animação FLIP está "running", o elemento é PULADO (não re-medido).
 *   Isso evita que re-renders intermediários (ex: setState de celebração)
 *   matem a animação em andamento. Só após onfinish o elemento volta a ser medido.
 * - Não usar getAnimations().finish() genérico — isso mata animações CSS
 *   externas (shimmer, etc.) que coexistem nos mesmos elementos.
 */
export function useFlip<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  const animationsRef = useRef<Map<string, Animation>>(new Map());

  useLayoutEffect(() => {
    const parent = ref.current;
    if (!parent) return;

    const oldRects = rectsRef.current;
    const newRects = new Map<string, DOMRect>();

    const children =
      parent.querySelectorAll<HTMLElement>("[data-flip-key]");

    for (const child of children) {
      const key = child.getAttribute("data-flip-key")!;

      // If a FLIP animation is still running, don't interfere —
      // keep the stored target rect so the next measurement is correct.
      const prevAnim = animationsRef.current.get(key);
      if (prevAnim && prevAnim.playState === "running") {
        const storedRect = oldRects.get(key);
        if (storedRect) newRects.set(key, storedRect);
        continue;
      }

      const newRect = child.getBoundingClientRect();
      newRects.set(key, newRect);

      const oldRect = oldRects.get(key);
      if (oldRect) {
        const deltaY = oldRect.top - newRect.top;

        if (Math.abs(deltaY) > 1) {
          const anim = child.animate(
            [
              { transform: `translateY(${deltaY}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 800, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
          );
          animationsRef.current.set(key, anim);
          anim.onfinish = () => animationsRef.current.delete(key);
        }
      }
    }

    rectsRef.current = newRects;
  });

  return ref;
}
