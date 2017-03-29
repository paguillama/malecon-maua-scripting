MaleconUtils = (function () {

  function getOrCreateSpreadsheet(filename, folderId, sheetName) {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(filename);
    var file = files.hasNext() && files.next() || null;

    if (!file) {
      var tempFile = SpreadsheetApp.create(filename);
      tempFile.getSheets()[0].setName(sheetName);
      file = DriveApp.getFileById(tempFile.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } else {
      var spreadsheet = SpreadsheetApp.openById(file.getId());
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        sheet.clear();
      } else {
        spreadsheet.insertSheet(sheetName);
      }
    }

    return file.getId();
  }

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
    getOrCreateSpreadsheet: getOrCreateSpreadsheet,
    createValueInListValidation: createValueInListValidation,
    getValues: getValues
  };

})();