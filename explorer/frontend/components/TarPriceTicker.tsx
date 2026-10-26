"use client";

import { useEffect, useState } from "react";

interface TickerData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  source: "live" | "cache" | "loading";
}

const FALLBACK_PRICE = 0.00001176;

export default function TarPriceTicker() {
  const [ticker, setTicker] = useState<TickerData>({
    price: FALLBACK_PRICE,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    source: "loading",
  });
  const [isHovered, setIsHovered] = useState(false);

  async function fetchPrice() {
    try {
      const res = await fetch("https://api.nestex.one/cg/tickers");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const tar = data.find(
        (t: any) => t.ticker_id === "TAR_USDT" || t.base_currency === "TAR"
      );
      if (tar) {
        const price = parseFloat(tar.last_price) || FALLBACK_PRICE;
        const old = parseFloat(tar.oldltp24h) || price;
        const change = old > 0 ? ((price - old) / old) * 100 : 0;
        setTicker({
          price,
          change24h: Math.round(change * 100) / 100,
          high24h: parseFloat(tar.high) || price,
          low24h: parseFloat(tar.low) || price,
          source: "live",
        });
        localStorage.setItem("tar_price_usd", price.toString());
      }
    } catch {
      const cached = localStorage.getItem("tar_price_usd");
      if (cached) {
        const p = parseFloat(cached);
        if (!isNaN(p) && p > 0) {
          setTicker((prev) => ({ ...prev, price: p, source: "cache" }));
        }
      }
    }
  }

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  function formatPrice(p: number): string {
    if (p < 0.0001) return p.toFixed(8);
    if (p < 0.01) return p.toFixed(6);
    return p.toFixed(4);
  }

  const isUp = ticker.change24h >= 0;
  const hasChange = ticker.source === "live" && ticker.change24h !== 0;

  return (
    <a
      href="https://trade.nestex.one/spot/TAR"
      target="_blank"
      rel="noopener noreferrer"
      title="Live TAR/USDT on NestEx — Click to trade"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "14px",
        padding: "7px 20px",
        borderRadius: "9999px",
        background: "rgba(14, 16, 22, 0.94)",
        border: isHovered
          ? "1px solid rgba(247, 186, 53, 0.85)"
          : "1px solid rgba(212, 168, 67, 0.45)",
        boxShadow: isHovered
          ? "0 0 24px rgba(247, 186, 53, 0.55), inset 0 0 12px rgba(247, 186, 53, 0.12)"
          : "0 0 16px rgba(212, 168, 67, 0.32), inset 0 0 8px rgba(212, 168, 67, 0.05)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-1px) scale(1.02)" : "none",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Symbol Left Stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          lineHeight: "1.05",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "#F7BA35",
            letterSpacing: "0.08em",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          TAR
        </span>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 600,
            color: "rgba(247, 186, 53, 0.65)",
            letterSpacing: "0.08em",
            marginTop: "1px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          USDT
        </span>
      </div>

      {/* Price Value Center */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          fontFamily: "'Space Grotesk', 'Outfit', 'Inter', system-ui, sans-serif",
          fontSize: "19px",
          fontWeight: 800,
          color: "#F7BA35",
          letterSpacing: "0.04em",
          textShadow: "0 0 14px rgba(247, 186, 53, 0.35)",
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: 700, opacity: 0.9 }}>$</span>
        <span>{formatPrice(ticker.price)}</span>
      </div>

      {/* 24h Pill Right */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "7px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "11px",
          fontWeight: 600,
          color: hasChange ? (isUp ? "#34d399" : "#f87171") : "#8E929B",
          lineHeight: "1",
        }}
      >
        {hasChange ? (
          <span>
            {isUp ? "+" : ""}
            {ticker.change24h.toFixed(1)}%
          </span>
        ) : (
          <span>—</span>
        )}
        <span style={{ fontSize: "9px", opacity: 0.65, color: "#9ca3af" }}>24H</span>
      </div>
    </a>
  );
}
