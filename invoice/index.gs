/**
 * A special function that runs when the spreadsheet is open, used to add a
 * custom menu to the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MaleconTexts.menu.main)
    .addItem(MaleconTexts.menu.invoice, 'checkInvoice')
    .addToUi();
}

function checkInvoice () {
  MaleconInvoice.checkCategories();
  MaleconInvoice.checkUsers();
  MaleconInvoice.checkAccounts();
  MaleconInvoice.dataFormat();
}