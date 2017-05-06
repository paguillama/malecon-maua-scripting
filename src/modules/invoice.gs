Invoice = (function () {

  function checkCategories (range) {
    var values = Utils.getValues(Config.ids.configSpreadsheet, Config.sheetNames.transactionCategories);

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      var position = Utils.getPosition(sheet, Config.positioning.invoice.categoriesColumnLabel, Config.positioning.invoice.startRow);
      rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function checkUsers(range) {
    var usersSheet = SpreadsheetApp.openById(Config.ids.usersSpreadsheet)
      .getSheetByName(Config.sheetNames.users);
    var usersPosition = Utils.getPosition(usersSheet, Config.positioning.users.keyColumnLabel, Config.positioning.users.startRow);
    var values = Utils.getValues(Config.ids.usersSpreadsheet, Config.sheetNames.users, usersPosition);

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      var position = Utils.getPosition(sheet, Config.positioning.invoice.userColumnLabel, Config.positioning.invoice.startRow);
      rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function checkAccounts(range) {
    var accountsSheet = SpreadsheetApp.openById(Config.ids.configSpreadsheet)
      .getSheetByName(Config.sheetNames.accounts);
    var accountsPosition = Utils.getPosition(accountsSheet, Config.positioning.accounts.keyColumnLabel, Config.positioning.accounts.startRow);
    var values = Utils.getValues(Config.ids.configSpreadsheet, Config.sheetNames.accounts, accountsPosition);

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      var position = Utils.getPosition(sheet, Config.positioning.invoice.accountColumnLabel, Config.positioning.invoice.startRow);
      rangeToValidate = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function dataFormat (range) {
    var rangeToFormat;
    if (range) {
      rangeToFormat = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      var position = Utils.getPosition(sheet, Config.positioning.invoice.valueColumnLabel, Config.positioning.invoice.startRow);
      rangeToFormat = sheet.getRange(position.startRow, position.startCol, sheet.getMaxRows() - position.startRow + 1, 1);
    }

    rangeToFormat.setNumberFormat(Config.formatting.decimalNumber);
  }

  function sort() {
    var startRow = Config.positioning.invoice.value.startRow;
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
    var range = sheet.getRange(startRow, 1, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns());
    range.sort(1);
  }

  return {
    checkCategories: checkCategories,
    checkAccounts: checkAccounts,
    checkUsers: checkUsers,
    dataFormat: dataFormat,
    sort: sort
  }
})();

