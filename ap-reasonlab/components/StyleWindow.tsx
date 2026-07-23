"use client";

import { useEffect, useState } from "react";
import { useSiteTheme, type SiteTheme } from "@/components/ThemeProvider";

const styles: Array<{
  id: SiteTheme;
  name: string;
  blurb: string;
}> = [
  {
    id: "ap",
    name: "AP Classic",
    blurb: "Clean academic blue — the original study look.",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Red",
    blurb: "Dark chrome with red box frames — neon control deck.",
  },
];

/**
 * Floating window frame: click a style tile to restyle the whole site.
 */
export default function StyleWindow() {
  const { theme, setTheme } = useSiteTheme();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="style-window-launcher"
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        title="Change page style"
        aria-label="Open style window"
      >
        <span className="style-window-launcher-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        Style
      </button>

      {open && (
        <div
          className="style-window-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className={`style-window ${minimized ? "style-window--min" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="style-window-title"
          >
            <header className="style-window-titlebar">
              <div className="style-window-traffic" aria-hidden>
                <button
                  type="button"
                  className="sw-dot sw-dot-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close style window"
                />
                <button
                  type="button"
                  className="sw-dot sw-dot-min"
                  onClick={() => setMinimized((value) => !value)}
                  aria-label={minimized ? "Expand style window" : "Minimize style window"}
                />
                <span className="sw-dot sw-dot-max" />
              </div>
              <h2 id="style-window-title" className="style-window-heading">
                Style window
              </h2>
              <button type="button" className="style-window-close-text" onClick={() => setOpen(false)}>
                Esc
              </button>
            </header>

            {!minimized && (
              <div className="style-window-body">
                <p className="style-window-lead">
                  Keep AP Classic, or switch to Cyberpunk Red box decoration. Choice is saved in this
                  browser.
                </p>
                <div className="style-window-grid">
                  {styles.map((item) => {
                    const active = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`style-tile style-tile--${item.id} ${active ? "is-active" : ""}`}
                        onClick={() => setTheme(item.id)}
                        aria-pressed={active}
                      >
                        <span className="style-tile-preview" aria-hidden />
                        <span className="style-tile-name">{item.name}</span>
                        <span className="style-tile-blurb">{item.blurb}</span>
                        {active && <span className="style-tile-badge">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
