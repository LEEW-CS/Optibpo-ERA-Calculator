'use client';

import { useEffect } from 'react';

/**
 * Sets data-mode="embed" on <body> when this route is mounted.
 * The matching CSS strips body chrome (background, margin) so the iframe
 * sits flush on the host page.
 */
export default function EmbedBodyMark() {
  useEffect(() => {
    document.body.dataset.mode = 'embed';
    return () => {
      delete document.body.dataset.mode;
    };
  }, []);
  return null;
}
