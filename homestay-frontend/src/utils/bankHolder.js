/** Bỏ dấu tiếng Việt + viết HOA (chuẩn tên trên sao kê ngân hàng) */
export function toBankAccountHolderName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';

  return fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
