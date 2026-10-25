/** Datos de negocio del oráculo (README / backend README). */
export const credentials = {
  email: 'admin@energia.local',
  password: 'admin123',
} as const

export const m109 = {
  id: 'M-109',
  search: '109',
  statusLabel: /Crítica/i,
  variation: /\+109[,.]8\s*%/,
  consumption: /2\.207[,.]6/,
  action: /Investigar/i,
  /** Hora de planta del inicio del cambio (API detected_at 14:00Z). */
  detectedPlantTime: '12/09 14:00',
  /** Lo que muestra hoy el bug en Bogotá (14:00Z − 5h). */
  detectedPlantTimeBugBogota: '12/09 09:00',
} as const
