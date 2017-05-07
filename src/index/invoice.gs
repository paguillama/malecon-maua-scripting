function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(malecon.Texts.invoice.menu.main)
    .addItem(malecon.Texts.invoice.menu.validate, 'checkInvoice')
    .addItem(malecon.Texts.balance.menu.reconcile, 'reconcile')
    .addToUi();
}

function reconcile () {
  malecon.Reconciliation.reconcile();
}

function onEdit(event) {
  try {
    checkCategories(event.range);
    checkUsers(event.range);
    checkAccounts(event.range);
    dataFormat(event.range);
  } catch(e) {
    Browser.msgBox('Error', 'Error: ' + JSON.stringify(e), Browser.Buttons.OK);
  }
}

function checkCategories(eventRange) {
  var position = malecon.Utils.getPosition(eventRange.getSheet(), malecon.Config.positioning.invoice.categoriesColumnLabel, malecon.Config.positioning.invoice.startRow);
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    position,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkCategories);
}

function checkUsers(eventRange) {
  var position = malecon.Utils.getPosition(eventRange.getSheet(), malecon.Config.positioning.invoice.userColumnLabel, malecon.Config.positioning.invoice.startRow);
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    position,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkUsers);
}

function checkAccounts(eventRange) {
  var position = malecon.Utils.getPosition(eventRange.getSheet(), malecon.Config.positioning.invoice.accountColumnLabel, malecon.Config.positioning.invoice.startRow);
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    position,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkAccounts);
}

function dataFormat(eventRange) {
  var position = malecon.Utils.getPosition(eventRange.getSheet(), malecon.Config.positioning.invoice.valueColumnLabel, malecon.Config.positioning.invoice.startRow);
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    position,
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