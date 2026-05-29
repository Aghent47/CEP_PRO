// Test simple para verificar que p-valor cambia con W
// Ejecutar con: node test_pvalue.js

import jStat from 'jstat';

// Función normalCDF (copiada del código original)
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// Función para calcular p-valor usando Royston (1992)
function calculatePValueFromW(W, n) {
  let pValue = 0.5;
  
  if (n >= 4 && n <= 2000) {
    // CRÍTICO: log(1 - W) debe ser diferente para cada W
    const y = Math.log(1 - W);
    console.log(`  W=${W.toFixed(6)}, (1-W)=${(1-W).toFixed(6)}, log(1-W)=${y.toFixed(6)}`);
    
    let mu = 0;
    let sigma = 0;
    
    if (n <= 50) {
      mu = -1.2725 + 0.4598 * Math.log(n);
      sigma = 0.8814 - 0.0882 * Math.log(n);
    } else {
      mu = -0.9532 + 0.4733 * Math.log(n);
      sigma = 0.7385 - 0.0599 * Math.log(n);
    }
    
    const z = (y - mu) / sigma;
    pValue = 1 - normalCDF(z);
  }
  
  return pValue;
}

console.log('═══════════════════════════════════════════════════════════');
console.log('TEST: Verificar que p-valor varía con W (tamaño muestra: 20)');
console.log('═══════════════════════════════════════════════════════════\n');

const n = 20;
const wValues = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95];

console.log(`Muestra n=${n}\n`);
wValues.forEach(W => {
  const pValue = calculatePValueFromW(W, n);
  console.log(`➜ W=${W.toFixed(4)} → p-valor=${pValue.toFixed(6)}`);
});

console.log('\n───────────────────────────────────────────────────────────');
console.log('✓ Si p-valores son DIFERENTES para cada W → CORRECTO');
console.log('✗ Si p-valores son TODOS IGUALES (ej: 0.9999) → HAY ERROR');
console.log('───────────────────────────────────────────────────────────\n');
