var config = require('./config')

function getUsersMap() {
  return getUsers().reduce(function (usersMap, user) {
    usersMap[user.key] = user;
    return usersMap;
  }, {});
}

function getUsers() {
  var spreadsheet = SpreadsheetApp.openById(config.ids.usersSpreadsheet);
  var sheet = spreadsheet.getSheetByName(config.sheetNames.users);

  var row = sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns());
  var rowValues = row.getValues();

  return rowValues.reduce(function (users, rowValue) {
    var key = rowValue[2];
    if (key) {
      users.push({
        key: key,
        name: rowValue[1],
        number: rowValue[0],
        document: rowValue[3],
        phone: rowValue[4],
        startDate: rowValue[5],
        active: rowValue[8]
      });
    }
    return users;
  }, []);
}

module.exports = {
  getUsersMap: getUsersMap,
  getUsers: getUsers
}
