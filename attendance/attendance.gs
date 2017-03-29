MaleconAttendance = (function () {

  function checkAttendanceList(){
    var startRow = MaleconConfig.positioning.attendance.startRow,
      startCol = MaleconConfig.positioning.attendance.startCol;

    var values = MaleconUtils.getValues(MaleconConfig.ids.attendanceStatusSpreadsheet, MaleconConfig.sheetNames.attendance);
    SpreadsheetApp.getActive().getSheets().forEach(function (sheet) {
      var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns() - startCol + 1);
      MaleconUtils.createValueInListValidation(values, range, true);
    });
  }

  return {
    checkAttendanceList: checkAttendanceList
  };
})();