Users = (function () {

  function getUsersMap() {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.usersSpreadsheet);
    var sheet = spreadsheet.getSheetByName(Config.sheetNames.users);

    var row = sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns());
    var rowValues = row.getValues();

    return rowValues.reduce(function (usersMap, rowValue) {
      var key = rowValue[1];
      if (key) {
        usersMap[key] = {
          key: key,
          name: rowValue[1],
          number: rowValue[0],
          document: rowValue[2],
          phone: rowValue[3],
          startDate: rowValue[4],
          active: rowValue[5],
          transactions: createUserTransactions()
        };
      }
      return usersMap;
    }, {});
  }

  function createUserTransactions () {
    return Config.accounts.reduce(function (transactions, account) {
      transactions[account.sheetName] = [];
      return transactions;
    }, {});
  }

  return {
    getUsersMap: getUsersMap
  }
})();

