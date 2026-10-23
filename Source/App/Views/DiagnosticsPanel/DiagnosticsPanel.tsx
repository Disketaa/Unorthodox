import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '@/Design/Components';
import { Strings } from '@/Content';
import { getDiagnosticsReport } from '@/Network';

type CopyState = 'idle' | 'copied' | 'failed';

/** The clipboard API needs a secure context and permission; the old selection trick still works
 * where it is refused, which is the case on some mobile browsers and in-app webviews. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection copy.
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** One button, because a phone cannot open a console: the report is copied whole and pasted into
 * a message. The text is read at press time, so it is the state at the failure, not at render. */
export function CopyConnectionReport() {
  const [state, setState] = useState<CopyState>('idle');
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (reset.current !== null) clearTimeout(reset.current);
    },
    []
  );

  const onCopy = async () => {
    const copied = await copyText(getDiagnosticsReport());
    setState(copied ? 'copied' : 'failed');
    if (reset.current !== null) clearTimeout(reset.current);
    reset.current = setTimeout(() => setState('idle'), 2_000);
  };

  return (
    <Button variant="Secondary" size="Medium" onClick={() => void onCopy()}>
      {state === 'copied'
        ? Strings.diagnostics.copied
        : state === 'failed'
          ? Strings.diagnostics.failed
          : Strings.diagnostics.copy}
    </Button>
  );
}
