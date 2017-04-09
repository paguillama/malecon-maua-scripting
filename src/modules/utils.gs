Utils = (function () {

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

  function createValueInListValidation(values, targetRange){

    // Data validation
    var rangeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values)
      .setAllowInvalid(false);
    targetRange.setDataValidation(rangeRule);

    // Background color
    var flattenedValues = values.map(function (row) {
      return row[0];
    });
    targetRange.getValues()
      .forEach(function (row, rowIndex) {
        row.forEach(function (value, columnIndex) {
          var color = !value || flattenedValues.indexOf(value) === -1 ? 'error' : 'neutral';
          targetRange.getCell(rowIndex + 1, columnIndex + 1)
            .setBackground(Config.colors[color]);
        });
      });
    }

  function getValues(sourceSpreadsheetAppId, sourceSheetName, options) {
    var spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetAppId);
    var sheet = spreadsheet.getSheetByName(sourceSheetName);
    var maxRows = sheet.getMaxRows() - (options && options.startRow ? options.startRow - 1 : 0);
    var range = sheet.getRange(options && options.startRow || 1, options && options.startCol || 1, maxRows, 1);
    return range.getValues();
  }

  function checkEventRangeColumnWithValues(eventRange, positioning, sheetname, handler) {
    if (eventRange.columnStart <= positioning.startCol &&
      eventRange.columnEnd >= positioning.startCol &&
      eventRange.rowEnd >= positioning.startRow) {

      var range = eventRange;
      if (eventRange.rowStart < positioning.startRow ||
        eventRange.columnStart < positioning.startCol ||
        eventRange.columnEnd > positioning.startCol) {
        var startRow = Math.max(positioning.startRow, eventRange.rowStart);
        var startCol = positioning.startCol;
        var rows = eventRange.rowEnd - startRow + 1;
        var columns = 1;
        var sheet = SpreadsheetApp.getActive().getSheetByName(sheetname);
        range = sheet.getRange(startRow, startCol, rows, columns);
      }

      handler(range);
    }
  }

  return {
    getOrCreateSpreadsheet: getOrCreateSpreadsheet,
    createValueInListValidation: createValueInListValidation,
    getValues: getValues,
    checkEventRangeColumnWithValues: checkEventRangeColumnWithValues
  };

})();