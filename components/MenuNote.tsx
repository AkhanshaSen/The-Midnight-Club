"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { barConfig } from "@/lib/barConfig";
import styles from "./menu.module.css";

export function MenuNote({
  openerRef,
  onClose,
}: {
  openerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = openerRef.current;
    dialog?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, a, [href]")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose, openerRef]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.kicker}>{barConfig.name}</p>
        <h2 id="menu-title" className={styles.title}>
          On the menu
        </h2>
        <p className={styles.about}>{barConfig.about}</p>
        <dl className={styles.list}>
          {barConfig.menu.map((item) => (
            <div key={item.label} className={styles.row}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
