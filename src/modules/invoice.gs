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
    var values = Utils.getValues(Config.ids.usersSpreadsheet, Config.sheetNames.users, {
      startRow: Config.positioning.invoice.sourceUserKeys.startRow,
      startCol: Config.positioning.invoice.sourceUserKeys.startCol
    });

    var startRow = Config.positioning.invoice.targetUserKeys.startRow,
      startCol = Config.positioning.invoice.targetUserKeys.startCol;

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function checkAccounts(range) {
    var values = Utils.getValues(Config.ids.configSpreadsheet, Config.sheetNames.accounts, {
      startRow: Config.positioning.accounts.keys.startRow,
      startCol: Config.positioning.accounts.keys.startCol
    });

    var startRow = Config.positioning.invoice.accounts.startRow,
      startCol = Config.positioning.invoice.accounts.startCol;

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function dataFormat (range) {

    var rangeToFormat;
    if (range) {
      rangeToFormat = range;
    } else {
      var startRow = Config.positioning.invoice.value.startRow,
        startCol = Config.positioning.invoice.value.startCol;
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.invoicesTransactions);
      rangeToFormat = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);
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

