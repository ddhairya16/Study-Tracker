export function formatDate(date, format) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    default: return `${month}/${day}/${year}`; // MM/DD/YYYY
  }
}

export function formatDateShort(date, format) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'long' });
  if (format === 'DD/MM/YYYY') return `${day} ${month}`;
  return `${month} ${day}`;
}

export function formatDateLong(date, format) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'long' });
  const weekday = d.toLocaleString('default', { weekday: 'long' });
  if (format === 'DD/MM/YYYY') return `${weekday}, ${day} ${month}`;
  return `${weekday}, ${month} ${day}`;
}
