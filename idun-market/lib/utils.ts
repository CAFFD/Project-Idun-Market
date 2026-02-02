export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})/, '($1) ')
      .replace(/(\d{5})(\d{4})/, '$1-$2');
  }
  return value.slice(0, 15); // Limit length
};

export const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{5})(\d{3})/, '$1-$2')
    .slice(0, 9);
};
