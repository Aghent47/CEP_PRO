// src/types/jstat.d.ts
declare module 'jstat' {
  interface JStat {
    // Estadísticos básicos
    mean(arr: number[]): number;
    median(arr: number[]): number;
    mode(arr: number[]): number;
    variance(arr: number[]): number;
    stdev(arr: number[]): number;
    sum(arr: number[]): number;
    min(arr: number[]): number;
    max(arr: number[]): number;
    range(arr: number[]): number;
    
    // Distribuciones
    normal: {
      cdf(x: number, mean?: number, std?: number): number;
      pdf(x: number, mean?: number, std?: number): number;
      inv(p: number, mean?: number, std?: number): number;
      mean(mean?: number, std?: number): number;
      mode(mean?: number, std?: number): number;
      variance(mean?: number, std?: number): number;
    };
    
    t: {
      cdf(x: number, df: number): number;
      pdf(x: number, df: number): number;
      inv(p: number, df: number): number;
      mean(df: number): number;
    };
    
    uniform: {
      cdf(x: number, a?: number, b?: number): number;
      inv(p: number, a?: number, b?: number): number;
      mean(a?: number, b?: number): number;
    };
    
    weibull: {
      cdf(x: number, shape: number, scale: number): number;
      pdf(x: number, shape: number, scale: number): number;
      inv(p: number, shape: number, scale: number): number;
    };
    
    // Funciones útiles
    sample(arr: number[], n?: number): number[];
    correlate(arr1: number[], arr2: number[]): number;
    chisquare: {
      cdf(x: number, df: number): number;
    };
  }
  
  const jStat: JStat;
  export default jStat;
}