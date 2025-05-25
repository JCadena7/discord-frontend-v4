export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function intToHex(int: number): string {
  return `#${int.toString(16).padStart(6, '0')}`;
}

export function hexToInt(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
}