import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, setLogLevel, setLogWriter, type LogLevel } from './Logger';

type LogRecord = { level: LogLevel; scope: string; message: string };

describe('Logger', () => {
  const records: LogRecord[] = [];

  beforeEach(() => {
    records.length = 0;
    setLogLevel('info');
    setLogWriter((level, scope, message) => records.push({ level, scope, message }));
  });

  it('drops debug records at the default level', () => {
    const log = createLogger('Test');
    log('debug', 'quiet');
    log('info', 'loud');
    expect(records.map((record) => record.message)).toEqual(['loud']);
  });

  it('emits debug records once the level is lowered', () => {
    setLogLevel('debug');
    const log = createLogger('Test');
    log('debug', 'now visible');
    expect(records.map((record) => record.message)).toEqual(['now visible']);
  });

  it('suppresses everything below the threshold, keeping order', () => {
    setLogLevel('warn');
    const log = createLogger('Test');
    log('debug', 'a');
    log('info', 'b');
    log('warn', 'c');
    log('error', 'd');
    expect(records.map((record) => record.message)).toEqual(['c', 'd']);
  });

  it('prefixes records with the logger scope', () => {
    const log = createLogger('MyScope');
    log('info', 'hello');
    expect(records[0].scope).toBe('MyScope');
  });
});
