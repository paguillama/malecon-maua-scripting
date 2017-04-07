/**
 * A special function that runs when the spreadsheet is open, used to add a
 * custom menu to the spreadsheet.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Migrar')
    .addItem('Comprobantes', 'migrateInvoices')
    .addToUi();
}

function migrateInvoices () {
  MaleconInvoiceMigration.migrate();
}