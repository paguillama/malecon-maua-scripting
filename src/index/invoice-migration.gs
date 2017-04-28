function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu(malecon.Texts.invoiceMigration.menu.main)
    .addItem(malecon.Texts.invoiceMigration.menu.migrate, 'migrateInvoices')
    .addToUi();
}

function migrateInvoices () {
  malecon.InvoiceMigration.migrate();
}