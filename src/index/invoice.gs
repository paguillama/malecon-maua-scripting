function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(malecon.Texts.invoice.menu.main)
    .addItem(malecon.Texts.invoice.menu.validate, 'checkInvoice')
    .addItem(malecon.Texts.invoice.menu.reconcile, 'reconcile')
    .addToUi();
}

function reconcile () {
  malecon.Reconciliation.reconcile();
}

function onEdit(event) {
  try {
    checkCategories(event.range);
    checkSkipReconcile(event.range);
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

function checkSkipReconcile(eventRange) {
  var position = malecon.Utils.getPosition(eventRange.getSheet(), malecon.Config.positioning.invoice.skipReconcileColumnLabel, malecon.Config.positioning.invoice.startRow);
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    position,
    malecon.Config.sheetNames.invoicesTransactions,
    malecon.Invoice.checkSkipReconcile);
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
  malecon.Invoice.checkSkipReconcile();
  malecon.Invoice.checkUsers();
  malecon.Invoice.checkAccounts();
  malecon.Invoice.dataFormat();
  malecon.Invoice.sort();
}