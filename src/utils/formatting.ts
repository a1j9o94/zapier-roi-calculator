/**
 * Format a number as currency (e.g., $1,234,567)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as compact currency (e.g., $1.2M, $500K)
 */
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format a number as compact (e.g., 1.2M, 500K)
 */
export function formatNumberCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return formatNumber(value);
}

/**
 * Format a decimal as percentage (e.g., 0.15 → "15%")
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Format a decimal as percentage with one decimal (e.g., 0.155 → "15.5%")
 */
export function formatPercentPrecise(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a number as a multiplier (e.g., 20.2x)
 */
export function formatMultiple(value: number): string {
  return `${value.toFixed(1)}x`;
}

/**
 * Format hours (e.g., 340 → "340 hrs")
 */
export function formatHours(value: number): string {
  if (value >= 1000) {
    return `${formatNumber(Math.round(value))} hrs`;
  }
  return `${Math.round(value)} hrs`;
}

/**
 * Format a date timestamp as a readable string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date timestamp as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(timestamp);
}

/**
 * Parse a currency string back to number (e.g., "$1,234" → 1234)
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[$,]/g, "")) || 0;
}

/**
 * Parse a percentage string back to decimal (e.g., "15%" → 0.15)
 */
export function parsePercent(value: string): number {
  return (parseFloat(value.replace(/%/g, "")) || 0) / 100;
}
