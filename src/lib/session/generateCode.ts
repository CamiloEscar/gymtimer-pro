const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

export function generateCode(): string {
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
