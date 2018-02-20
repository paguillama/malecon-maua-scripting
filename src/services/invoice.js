var config = require('./config')
var utils = require('./utils')

function checkCategories (range) {
  var values = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.transactionCategories, {
    startRow: 2
  });

  var rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.categoriesColumnLabel, config.positioning.invoice.startRow);
    rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function checkSkipReconcile (range) {
  var values = [['Sí'], ['No']];

  var rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.skipReconcileColumnLabel, config.positioning.invoice.startRow);
    rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function checkUsers(range) {
  var usersSheet = SpreadsheetApp.openById(config.ids.usersSpreadsheet)
    .getSheetByName(config.sheetNames.users);
  var usersPosition = utils.getPosition(usersSheet, config.positioning.users.keyColumnLabel, config.positioning.users.startRow);
  var values = utils.getValues(config.ids.usersSpreadsheet, config.sheetNames.users, usersPosition);

  var rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.userColumnLabel, config.positioning.invoice.startRow);
    rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function checkAccounts(range) {
  var accountsSheet = SpreadsheetApp.openById(config.ids.configSpreadsheet)
    .getSheetByName(config.sheetNames.accounts);
  var accountsPosition = utils.getPosition(accountsSheet, config.positioning.accounts.keyColumnLabel, config.positioning.accounts.startRow);
  var values = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.accounts, accountsPosition);

  var rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.accountColumnLabel, config.positioning.invoice.startRow);
    rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function formatValue(range) {
  var rangeToFormat;
  if (range) {
    rangeToFormat = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.valueColumnLabel, config.positioning.invoice.startRow);
    rangeToFormat = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  rangeToFormat.setNumberFormat(config.formatting.decimalNumber);
}

function formatDate(range) {
  var rangeToFormat;
  if (range) {
    rangeToFormat = range;
  } else {
    var sheet = SpreadsheetApp.openById(config.ids.invoices)
      .getSheetByName(config.sheetNames.invoicesTransactions);
    var position = utils.getPosition(sheet, config.positioning.invoice.dateColumnLabel, config.positioning.invoice.startRow);
    rangeToFormat = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
  }

  rangeToFormat.setNumberFormat(config.formatting.date);
}

function sort() {
  var startRow = config.positioning.invoice.startRow;
  var sheet = SpreadsheetApp.openById(config.ids.invoices)
    .getSheetByName(config.sheetNames.invoicesTransactions);
  var range = sheet.getRange(startRow, 1, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns());
  range.sort(1);
}

module.exports = {
  checkCategories: checkCategories,
  checkSkipReconcile: checkSkipReconcile,
  checkAccounts: checkAccounts,
  checkUsers: checkUsers,
  formatValue: formatValue,
  formatDate: formatDate,
  sort: sort
}
