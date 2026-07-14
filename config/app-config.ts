/**
 * ==============================================================================
 * CELCOM ERP PRO - CORE SYSTEM CONFIGURATION FACTORY
 * ==============================================================================
 */

export const Config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000", 10),

  // Kenyan Statutory Tax parameters
  taxes: {
    vatRate: 0.16,               // 16% standard VAT
    withholdingVatRate: 0.02,     // 2% standard WHT
    housingLevyRate: 0.015,       // 1.5% Housing Levy
    nhifRates: [
      { maxIncome: 5999, deduction: 150 },
      { maxIncome: 7999, deduction: 300 },
      { maxIncome: 11999, deduction: 400 },
      { maxIncome: 14999, deduction: 500 },
      { maxIncome: 19999, deduction: 600 },
      { maxIncome: 24999, deduction: 750 },
      { maxIncome: 29999, deduction: 850 },
      { maxIncome: 34999, deduction: 900 },
      { maxIncome: 39999, deduction: 950 },
      { maxIncome: 44999, deduction: 1000 },
      { maxIncome: Infinity, deduction: 1700 },
    ],
  },

  // File Upload configurations
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/csv",
    ],
  },

  // Security Token Expieries
  auth: {
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
};

export default Config;
