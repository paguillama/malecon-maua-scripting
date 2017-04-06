/**
 * A special function that runs when the spreadsheet is open, used to add a
 * custom menu to the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MaleconTexts.menu.main)
    .addItem(MaleconTexts.menu.attendance, 'checkAttendance')
    .addToUi();
}

function checkAttendance () {
  MaleconAttendance.updateUsers();
  MaleconAttendance.checkAttendanceTypes();
  MaleconAttendance.checkAttendanceList();
}