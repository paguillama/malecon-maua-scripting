Users = (function () {

  function getUsersMap() {
    return getUsers().reduce(function (usersMap, user) {
      usersMap[user.key] = user;
      return usersMap;
    }, {});
  }

  function getUsers() {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.usersSpreadsheet);
    var sheet = spreadsheet.getSheetByName(Config.sheetNames.users);

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
          active: rowValue[6]
        });
      }
      return users;
    }, []);
  }

  return {
    getUsersMap: getUsersMap,
    getUsers: getUsers
  }
})();

