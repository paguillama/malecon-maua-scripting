// GAS complains about ES6 modules importing with
// webpack/babel because these tools use the reserved keyword "default",
// even when the produced code is valid JS code.
// This configuration (GAS/webpack/babel) does not work exporting methods with CommonJS,
// so we have to use ES6 modules to export our modules to GAS, and CommonJS
// on the rest of the code because of the "default" keyword issue mentioned above :(

export const Reconciliation = require('./services/reconciliation')
export const Attendance = require('./services/attendance')
export const Texts = require('./services/texts')
export const Invoice = require('./services/invoice')
export const Config = require('./services/config')
export const Utils = require('./services/utils')
export const Mail = require('./services/mail')
export const InvoiceMigration = require('./services/invoice-migration')