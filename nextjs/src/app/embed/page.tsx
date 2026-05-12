import type { Metadata } from 'next';
import EraCalculator from '@/components/EraCalculator';
import EmbedBodyMark from './EmbedBodyMark';

export const metadata: Metadata = {
  title: 'ERA Calculator (embed) — optiBPO',
  robots: { index: false, follow: false }
};

/**
 * Iframe-friendly route.
 *
 * Embed on optibpo.com (Custom HTML / WordPress block):
 *
 *   <iframe
 *     src="https://leew-cs.github.io/Optibpo-ERA-Calculator/embed/"
 *     style="width:100%;border:0;display:block"
 *     id="era-calc-frame"
 *     scrolling="no"
 *   ></iframe>
 *   <script>
 *     window.addEventListener('message', (e) => {
 *       if (e?.data?.type === 'era-calc:height') {
 *         document.getElementById('era-calc-frame').style.height = e.data.height + 'px';
 *       }
 *     });
 *   </script>
 */
export default function EmbedPage() {
  return (
    <>
      <EmbedBodyMark />
      <EraCalculator embed />
    </>
  );
}
