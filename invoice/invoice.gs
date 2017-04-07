MaleconInvoice = (function () {

  function checkCategories () {
    var values = MaleconUtils.getValues(MaleconConfig.ids.configSpreadsheet, MaleconConfig.sheetNames.transactionCategories);

    var startRow = MaleconConfig.positioning.invoice.categories.startRow,
      startCol = MaleconConfig.positioning.invoice.categories.startCol;
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.invoicesTransactions);
    var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);

    MaleconUtils.createValueInListValidation(values, range);
  }

  function checkUsers() {
    var values = MaleconUtils.getValues(MaleconConfig.ids.usersSpreadsheet, MaleconConfig.sheetNames.users, {
      startRow: MaleconConfig.positioning.invoice.sourceUserKeys.startRow,
      startCol: MaleconConfig.positioning.invoice.sourceUserKeys.startCol
    });

    var startRow = MaleconConfig.positioning.invoice.targetUserKeys.startRow,
      startCol = MaleconConfig.positioning.invoice.targetUserKeys.startCol;
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.invoicesTransactions);
    var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);

    MaleconUtils.createValueInListValidation(values, range);
  }

  function checkAccounts() {
    //Browser.msgBox('Error', 'Row does not contain key.' + JSON.stringify({}), Browser.Buttons.OK);
    var values = MaleconUtils.getValues(MaleconConfig.ids.configSpreadsheet, MaleconConfig.sheetNames.accounts);

    var startRow = MaleconConfig.positioning.invoice.accounts.startRow,
      startCol = MaleconConfig.positioning.invoice.accounts.startCol;
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.invoicesTransactions);
    var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);

    MaleconUtils.createValueInListValidation(values, range);
  }

  function dataFormat () {
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.invoicesTransactions);

    var startRow = MaleconConfig.positioning.invoice.value.startRow,
      startCol = MaleconConfig.positioning.invoice.value.startCol;
    sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1)
      .setNumberFormat(MaleconConfig.formatting.decimalNumber);
  }

  return {
    checkCategories: checkCategories,
    checkAccounts: checkAccounts,
    checkUsers: checkUsers,
    dataFormat: dataFormat
  }
})();

