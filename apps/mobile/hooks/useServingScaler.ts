import { useState } from 'react';

export function useServingScaler(baseServings: number) {
  const [servings, setServings] = useState(baseServings);
  const scale = baseServings > 0 ? servings / baseServings : 1;

  function scaleQuantity(quantity: string): string {
    if (!quantity || quantity.trim() === '') return quantity;
    
    const parts = quantity.trim().split(' ');
    let value = 0;
    
    // Parse the string into a numeric value
    if (parts.length === 2 && parts[1].includes('/')) {
      // e.g. "1 1/2"
      const whole = parseFloat(parts[0]);
      const [num, den] = parts[1].split('/').map(Number);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        value = whole + (num / den);
      } else {
        return quantity; // Fallback
      }
    } else if (quantity.includes('/')) {
      // e.g. "1/2"
      const [num, den] = quantity.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        value = num / den;
      } else {
        return quantity; // Fallback
      }
    } else {
      // e.g. "2" or "1.5"
      value = parseFloat(quantity);
    }
    
    if (isNaN(value)) return quantity; // Fallback to original string

    const scaled = value * scale;

    // Format output
    if (Number.isInteger(scaled)) {
      return scaled.toString();
    }
    
    // Nearest simple fraction for values < 1
    if (scaled < 1) {
      const fractions = [
        { val: 1/4, str: '1/4' },
        { val: 1/3, str: '1/3' },
        { val: 1/2, str: '1/2' },
        { val: 2/3, str: '2/3' },
        { val: 3/4, str: '3/4' },
      ];
      let closest = fractions[0];
      let minDiff = Math.abs(scaled - closest.val);
      
      for (let i = 1; i < fractions.length; i++) {
        const diff = Math.abs(scaled - fractions[i].val);
        if (diff < minDiff) {
          minDiff = diff;
          closest = fractions[i];
        }
      }
      return closest.str;
    }

    // Otherwise format to 1 decimal place, stripping trailing zeros
    return parseFloat(scaled.toFixed(1)).toString();
  }

  return { servings, setServings, scale, scaleQuantity };
}
