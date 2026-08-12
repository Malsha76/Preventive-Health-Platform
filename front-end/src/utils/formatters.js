export function formatPatientId(oid) {
  try {
    if (!oid || typeof oid !== 'string' || oid.length < 8) return '';
    const tsHex = oid.slice(0, 8);
    const tsMs = parseInt(tsHex, 16) * 1000;
    const year = new Date(tsMs).getUTCFullYear();
    const seqHex = oid.slice(-6);
    const seqNum = Number.isFinite(parseInt(seqHex, 16)) ? parseInt(seqHex, 16) : 0;
    const seq = String(seqNum % 1000000).padStart(6, '0');
    return `PH-${year}-${seq}`;
  } catch {
    try {
      return `PH-${oid.slice(-6).toUpperCase()}`;
    } catch {
      return 'PH-UNKNOWN';
    }
  }
}

export function shortId(oid) {
  try {
    return (oid || '').slice(-6).toUpperCase();
  } catch {
    return '';
  }
}
