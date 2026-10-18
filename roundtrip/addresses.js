/**
 * Where the round trip's own stack listens. Not the development ports (5173 for the Page,
 * 8787 for the Worker, 4173 for `npm run preview`), so it runs beside `npm run dev`.
 */
export const PAGE_URL = 'http://localhost:4183'
export const WORKER_URL = 'http://localhost:8797'
