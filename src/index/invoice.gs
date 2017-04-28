function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(malecon.Texts.invoice.menu.main)
    .addItem(malecon.Texts.invoice.menu.validate, 'checkInvoice')
    .addToUi();
}

function onEdit(event) {
  checkCategories(event.range);
  checkUsers(event.range);
  checkAccounts(event.range);
  dataFormat(event.range);
}

function checkCategories(eventRange) {
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    malecon.Config.positioning.invoice.categories,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkCategories);
}

function checkUsers(eventRange) {
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    malecon.Config.positioning.invoice.targetUserKeys,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkUsers);
}

function checkAccounts(eventRange) {
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    malecon.Config.positioning.invoice.accounts,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkAccounts);
}

function dataFormat(eventRange) {
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    malecon.Config.positioning.invoice.value,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.dataFormat);
}

function checkInvoice () {
  malecon.Invoice.checkCategories();
  malecon.Invoice.checkUsers();
  malecon.Invoice.checkAccounts();
  malecon.Invoice.dataFormat();
  malecon.Invoice.sort();
}