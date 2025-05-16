export function formatDNI(dni: string): string {
  // Si es un CUIT/CUIL (generalmente tiene 11 dígitos con guiones)
  if (dni.includes("-") || dni.length >= 10) {
    // Primero eliminar todos los caracteres no numéricos
    const numbers = dni.replace(/\D/g, "");

    // Si tiene al menos 10 dígitos (CUIT/CUIL válido), formatear como XX-XX.XXX.XXX-X
    if (numbers.length >= 10) {
      const firstPart = numbers.slice(0, 2);
      const middlePartRaw = numbers.slice(2, -1);

      // Formatear la parte central con puntos como separadores de miles
      const middlePart = middlePartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      const lastDigit = numbers.slice(-1);
      return `${firstPart}-${middlePart}-${lastDigit}`;
    }
  }

  // Si no es un CUIT/CUIL o no tiene suficientes dígitos, formatear como DNI con puntos
  const numbers = dni.replace(/\D/g, "");
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPhoneNumber(phone: string): string {
  // Eliminar todo lo que no sea número
  let numbers = phone.replace(/\D/g, "");

  // Si no hay números, retornar string vacío
  if (!numbers) return "";

  // Si empieza con 54, asegurarse de que sea el prefijo del país
  if (numbers.startsWith("54")) {
    // Si después del 54 no viene un 9, hay que agregarlo para formato internacional
    if (numbers.length > 2 && !numbers.charAt(2).startsWith("9")) {
      numbers = "54" + "9" + numbers.slice(2);
    }
  } else {
    // Si no empieza con 54, agregar el prefijo de Argentina
    numbers = "54" + "9" + numbers;
  }

  // Formatear según estándar internacional para Argentina: +54 9 [código área] [número]
  // Formato: +54 9 XXX XXXX-XXXX
  if (numbers.length >= 13) {
    // +54 9 + código de área (2 o 3 dígitos) + número (8 o 7 dígitos)
    const countryCode = numbers.slice(0, 2);
    const prefix = numbers.slice(2, 3); // El 9 después del código de país

    // Determinar si el código de área es de 2 o 3 dígitos
    // En Argentina, CABA (Buenos Aires) tiene código 11 (2 dígitos)
    // Otras provincias tienen códigos de 3 dígitos
    let areaCode, firstPart, lastPart;

    if (["11", "15"].includes(numbers.slice(3, 5))) {
      // Códigos de área de 2 dígitos (CABA - Buenos Aires)
      areaCode = numbers.slice(3, 5);

      // El resto del número se divide en dos partes
      const restOfNumber = numbers.slice(5);
      firstPart = restOfNumber.slice(0, -4);
      lastPart = restOfNumber.slice(-4);
    } else {
      // Códigos de área de 3 dígitos (resto del país)
      areaCode = numbers.slice(3, 6);

      // El resto del número se divide en dos partes
      const restOfNumber = numbers.slice(6);
      firstPart = restOfNumber.slice(0, -4);
      lastPart = restOfNumber.slice(-4);
    }

    return `+${countryCode} ${prefix} ${areaCode} ${firstPart}-${lastPart}`;
  }

  // Si no tiene suficientes dígitos, formatear de manera simplificada
  else if (numbers.length > 5) {
    const countryCode = numbers.slice(0, 2);
    const rest = numbers.slice(2);
    return `+${countryCode} ${rest}`;
  }

  // Si es muy corto, devolver tal cual con formato internacional
  else {
    return `+${numbers}`;
  }
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
