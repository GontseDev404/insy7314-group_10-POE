export const patterns = {
    email: /.+@.+\..+/,             // accepts any valid email format
    fullName: /^.{2,}$/,            // at least 2 characters
    password: /^.{4,}$/,            // at least 4 characters
    beneficiaryName: /^.{2,}$/,     // at least 2 characters
    swift: /^[A-Za-z0-9]{4,11}$/,   // 4–11 alphanumeric
    iban: /^[A-Za-z0-9]{10,34}$/,   // typical IBAN range
    amount: /^[0-9]+(\.[0-9]{1,2})?$/, // numeric value, e.g. 100 or 100.50
    currency: /^[A-Z]{3}$/,         // e.g. ZAR, USD
    reference: /^.{0,50}$/          // optional
};
