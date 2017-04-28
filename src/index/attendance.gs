function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(malecon.Texts.attendance.menu.main)
    .addItem(malecon.Texts.attendance.menu.validate, 'checkAttendance')
    .addToUi();
}

function onEdit(event) {
  checkListRange(event.range);
  checkTypeRange(event.range);
}

function checkListRange(eventRange) {
  var status = malecon.Config.positioning.attendance.status;

  var startAtListRange = eventRange.columnStart >= status.startCol &&
    eventRange.rowStart >= status.startRow;
  if (startAtListRange ||
    eventRange.columnEnd >= status.startCol &&
    eventRange.rowEnd >= status.startRow) {

    var range = eventRange;
    if (!startAtListRange) {
      var startRow = Math.max(status.startRow, eventRange.rowStart);
      var startCol = Math.max(status.startCol, eventRange.columnStart);
      var rows = eventRange.rowEnd - startRow + 1;
      var columns = eventRange.columnEnd - startCol + 1;
      var sheet = SpreadsheetApp.getActive().getSheetByName(malecon.Config.sheetNames.userAttendance);
      range = sheet.getRange(startRow, startCol, rows, columns);
    }

    malecon.Attendance.checkAttendanceList(range);
  }
}

function checkTypeRange(eventRange) {
  malecon.Utils.checkEventRangeColumnWithValues(eventRange,
    malecon.Config.positioning.attendance.types,
    malecon.Config.sheetNames.userAttendance,
    malecon.Attendance.checkAttendanceTypes);
}

function checkAttendance () {
  malecon.Attendance.updateUsers();
  malecon.Attendance.checkAttendanceTypes();
  malecon.Attendance.checkAttendanceList();
}