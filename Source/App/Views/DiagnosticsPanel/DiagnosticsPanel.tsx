import { useEffect, useState } from 'preact/hooks';
import { getDiagnosticsReport } from '@/Network';

/** Hand the report over: the share sheet where the browser offers one, the clipboard where it
 * does not, and the text is on screen either way, since a paste is not always possible. */
async function share(text: string): Promise<void> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Cancelled, denied, or no clipboard permission; the textarea is the way out.
  }
}

/** A phone cannot open a console, so a join that never starts can only be read off the screen.
 * The room code sits in the address, so the report is worth a warning before it is sent. */
export function DiagnosticsPanel() {
  const [text, setText] = useState(getDiagnosticsReport);
  useEffect(() => {
    const timer = setInterval(() => setText(getDiagnosticsReport()), 1_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <details>
      <summary>Connection report</summary>
      <p>Copy this and send it if the room will not open. It contains the room code.</p>
      <button type="button" onClick={() => void share(text)}>
        Send report
      </button>
      <textarea readOnly rows={8} value={text} />
    </details>
  );
}
