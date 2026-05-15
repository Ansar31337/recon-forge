export function cidrExpand(cidr: string): string[] {
  const [range, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits) || bits < 24 || bits > 32) return [range];

  const ipToInt = (ip: string) =>
    ip
      .split(".")
      .reduce((res, octet) => (res << 8) + parseInt(octet, 10), 0) >>> 0;
  const intToIp = (int: number) =>
    [
      (int >>> 24) & 0xff,
      (int >>> 16) & 0xff,
      (int >>> 8) & 0xff,
      int & 0xff,
    ].join(".");

  const start = ipToInt(range) & (0xffffffff << (32 - bits));
  const numIps = Math.pow(2, 32 - bits);

  const out: string[] = [];
  for (let i = 0; i < numIps; i++) {
    out.push(intToIp(start + i));
  }
  return out;
}
