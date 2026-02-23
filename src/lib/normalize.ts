export const normalizePhone = (phone:any) => {
  if (!phone) return null;

  let clean = phone.toString().replace(/\D/g, "");

  // Remove India country code
  if (clean.startsWith("91") && clean.length === 12) {
    clean = clean.slice(2);
  }

  return clean;
};