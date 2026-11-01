/** Minúsculas y sin tildes, para búsquedas insensibles a acentos ("trigonometria" encuentra "Trigonometría"). */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
