"use client";

import { useState } from "react";

import { useLang } from "@/components/lang-provider";
import { NODE_POSITIONS } from "@/lib/i18n";

const core = NODE_POSITIONS[0];

export function AvionicsMap() {
  const { t } = useLang();
  const [active, setActive] = useState<number | null>(null);

  const nodes = t.avionics.nodes.map((node, index) => ({
    ...node,
    ...NODE_POSITIONS[index],
  }));

  const read = active === null ? null : nodes[active];

  return (
    <>
      <div className="av-nodes">
        <svg
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {nodes.slice(1).map((node, index) => {
            const i = index + 1;
            const lit = active === i || active === 0;
            return (
              <line
                key={node.name}
                x1={`${core.x}%`}
                y1={`${core.y}%`}
                x2={`${node.x}%`}
                y2={`${node.y}%`}
                stroke={
                  active === null
                    ? "rgba(245,194,75,.22)"
                    : lit
                      ? "rgba(245,194,75,.9)"
                      : "rgba(245,194,75,.08)"
                }
                strokeWidth={lit ? 1.6 : 1}
              />
            );
          })}
        </svg>

        {nodes.map((node, index) => (
          <button
            key={node.name}
            type="button"
            className={`node${node.core ? " core" : ""}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(index)}
            aria-describedby="av-read"
          >
            <i className="dot" aria-hidden />
            <label>{node.name}</label>
          </button>
        ))}
      </div>

      <p id="av-read" aria-live="polite">
        {read ? (
          <>
            <b>{read.name}</b> — {read.read}
          </>
        ) : (
          t.avionics.defaultRead
        )}
      </p>
    </>
  );
}
