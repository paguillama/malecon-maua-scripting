InvoiceMigration = (function () {

  // TODO - improve
  var accountsCategoriesData = [{
    accountKey: 'BHU',
    categoryKey: 'Ahorro previo',
    cellToCheck: [10, 3],
    seriesColumn: 2,
    valueColumn: 3,
    amountColumn: 3
  }, {
    accountKey: 'BROU',
    categoryKey: 'Sobreahorro',
    cellToCheck: [10, 9],
    seriesColumn: null,
    valueColumn: 2,
    amountColumn: 3
  }, {
    accountKey: 'BROU',
    categoryKey: 'Cuota social',
    cellToCheck: [10, 14],
    seriesColumn: null,
    valueColumn: 3,
    amountColumn: 3
  }];

  function migrate () {
    var sheetsData = getSheetsData();
    checkAndAddUsers(sheetsData);
    checkTables(sheetsData);
    addTransactions(sheetsData);
    
    var transactions = flattenTransactions(sheetsData);
    createInvoicesSheet(transactions);
  }

  function getSheetsData() {
    var sourceSpreadsheet = SpreadsheetApp.getActive();

    return sourceSpreadsheet.getSheets()
      .filter(function (sheet) {

        return sheet.getName()
            .trim()
            .indexOf('N') === 0;

      }).map(function (sheet) {

        var name = sheet.getName()
          .trim()
          .slice(2)
          .trim();
        var number = null;

        var nameParts = name.split(' ');
        var parsedNumber = parseInt(nameParts[0], 10);
        if (!isNaN(parsedNumber)) {
          number = parsedNumber;
          name = nameParts.slice(1).join(' ');
        }

        return {
          sheet: sheet,
          parsedName: name,
          parsedNumber: number
        }
      });

  }

  function checkAndAddUsers(sheetsData) {
    var userKeyMap = Users.getUsersMap();
    var userMap = Object.keys(userKeyMap).reduce(function (userMap, userKey) {
      var user = userKeyMap[userKey];
      userMap.numbers[user.number] = user;
      userMap.names[user.name] = user;
      return userMap;
    }, {
      names: {},
      numbers: {}
    });


    sheetsData.forEach(function(sheetData) {
      var user = userMap.names[sheetData.parsedName];
      if (!user && sheetData.parsedNumber) {
        user = userMap.numbers[sheetData.parsedNumber];
        if (user) {
          Browser.msgBox('Error', 'User name does not match: ' + user.name + ' ' + sheetData.parsedName + ' ' + (user.name === sheetData.parsedName), Browser.Buttons.OK);
          user = userMap.numbers[sheetData.parsedNumber];
        }
      }

      if (user) {
        sheetData.user = user;
      }
    });

    var usersNotMatchedNames = sheetsData.filter(function (sheet) {
      return !sheet.user;
    }).map(function (sheet) {
      return sheet.parsedName + (sheet.parsedNumber || '');
    }).join(', ');
    if (usersNotMatchedNames) {
      Browser.msgBox('Error', 'Not matched users: ' + usersNotMatchedNames, Browser.Buttons.OK);
    }

  }

  function checkTables(sheetsData) {
    sheetsData.forEach(function (sheetData) {
      accountsCategoriesData.forEach(function(accountCategoryData) {
        checkValueOnCell('FECHA', accountCategoryData.cellToCheck, sheetData);
      })
    });
  }

  function checkValueOnCell(value, cell, sheetData) {
    var sheet = sheetData.sheet;

    var cellValue = sheet.getRange.apply(sheet, cell)
      .getValues()[0][0];

    if (cellValue.trim() !== value) {
      Browser.msgBox('Error', sheetData.parsedName + ' Cell value: ' + cellValue + ' should be ' + value, Browser.Buttons.OK);
    }
  }

  function addTransactions(sheetsData) {
    sheetsData.forEach(function (sheetData) {
      sheetData.transactions = [];
      accountsCategoriesData.forEach(function (accountCategoryData) {
        processAccountFromSheet(sheetData, accountCategoryData);
      });
    });
  }

  function processAccountFromSheet(sheetData, accountCategoryData) {
    var sheet = sheetData.sheet;

    var maxRows = sheet.getMaxRows();
    var columns = 4 + (accountCategoryData.seriesColumn ? 1 : 0);
    var range = sheet.getRange(accountCategoryData.cellToCheck[0] + 1, accountCategoryData.cellToCheck[1], maxRows, columns);

    range.getValues().forEach(function (row) {
      if (validateRow(row, accountCategoryData, sheetData)) {
        sheetData.transactions.push({
          date: parseInt(row[0], 10),
          invoiceNumber: row[1],
          invoiceSeries: accountCategoryData.seriesColumn ? row[accountCategoryData.seriesColumn] : null,
          amount: row[accountCategoryData.amountColumn],
          value: row[accountCategoryData.valueColumn],
          accountCategoryData: accountCategoryData,
          sheetData: sheetData
        });
      }
    });
  }

  function validateRow(row, accountCategoryData, sheetData) {
    // TODO - improve
    var valid = row[0] && !isNaN(parseInt(row[0], 10)) && row[accountCategoryData.valueColumn];
    if (row[0] && !valid) {
      Browser.msgBox('Error', 'Transaction not valid: ' + sheetData.user.name + ' ' + JSON.stringify(row), Browser.Buttons.OK);
    }
    return valid;
  }

  function flattenTransactions(sheetsData) {
    var transactions = [];
    sheetsData.forEach(function (sheetData) {
      transactions = transactions.concat(sheetData.transactions);
    });

    return transactions.sort(function (a, b) {
      return a.date - b.date;
    });
  }

  function createInvoicesSheet(transactions) {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.invoices);
    var sheet = spreadsheet.getSheetByName(Config.sheetNames.invoicesTransactions);

    var valuesRange = sheet.getRange(2, 1, transactions.length, 8);
    var transactionValues = transactions.map(function (transaction) {
      return [
        transaction.date,
        transaction.sheetData.user.key,
        transaction.accountCategoryData.accountKey,
        transaction.invoiceNumber,
        transaction.invoiceSeries,
        transaction.accountCategoryData.categoryKey,
        transaction.value,
        transaction.amount
      ];
    });
    valuesRange.setValues(transactionValues);

    // Date format
    sheet.getRange(2, 1, transactions.length, 1)
      .setNumberFormat(Config.formatting.date);
  }

  return {
    migrate: migrate
  };
})();

