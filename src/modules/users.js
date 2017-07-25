var config = require('./config')
var utils = require('./utils')

function getUsersMap() {
  return getUsers().reduce(function (usersMap, user) {
    usersMap[user.key] = user;
    return usersMap;
  }, {});
}

function getUsers() {
  const spreadsheet = SpreadsheetApp.openById(config.ids.usersSpreadsheet);
  const sheet = spreadsheet.getSheetByName(config.sheetNames.users);

  const rows = sheet
    .getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns())
    .getValues();

  const {
    keyColumnLabel,
    nameColumnLabel,
    numberColumnLabel,
    documentColumnLabel,
    phoneColumnLabel,
    startDateColumnLabel,
    endDateColumnLabel,
    activeColumnLabel,
  } = config.positioning.users

  const getColumnIndex = columnLabel => utils.getPosition(sheet, columnLabel).startCol - 1
  const keyColumnIndex = getColumnIndex(keyColumnLabel);
  const numberColumnIndex = getColumnIndex(numberColumnLabel);
  const nameColumnIndex = getColumnIndex(nameColumnLabel);
  const documentColumnIndex = getColumnIndex(documentColumnLabel);
  const phoneColumnIndex = getColumnIndex(phoneColumnLabel);
  const startDateColumnIndex = getColumnIndex(startDateColumnLabel);
  const endDateColumnIndex = getColumnIndex(endDateColumnLabel);
  const activeColumnIndex = getColumnIndex(activeColumnLabel);

  return rows.reduce(function (users, row) {
    var key = row[keyColumnIndex];
    if (key) {
      users.push({
        key: key,
        name: row[nameColumnIndex],
        number: row[numberColumnIndex],
        document: row[documentColumnIndex],
        phone: row[phoneColumnIndex],
        startDate: row[startDateColumnIndex],
        endDate: row[endDateColumnIndex],
        active: row[activeColumnIndex]
      });
    }
    return users;
  }, []);
}

module.exports = {
  getUsersMap: getUsersMap,
  getUsers: getUsers
}
