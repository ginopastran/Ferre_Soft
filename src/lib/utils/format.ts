export function formatDNI(dni: string): string {
  // Remover cualquier carácter que no sea número
  const numbers = dni.replace(/\D/g, "");

  // Formatear con puntos
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPhoneNumber(phone: string): string {
  // Eliminar todo lo que no sea número
  let numbers = phone.replace(/\D/g, "");

  // Si no hay números, retornar string vacío
  if (!numbers) return "";

  // Si empieza con 54, removerlo para evitar duplicación
  if (numbers.startsWith("54")) {
    numbers = numbers.slice(2);
  }

  // Si tiene menos de 8 dígitos, solo formatear lo que hay
  if (numbers.length < 8) {
    return `+54 ${numbers}`;
  }

  // Formatear número completo (asumiendo formato argentino)
  const areaCode = numbers.slice(0, 2);
  const firstPart = numbers.slice(2, -4);
  const lastPart = numbers.slice(-4);

  // Si no hay firstPart, solo mostrar el área y los últimos 4
  if (!firstPart) {
    return `+54 ${areaCode}-${lastPart}`;
  }

  return `+54 ${areaCode} ${firstPart}-${lastPart}`;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  // Primero removemos el símbolo de la moneda y espacios
  const cleanValue = value.replace(/[^0-9,.-]/g, "");
  // Reemplazamos la coma por punto para decimales y removemos los puntos de miles
  const normalizedValue = cleanValue.replace(/\./g, "").replace(",", ".");
  return Number(normalizedValue);
};
