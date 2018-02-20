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
    firstNameColumnLabel,
    lastNameColumnLabel,
    numberColumnLabel,
    documentColumnLabel,
    phoneColumnLabel,
    startDateColumnLabel,
    endDateColumnLabel,
    typeColumnLabel,
    activeColumnLabel,
    emailColumnLabel,
  } = config.positioning.users

  const getColumnIndex = columnLabel => utils.getPosition(sheet, columnLabel).startCol - 1
  const keyColumnIndex = getColumnIndex(keyColumnLabel);
  const numberColumnIndex = getColumnIndex(numberColumnLabel);
  const firstNameColumnIndex = getColumnIndex(firstNameColumnLabel);
  const lastNameColumnIndex = getColumnIndex(lastNameColumnLabel);
  const documentColumnIndex = getColumnIndex(documentColumnLabel);
  const phoneColumnIndex = getColumnIndex(phoneColumnLabel);
  const startDateColumnIndex = getColumnIndex(startDateColumnLabel);
  const endDateColumnIndex = getColumnIndex(endDateColumnLabel);
  const typeColumnIndex = getColumnIndex(typeColumnLabel);
  const activeColumnIndex = getColumnIndex(activeColumnLabel);
  const emailColumnIndex = getColumnIndex(emailColumnLabel);

  return rows.reduce(function (users, row) {
    const key = row[keyColumnIndex];
    if (key) {
      const firstName = row[firstNameColumnIndex];
      const lastName = row[lastNameColumnIndex];
      const name = `${firstName} ${lastName}`;
      users.push({
        key: key,
        name,
        firstName,
        lastName,
        number: row[numberColumnIndex],
        document: row[documentColumnIndex],
        phone: row[phoneColumnIndex],
        startDate: new Date(row[startDateColumnIndex]).getTime(),
        endDate: row[endDateColumnIndex] && new Date(row[endDateColumnIndex]).getTime() || null,
        type: row[typeColumnIndex],
        active: row[activeColumnIndex],
        email: row[emailColumnIndex],
      });
    }
    return users;
  }, []);
}

const getSpreadsheetName = user => `Nº ${user.number} ${user.name}`;

module.exports = {
  getUsersMap: getUsersMap,
  getUsers: getUsers,
  getSpreadsheetName,
}
