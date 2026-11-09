export const reportRecords = Array.from({ length: 96 }, (_, i) => ({
  day: 14 - (i % 30),
  goal: i % 2 ? 'Trial' : 'Perpanjangan',
  owner: ['Alya Putri', 'Fajar Nugraha', 'Nisa Amalia'][i % 3],
  transaction: i % 11 === 0 ? `TRX-DEMO-${String(i + 1).padStart(3, '0')}` : undefined,
  stage:
    i % 11 === 0 ? 5 : i % 7 === 0 ? 4 : i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : i % 13 === 0 ? 0 : 1,
}));
