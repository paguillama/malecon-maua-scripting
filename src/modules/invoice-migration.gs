InvoiceMigration = (function () {

  // TODO - improve
  var accountsCategoriesData = [{
    accountKey: 'BHU',
    categoryKey: 'Ahorro previo',
    cellToCheck: [10, 3],
    skipOther: true,
    invoiceSeries: true
  }, {
    accountKey: 'BROU',
    categoryKey: 'Sobreahorro',
    cellToCheck: [10, 9],
    skipOther: false,
    invoiceSeries: false
  }, {
    accountKey: 'BROU',
    categoryKey: 'Cuota social',
    cellToCheck: [10, 14],
    skipOther: false,
    invoiceSeries: false
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
    var usersNameMap = Users.getUsersMap();
    var usersNumberMap = Object.keys(usersNameMap).reduce(function (usersNumberMap, userName) {
      var user = usersNameMap[userName];
      usersNumberMap[user.number] = user;
      return usersNameMap;
    }, {});


    sheetsData.forEach(function(sheetData) {
      var user = usersNameMap[sheetData.parsedName];
      if (!user && sheetData.parsedNumber) {
        user = usersNumberMap[sheetData.parsedNumber];
        if (user) {
          Browser.msgBox('Error', 'User name does not match: ' + user.name + ' ' + sheetData.parsedName + ' ' + (user.name === sheetData.parsedName), Browser.Buttons.OK);
          user = usersNumberMap[sheetData.parsedNumber];
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
    var invoiceSeriesShift = accountCategoryData.invoiceSeries ? 1 : 0;
    var columns = 4 + invoiceSeriesShift;
    var range = sheet.getRange(accountCategoryData.cellToCheck[0] + 1, accountCategoryData.cellToCheck[1], maxRows, columns);

    range.getValues().forEach(function (row) {
      if (validateRow(row, invoiceSeriesShift, sheetData)) {
        sheetData.transactions.push({
          date: parseInt(row[0], 10),
          invoiceNumber: row[1],
          invoiceSeries: accountCategoryData.invoiceSeries ? row[2] : null,
          otherField: accountCategoryData.skipOther ? null : row[2 + invoiceSeriesShift],
          value: row[3 + invoiceSeriesShift],
          accountCategoryData: accountCategoryData,
          sheetData: sheetData
        });
      }
    });
  }

  function validateRow(row, invoiceSeriesShift, sheetData) {
    // TODO - improve
    var valid = row[0] && !isNaN(parseInt(row[0], 10)) && row[3 + invoiceSeriesShift];
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
        transaction.sheetData.user.name,
        transaction.accountCategoryData.accountKey,
        transaction.invoiceNumber,
        transaction.invoiceSeries,
        transaction.accountCategoryData.categoryKey,
        transaction.value,
        transaction.otherField
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

