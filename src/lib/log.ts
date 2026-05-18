/*
 * Structured logging (guide §16). JSON lines — greppable, Logpush-friendly.
 * Useful once any Pages Function / build script exists; harmless until then.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  console.log(
    JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context }),
  );
}

export const log = {
  debug: (m: string, c?: Record<string, unknown>) => emit('debug', m, c),
  info: (m: string, c?: Record<string, unknown>) => emit('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => emit('error', m, c),
};
