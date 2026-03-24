/**
 * Dispara animação de celebração no elemento que conquistou o top 1.
 * Usa Web Animations API diretamente no DOM — não depende de estado React nem CSS classes.
 *
 * O elemento é localizado via `[data-flip-key="nome"]`.
 *
 * Efeitos:
 * 1. backgroundColor branco → dourado (segura ~45% da duração) → branco
 * 2. boxShadow glow dourado acompanha o background
 * 3. Shimmer sweep: div temporário com gradient desliza da esquerda pra direita
 *
 * IMPORTANTE: não usar CSS classes ou estado React para celebração.
 * CSS animations conflitam com Tailwind v4 layers, e estado React causa re-renders
 * que interferem com a animação FLIP em progresso.
 */
export function celebrateTop1(name: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-flip-key="${CSS.escape(name)}"]`,
  );
  if (!el) return;

  // Gold background glow
  el.animate(
    [
      { backgroundColor: "white", boxShadow: "0 0 0 rgba(200,150,62,0)" },
      {
        backgroundColor: "rgba(200,150,62,0.22)",
        boxShadow: "0 0 18px rgba(200,150,62,0.35)",
        offset: 0.15,
      },
      {
        backgroundColor: "rgba(200,150,62,0.22)",
        boxShadow: "0 0 18px rgba(200,150,62,0.35)",
        offset: 0.45,
      },
      { backgroundColor: "white", boxShadow: "0 0 0 rgba(200,150,62,0)" },
    ],
    { duration: 2500, easing: "ease-in-out" },
  );

  // Shimmer sweep
  const prevOverflow = el.style.overflow;
  const prevPosition = el.style.position;
  el.style.overflow = "hidden";
  el.style.position = "relative";

  const shimmer = document.createElement("div");
  shimmer.style.cssText = `
    position: absolute;
    inset: 0;
    width: 60%;
    pointer-events: none;
    border-radius: inherit;
    background: linear-gradient(110deg, transparent 0%, rgba(255,220,120,0.5) 50%, transparent 100%);
  `;
  el.appendChild(shimmer);

  const sweepAnim = shimmer.animate(
    [{ translate: "-100% 0" }, { translate: "100% 0" }],
    { duration: 1200, easing: "ease-in-out", delay: 300 },
  );

  sweepAnim.onfinish = () => {
    shimmer.remove();
    el.style.overflow = prevOverflow;
    el.style.position = prevPosition;
  };
}
