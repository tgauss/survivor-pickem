let fixedTs: number | null = null;

export function now() {
  return fixedTs ?? Date.now();
}

export function setFixedNow(tsOrIso: number | string | null) {
  if (tsOrIso === null) { fixedTs = null; return; }
  fixedTs = typeof tsOrIso === 'number' ? tsOrIso : Date.parse(tsOrIso);
}