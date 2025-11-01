"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CardData = {
  id: number;
  pairId: number;
  symbol: string;
  matched: boolean;
};

const EMOJIS = [
  "🍎","🍌","🍊","🍇","🍉","🍓","🍒","🍍","🥝","🥑",
  "🌶️","🥕","🍄","🧀","🥨","🍪","🍰","🍩","🍫","🍿",
  "🐶","🐱","🐼","🦊","🐸","🐵","🦄","🐢","🐙","🦋",
  "⚽","🏀","🏈","⚾","🎾","🏐","🎱","🥏","🏓","🥊",
  "🚗","🚕","🚙","🛵","🚀","✈️","🚁","🛸","🚤","⛵"
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function computeCols(count: number) {
  if (count <= 16) return 4;
  if (count === 20) return 5;
  if (count === 24) return 6;
  if (count === 28) return 7;
  return 8;
}
const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

export default function MemoryGame() {
  const [totalCards, setTotalCards] = useState(16);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [lock, setLock] = useState(false);

  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const timerRef = useRef<number | null>(null);
  const cols = useMemo(() => computeCols(totalCards), [totalCards]);

  const newDeck = (count: number) => {
    const pairs = count / 2;
    const chosen = shuffle(EMOJIS).slice(0, pairs);
    let id = 0;
    const d: CardData[] = [];
    chosen.forEach((symbol, idx) => {
      d.push({ id: id++, pairId: idx, symbol, matched: false });
      d.push({ id: id++, pairId: idx, symbol, matched: false });
    });
    return shuffle(d);
  };

  const resetGame = (count = totalCards) => {
    setDeck(newDeck(count));
    setFirst(null);
    setSecond(null);
    setLock(false);
    setMoves(0);
    setMatchedPairs(0);
    setElapsed(0);
    setRunning(false);
    setShowWin(false);
  };

  useEffect(() => { resetGame(totalCards); }, [totalCards]);
  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; return; }
    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => setElapsed(s => s + 1), 1000) as unknown as number;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  }, [running]);
  useEffect(() => {
    if (matchedPairs === totalCards / 2 && totalCards > 0) { setRunning(false); setShowWin(true); }
  }, [matchedPairs, totalCards]);

  const onFlip = (idx: number) => {
    if (lock || deck[idx].matched) return;
    if (!running && moves === 0 && first === null && elapsed === 0) setRunning(true);
    if (first === idx) return;

    if (first === null) { setFirst(idx); return; }
    if (second === null) {
      setSecond(idx);
      setMoves(m => m + 1);
      const a = deck[first]; const b = deck[idx];
      if (a.pairId === b.pairId) {
        const updated = deck.slice();
        updated[first] = { ...a, matched: true };
        updated[idx] = { ...b, matched: true };
        setDeck(updated);
        setFirst(null); setSecond(null);
        setMatchedPairs(p => p + 1);
      } else {
        setLock(true);
        setTimeout(() => { setFirst(null); setSecond(null); setLock(false); }, 700);
      }
    }
  };

  const styles = {
    panel: { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, alignItems: "center", marginBottom: 16 } as const,
    chip: { background: "#171a36", border: "1px solid #2a2e63", padding: "8px 10px", borderRadius: 14, display: "flex", gap: 8, alignItems: "center" },
    h1: { margin: 0, fontWeight: 800, letterSpacing: 0.3 } as const,
    hud: { display: "flex", gap: 12, background: "#171a36", border: "1px solid #2a2e63", padding: "8px 12px", borderRadius: 14 },
    statLabel: { color: "#b8baf0" }, statVal: { color: "#f5f6ff", fontWeight: 700 },
    selectBtn: { background: "#222656", color: "#f5f6ff", border: "1px solid #363c7a", borderRadius: 10, padding: "8px 10px", fontSize: 14, cursor: "pointer" },
    board: { display: "grid", gap: 12, background: "linear-gradient(180deg, rgba(124,137,255,0.08), rgba(0,0,0,0))", border: "1px solid #2a2e63", padding: 14, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", minHeight: 420, gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))` } as const,
    card: { position: "relative" as const, aspectRatio: "3 / 4", perspective: "800px", borderRadius: 14 },
    buttonBase: (flipped: boolean, matched: boolean) => ({ all: "unset", display: "block", width: "100%", height: "100%", borderRadius: 14, cursor: matched ? "default" : "pointer", transformStyle: "preserve-3d", transition: "transform 400ms ease", transform: flipped ? "rotateY(180deg)" : "none" }) as const,
    face: { position: "absolute" as const, inset: 0, backfaceVisibility: "hidden" as const, borderRadius: 14, display: "grid", placeItems: "center", fontSize: "clamp(22px, 5.2vw, 42px)", border: "1px solid #3a418d" },
    front: { background: "linear-gradient(160deg, #2a2f6c, #1f2353)" },
    back: (matched: boolean) => ({ background: "linear-gradient(160deg, #4250ff, #5062ff)", color: "white", transform: "rotateY(180deg)", boxShadow: matched ? "0 0 0 2px #7c89ff, 0 12px 30px rgba(124,137,255,0.35)" : undefined }) as const,
    modalBackdrop: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 50 },
    modal: { background: "#171a36", color: "#f5f6ff", border: "1px solid #2a2e63", borderRadius: 14, padding: 24, width: "min(460px, 92vw)" },
    actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  };

  const isFlipped = (i: number) => deck[i].matched || i === first || i === second;

  return (
    <div>
      <header style={styles.panel}>
        <h1 style={styles.h1}>🧠 Memory Game</h1>

        <div style={styles.chip}>
          <label htmlFor="cardsCount">Cărți:</label>
          <select id="cardsCount" value={totalCards} onChange={(e) => setTotalCards(Number(e.target.value))} style={styles.selectBtn}>
            {[16,20,24,28,32].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button style={styles.selectBtn} onClick={() => resetGame(totalCards)}>Joc nou</button>
        </div>

        <div style={styles.hud}>
          <div><span style={styles.statLabel}>Timp: </span><strong style={styles.statVal}>{fmtTime(elapsed)}</strong></div>
          <div><span style={styles.statLabel}>Mutări: </span><strong style={styles.statVal}>{moves}</strong></div>
          <div><span style={styles.statLabel}>Perechi: </span><strong style={styles.statVal}>{matchedPairs}</strong></div>
        </div>
      </header>

      <section role="grid" aria-live="polite" style={styles.board} aria-rowcount={Math.ceil(deck.length / cols)} aria-colcount={cols}>
        {deck.map((card, idx) => {
          const flipped = isFlipped(idx);
          return (
            <div key={card.id} role="gridcell" aria-label={`Carte ${idx + 1}`} onClick={() => onFlip(idx)} style={styles.card}>
              <button aria-pressed={flipped ? "true" : "false"} disabled={card.matched} style={styles.buttonBase(flipped, card.matched)}>
                <div style={{ ...styles.face, ...styles.front }}>❓</div>
                <div style={{ ...styles.face, ...styles.back(card.matched) }}>{card.symbol}</div>
              </button>
            </div>
          );
        })}
      </section>

      {showWin && (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <h2>🎉 Bravo!</h2>
            <p>Ai potrivit toate cele {totalCards / 2} perechi în <strong>{fmtTime(elapsed)}</strong> și <strong>{moves}</strong> mutări.</p>
            <div style={styles.actions}>
              <button style={styles.selectBtn} onClick={() => { setShowWin(false); resetGame(totalCards); }}>
                Joacă din nou
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
