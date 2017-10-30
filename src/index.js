// GAS complains about ES6 modules importing with
// webpack/babel because these tools use the reserved keyword "default",
// even when the produced code is valid JS code.
// This configuration (GAS/webpack/babel) does not work exporting methods with CommonJS,
// so we have to use ES6 modules to export our modules to GAS, and CommonJS
// on the rest of the code because of the "default" keyword issue mentioned above :(

export const Reconciliation = require('./modules/reconciliation')
export const Attendance = require('./modules/attendance')
export const Texts = require('./modules/texts')
export const Invoice = require('./modules/invoice')
export const Config = require('./modules/config')
export const Utils = require('./modules/utils')
export const InvoiceMigration = require('./modules/invoice-migration')