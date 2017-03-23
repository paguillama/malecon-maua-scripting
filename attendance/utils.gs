MaleconUtils = (function () {

  function createValueInListValidation(values, targetRange, requireValue){

    var rangeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values)
      .setAllowInvalid(false);
    targetRange.setDataValidation(rangeRule);

    if (requireValue) {
      targetRange.getValues().forEach(function (row, rowIndex) {
        row.forEach(function (column, columnIndex) {
          targetRange.getCell(rowIndex + 1, columnIndex + 1)
            .setBackground(MaleconConfig.colors[!column ? 'error' : 'success']);
        });
      });
    }
  }

  function getValues(sourceSpreadsheetAppId, sourceSheetName) {
    var spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetAppId);
    var sheet = spreadsheet.getSheetByName(sourceSheetName);
    var range = sheet.getRange(1, 1, sheet.getMaxRows(), 1);
    //Browser.msgBox('range', 'range ' + JSON.stringify(range.getValues()), Browser.Buttons.OK);
    return range.getValues();
  }

  return {
    createValueInListValidation: createValueInListValidation,
    getValues: getValues
  };

})();