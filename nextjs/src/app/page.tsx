import EraCalculator from '@/components/EraCalculator';

export default function Page() {
  return (
    <div className="previewWrap">
      <p className="previewNote">
        Standalone preview. To embed on optibpo.com, iframe{' '}
        <code>/Optibpo-ERA-Calculator/embed/</code> — height auto-resizes via{' '}
        <code>postMessage</code>.
      </p>
      <EraCalculator />
    </div>
  );
}
