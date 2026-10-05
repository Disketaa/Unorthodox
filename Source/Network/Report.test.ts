// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { fold, getDiagnosticsReport, reportLine } from './Report';

/** Fold a line into the report the way a poll tick does, and hand back the text it settled as. */
function put(body: string, stamp = '00:00:00.000'): boolean {
  return fold(stamp, body);
}

describe('folding repeated report lines', () => {
  it('reports a new line once, and only says it was new once', () => {
    expect(put('info relays open 7/7')).toBe(true);
    expect(put('info relays open 7/7')).toBe(false);
    expect(put('info relays open 7/7')).toBe(false);
  });

  it('counts a repeat onto the line already there rather than adding another', () => {
    // The whole reason for the fold: a minute of polling is one line saying the same thing
    // twenty times, and a phone report is read by pasting it into a chat.
    put('info no peers discovered yet');
    put('info no peers discovered yet');
    const lines = getDiagnosticsReport().split('\n');
    expect(lines.filter(line => line.includes('no peers discovered yet'))).toHaveLength(1);
  });

  it('says how many times the line has been seen', () => {
    put('info peers found');
    put('info peers found');
    put('info peers found');
    expect(getDiagnosticsReport()).toContain('info peers found x3');
  });

  it('keeps the newest stamp, so the line says how long it has held', () => {
    put('info steady', '00:00:00.000');
    put('info steady', '00:00:03.000');
    expect(getDiagnosticsReport()).toContain('00:00:03.000 info steady x2');
  });

  it('counts a repeat without a stamp collision, which the stamp alone would cause', () => {
    // Two ticks a second apart produce different timestamps, so folding on the stamped line
    // would never notice the repeat. The fold is on the text alone for that reason.
    put('info polled');
    put('info polled', '00:00:03.000');
    put('info polled', '00:00:06.000');
    expect(getDiagnosticsReport()).toContain('x3');
  });
});

describe('what one line stands for', () => {
  it('counts a repeat as one entry with a count, not as several lines', () => {
    // `x3` reads as three occurrences. A folded line has one entry with a count, which is what
    // makes the report readable at a glance: the number is the evidence, not the line count.
    put('info repeated');
    const before = getDiagnosticsReport().split('\n').filter(line => line.includes('repeated'));
    put('info repeated');
    const after = getDiagnosticsReport().split('\n').filter(line => line.includes('repeated'));
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(after[0]).toContain('x2');
  });

  it('keeps two different lines apart, since the count is per line', () => {
    put('info first');
    put('info second');
    const report = getDiagnosticsReport();
    expect(report).toContain('00:00:00.000 info first');
    expect(report).toContain('00:00:00.000 info second');
    expect(report).not.toContain('first x2');
    expect(report).not.toContain('second x2');
  });
});

describe('the report a phone hands over', () => {
  it('carries the agent and the address above the lines', () => {
    expect(getDiagnosticsReport().startsWith('agent ')).toBe(true);
    expect(getDiagnosticsReport()).toContain('href ');
  });

  it('splits one value as text without throwing on something unserialisable', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => reportLine('info', 'cycle', [circular])).not.toThrow();
  });

  it('writes a value that is not a string as JSON, so a table stays readable', () => {
    expect(reportLine('info', 'peers', [{ 'peer-1': 'conn=new' }]).body).toBe(
      'info peers {"peer-1":"conn=new"}',
    );
  });
});
