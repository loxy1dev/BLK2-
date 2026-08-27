 "use client";

import { useEffect, useState } from "react";

type Generation = { file: string; links: string[]; preview: string };

export default function Home() {
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = Number(localStorage.getItem("txt-generation-count") || "0");
    setCount(saved);
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de générer.");
      const next = count + 1;
      setCount(next);
      localStorage.setItem("txt-generation-count", String(next));
      setGeneration(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <nav className="nav">
        <div className="brand"><span className="brandMark">T</span><span>TXT<span className="muted">VAULT</span></span></div>
        <div className="navStatus"><span className="dot" /> STOCK PUBLIC</div>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span /> PREMIUM TXT GENERATOR</div>
        <h1>Votre stock.<br /><em>Instantanément.</em></h1>
        <p className="heroText">
          Une interface premium pour parcourir et générer des liens vers les fichiers TXT de votre stock public.
        </p>

        <button className="generate" onClick={generate} disabled={loading}>
          <span className="play">{loading ? "…" : "✦"}</span>
          <span>{loading ? "GÉNÉRATION EN COURS" : "GÉNÉRER MAINTENANT"}</span>
          <span className="arrow">→</span>
        </button>

        <div className="trust">
          <span>●</span> PUBLIC · RAPIDE · SIMPLE
        </div>
      </section>

      <section className="stats">
        <div><strong>{String(count).padStart(2, "0")}</strong><span>GÉNÉRATIONS</span></div>
        <div><strong>2</strong><span>LIENS / GÉNÉRATION</span></div>
        <div><strong>TXT</strong><span>FORMAT DU STOCK</span></div>
      </section>

      {error && <div className="error">{error}</div>}

      {generation && (
        <section className="result">
          <div className="resultHead">
            <div>
              <div className="eyebrow small"><span /> NOUVELLE GÉNÉRATION</div>
              <h2>{generation.file}</h2>
            </div>
            <div className="ready">READY</div>
          </div>

          <div className="linkGrid">
            {generation.links.map((link, i) => (
              <a className="linkCard" href={link} target="_blank" rel="noreferrer" key={link}>
                <span className="linkIcon">{i === 0 ? "↗" : "↗"}</span>
                <span><small>LIEN {i + 1}</small><b>Ouvrir le fichier</b></span>
                <span className="cardArrow">→</span>
              </a>
            ))}
          </div>

          <div className="preview">
            <div className="previewBar"><span>APERÇU DU FICHIER</span><span>{generation.file}</span></div>
            <iframe src={generation.preview} title="Aperçu TXT" />
          </div>
        </section>
      )}

      <footer>TXT VAULT <span>•</span> PUBLIC STOCK VIEWER</footer>
    </main>
  );
}
