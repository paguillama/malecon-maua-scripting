MaleconUtils = (function () {

  function createSpreadsheet(filename, folderId, sheetName) {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(filename);
    var file = files.hasNext() && files.next() || null;

    if (!file) {
      var tempFile = SpreadsheetApp.create(filename);
      tempFile.getSheets()[0].setName(sheetName);
      file = DriveApp.getFileById(tempFile.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }

    return file.getId();
  }

  return {
    createSpreadsheet: createSpreadsheet
  };

})();