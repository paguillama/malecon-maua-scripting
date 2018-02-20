var config = require('./config')

function getOrCreateSpreadsheet(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  return (filename, sheetName) => {
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
          .setBackground(config.colors[color]);
      });
    });
  }

function getValues(sourceSpreadsheetAppId, sourceSheetName, options) {
  var spreadsheet = SpreadsheetApp.openById(sourceSpreadsheetAppId);
  var sheet = spreadsheet.getSheetByName(sourceSheetName);
  var rows = sheet.getMaxRows() - (options && options.startRow ? options.startRow - 1 : 0);
  var range = sheet.getRange(options && options.startRow || 1, options && options.startCol || 1, rows, 1);
  return range.getValues();
}

function getPosition(sheet, label, startRow) {
  var values = sheet.getRange(1, 1, 1, sheet.getMaxColumns())
    .getValues();

  var columnIndex = values[0].reduce(function(columnIndex, value, index) {
      return columnIndex !== null ? columnIndex : (value === label ? index : null);
  }, null);

  if (columnIndex === null) {
    throw 'Columna "' + label + '" no encontrada.';
  }

  return {
    startRow: startRow,
    startCol: columnIndex + 1
  }
}

function getObject(sourceSheetName, options) {
  var spreadsheet = SpreadsheetApp.openById(options && options.spreadsheetId || config.ids.configSpreadsheet);
  var sheet = spreadsheet.getSheetByName(sourceSheetName);

  if (sheet.getMaxRows() < 2) {
    return [];
  }

  var range = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());

  var values = range.getValues();

  var indexProperties = values[0];

  return values.slice(1).map(function (row) {
    return indexProperties.reduce(function (item, propertyName, index) {
      item[propertyName] = row[index];
      return item;
    }, {});
  });
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

module.exports = {
  getOrCreateSpreadsheet,
  createValueInListValidation,
  getValues,
  getPosition,
  getObject,
  checkEventRangeColumnWithValues,
};