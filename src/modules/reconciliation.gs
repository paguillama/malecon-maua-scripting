Reconciliation = (function () {

  function reconcile() {

    var accounts = Utils.getObject(Config.sheetNames.accounts);

    var accountsSpreadsheet = SpreadsheetApp.openById(Config.ids.accountsBalance);
    var transactions = accounts.reduce(function (transactions, account) {
      var accountTransactions = getAccountTransactions(account, accountsSpreadsheet);

      transactions[account.key] = accountTransactions.reduce(function (accountTransactionsMap, transaction) {
        accountTransactionsMap[transaction.number] = transaction;
        return accountTransactionsMap;
      }, {});

      return transactions;
    }, {});

    var invoices = getInvoices();

    var usersMap = reconcileTransactions(transactions, invoices, accounts);

    createUsersSpreadsheets(usersMap);
  }

  function getAccountTransactions(account, accountsSpreadsheet) {
    if (!account.sheetName) {
      return [];
    }

    var accountSheet = accountsSpreadsheet.getSheetByName(account.sheetName);
    var startRow = 2;
    var range = accountSheet.getRange(startRow, 1, accountSheet.getMaxRows() - 1, accountSheet.getMaxColumns());
    var values = range.getValues();

    var transactionsData = values.reduce(function (transactionsData, row, rowIndex) {
      if ((row[account.positiveValueIndex] || row[account.negativeValueIndex]) &&
        row[account.dateIndex] &&
        row[account.numberIndex]) {

        transactionsData.transactions.push({
          value: (row[account.positiveValueIndex] || 0) - (row[account.negativeValueIndex] || 0),
          date: row[account.dateIndex],
          number: row[account.numberIndex],
          rowIndex: rowIndex + startRow,
          invoices: []
        });

      } else {
        transactionsData.invalidRows.push(rowIndex + startRow);
      }

      return transactionsData;
    }, {
      transactions: [],
      invalidRows: []
    });

    if (transactionsData.invalidRows.length) {
      var reconcileCol = Utils.getPosition(accountSheet, Config.positioning.accountBalance[account.key].reconcileColumnLabel).startCol;
      transactionsData.invalidRows.forEach(function (rowIndex) {
        accountSheet.getRange(rowIndex, reconcileCol, 1, 1)
          .setValues([['Sin conciliar']])
          .setBackground(Config.colors.error);
      });
    }

    return transactionsData.transactions;
  }

  function getInvoices() {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.invoices);
    var sheet = spreadsheet.getSheetByName(Config.sheetNames.invoicesTransactions);
    var startRow = Config.positioning.invoice.startRow;
    var range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns());
    var values = range.getValues();

    var dateIndex = Utils.getPosition(sheet, Config.positioning.invoice.dateColumnLabel, startRow).startCol - 1;
    var userIndex = Utils.getPosition(sheet, Config.positioning.invoice.userColumnLabel, startRow).startCol - 1;
    var accountIndex = Utils.getPosition(sheet, Config.positioning.invoice.accountColumnLabel, startRow).startCol - 1;
    var numberIndex = Utils.getPosition(sheet, Config.positioning.invoice.numberColumnLabel, startRow).startCol - 1;
    var seriesIndex = Utils.getPosition(sheet, Config.positioning.invoice.seriesColumnLabel, startRow).startCol - 1;
    var categoryIndex = Utils.getPosition(sheet, Config.positioning.invoice.categoriesColumnLabel, startRow).startCol - 1;
    var valueIndex = Utils.getPosition(sheet, Config.positioning.invoice.valueColumnLabel, startRow).startCol - 1;
    var amountIndex = Utils.getPosition(sheet, Config.positioning.invoice.amountColumnLabel, startRow).startCol - 1;

    var invoiceData = values.reduce(function (invoiceData, row, rowIndex) {
      if (row[dateIndex] &&
        row[userIndex] &&
        row[accountIndex] &&
        row[numberIndex] &&
        row[categoryIndex] &&
        row[valueIndex]) {

        invoiceData.invoices.push({
          date: row[dateIndex],
          user: row[userIndex],
          account: row[accountIndex],
          number: row[numberIndex],
          series: row[seriesIndex],
          category: row[categoryIndex],
          value: row[valueIndex],
          amount: row[amountIndex],
          rowIndex: rowIndex + startRow
        });

      } else {
        invoiceData.invalidRows.push(rowIndex + startRow);
      }

      return invoiceData;
    }, {
      invoices: [],
      invalidRows: []
    });

    var reconcileCol = Utils.getPosition(sheet, Config.positioning.invoice.reconcileColumnLabel, startRow).startCol;
    range.setBackground(Config.colors.neutral);
    invoiceData.invalidRows.forEach(function (rowIndex) {
      sheet.getRange(rowIndex, reconcileCol, 1, 1)
        .setValues([['Sin conciliar']])
        .setBackground(Config.colors.error);
    });

    return invoiceData.invoices;
  }

  function reconcileTransactions(transactions, invoices, accounts) {
    var usersMap = Users.getUsers().reduce(function(usersMap, user) {
      usersMap[user.key] = {
        userData: user,
        transactions: [],
        errorInvoices: []
      };
      return usersMap;
    }, {});

    var invoicesSheet = SpreadsheetApp.openById(Config.ids.invoices)
      .getSheetByName(Config.sheetNames.invoicesTransactions);
    var invoiceReconcileCol = Utils.getPosition(invoicesSheet, Config.positioning.invoice.reconcileColumnLabel).startCol;
    var accountsBalanceSpreadsheet = SpreadsheetApp.openById(Config.ids.accountsBalance);

    function addError(message, invoice, user) {
      invoicesSheet.getRange(invoice.rowIndex, invoiceReconcileCol, 1, 1)
        .setValues([[message]])
        .setBackground(Config.colors.error);

      if (user) {
        user.errorInvoices.push(invoice);
      }
    }

    invoices.forEach(function (invoice) {

      var user = usersMap[invoice.user];
      if (!user) {
        return addError('Socio desconocido', invoice);
      }

      var accountTransactions = transactions[invoice.account];
      if (!accountTransactions) {
        return addError('Cuenta desconocida', invoice, user);
      }

      var transaction = accountTransactions[invoice.number];
      if (!transaction) {
        return addError('Sin conciliar', invoice, user);
      }

      transaction.invoices.push(invoice);

      if (transaction.invoices.length === 1) {
        user.transactions.push(transaction);
      }
      
    });

    accounts.forEach(function (account) {
      var accountSheet = accountsBalanceSpreadsheet.getSheetByName(account.sheetName);
      var accountReconcileCol = Utils.getPosition(accountSheet, Config.positioning.accountBalance[account.key].reconcileColumnLabel).startCol;

      var accountTransactions = transactions[account.key];
      Object.keys(accountTransactions)
        .forEach(function (transactionKey) {
          var transaction = accountTransactions[transactionKey];
          var invoiceData = transaction.invoices.reduce(function (invoiceData, invoice) {
            invoiceData.sum += invoice.amount;

            if (invoiceData.users.indexOf(invoice.user) === -1) {
              invoiceData.users.push(invoice.user);
            }

            return invoiceData;
          }, {
            sum: 0,
            users: []
          });

          var message = 'Conciliado';
          transaction.reconciled = true;
          if (transaction.invoices.length === 0) {
            message = 'Sin conciliar';
            transaction.reconciled = false;
          } else if (invoiceData.users.length > 1) {
            message = 'Múltiples socios para una misma transacción: ' + transaction.users.join(', ');
            transaction.reconciled = false;
          } else if (transaction.value !== invoiceData.sum) {
            message = 'Valor no coincide';
            transaction.reconciled = false;
          }

          var color = transaction.reconciled ? Config.colors.neutral : Config.colors.error;
          accountSheet.getRange(transaction.rowIndex, accountReconcileCol, 1, 1)
            .setValues([[message]])
            .setBackground(color);
          transaction.invoices.forEach(function (invoice) {
            invoicesSheet.getRange(invoice.rowIndex, invoiceReconcileCol, 1, 1)
              .setValues([[message]])
              .setBackground(color);
          });
        });
    });

    return usersMap;
  }

  function createUsersSpreadsheets(usersMap) {

    Object.keys(usersMap).forEach(function (key) {
      var user = usersMap[key];
      var spreadsheetName = 'Nº ' + user.userData.number + ' ' + user.userData.name;
      var spreadsheetId = Utils.getOrCreateSpreadsheet(spreadsheetName, Config.ids.userBalancesFolder, Config.sheetNames.balance);
      setUserSpreadsheetData(user, spreadsheetId);
    });

    function setUserSpreadsheetData(user, spreadsheetId) {
      var accountCategoryMap = user.transactions.reduce(function (accountCategoryMap, transaction) {
        if (transaction.reconciled) {
          transaction.invoices.forEach(function (invoice) {
            var accountCategories = accountCategoryMap[invoice.account];
            if (!accountCategories) {
              accountCategories = accountCategoryMap[invoice.account] = {};
            }

            var categoryInvoices = accountCategories[invoice.category];
            if (!categoryInvoices) {
              categoryInvoices = accountCategories[invoice.category] = [];
            }

            categoryInvoices.push(invoice);
          });
        }
        return accountCategoryMap;
      }, {});

      var position = createSheet(user, spreadsheetId);
      Object.keys(accountCategoryMap)
        .forEach(function (accountKey) {
          var accountCategories = accountCategoryMap[accountKey];
          Object.keys(accountCategories)
            .forEach(function (categoryKey) {
              var categoryInvoices = accountCategories[categoryKey];

              var tablePosition = createTable(position, accountKey, categoryKey, categoryInvoices);
              position = {
                row: position.row,
                col: tablePosition.col + 1,
                sheet: position.sheet
              }
            });
        });
    }

    function createSheet(user, spreadsheetId) {
      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

      var sheet = spreadsheet.getSheetByName(Config.sheetNames.balance);
      if (sheet) {
        sheet.clear();
        sheet.activate();
      } else {
        sheet = spreadsheet.insertSheet(Config.sheetNames.balance, spreadsheet.getNumSheets());
      }
      var sheetTitle = user.userData.name;
      var headerLabels = Texts.balance.headers;
      var headers = [
        [sheetTitle, '', '', ''],
        [headerLabels.userNumber, user.userData.number, headerLabels.userDocument, user.userData.document || '-'],
        // TODO - bug with start date (substracting 1 day [probably timezone])
        [headerLabels.admissionDate, user.userData.startDate, headerLabels.phone, user.userData.phone || '-']
      ];

      var row = 1;
      sheet.getRange(row, 1, headers.length, 4)
        .setValues(headers)
        .setBorder(true, true, true, true, true, true);

      sheet.getRange(row, 1, 1, headers[0].length)
        .mergeAcross()
        .setHorizontalAlignment('center');

      sheet.getRange(row + 2, 1)
        .setNumberFormat(Config.formatting.date);

      row = row + headers.length + 1;

      return {
        row: row,
        col: 1,
        sheet: sheet
      };
    }

    function createTable(position, accountKey, categoryKey, categoryInvoices) {
      var row = position.row,
        col = position.col;

      var headerLabels = Texts.balance.transactions.headers;
      var transactionHeaders = [headerLabels.date, headerLabels.invoice, headerLabels.amount, headerLabels.value];
      var extraHeaders = [headerLabels.balance];
      var headers = transactionHeaders.concat(extraHeaders);

      var sheet = position.sheet;

      sheet.getRange(row, col, 1, 1)
        .setValues([[accountKey + ' ' + categoryKey]]);
      sheet.getRange(row, col, 1, headers.length)
        .mergeAcross()
        .setHorizontalAlignment('center');
      row = row + 1;

      sheet.getRange(row, col, 1, headers.length)
        .setValues([headers]);
      row = row + 1;

      var transactionValues = categoryInvoices.map(function (transaction) {
        return [
          transaction.date,
          transaction.number,
          transaction.amount,
          transaction.value
        ];
      });
      sheet.getRange(row, col, transactionValues.length, transactionHeaders.length)
        .setValues(transactionValues);

      sheet.getRange(row, col + transactionHeaders.length)
        .setFormulasR1C1([['=R[0]C[-1]']]);

      if (transactionValues.length > 1) {
        var formulas = transactionValues.slice(1).map(function () {
          return ['=R[-1]C[0] + R[0]C[-1]'];
        });
        sheet.getRange(row + 1, col + transactionHeaders.length, transactionValues.length - 1, 1)
          .setFormulasR1C1(formulas);
      }

      sheet.getRange(row, col, transactionValues.length, 1)
        .setNumberFormat(Config.formatting.date);

      sheet.getRange(row, col + 1, transactionValues.length, 1)
        .setNumberFormat('0');

      sheet.getRange(row, col + 2, transactionValues.length, 3)
        .setNumberFormat(Config.formatting.decimalNumber);

      row = row + transactionValues.length;

      col = col + headers.length;
      sheet.getRange(position.row, position.col, row - position.row, col - position.col)
        .setBorder(true, true, true, true, true, true);

      return {
        row: row,
        col: col,
        sheet: position.sheet
      }
    }
  }

  return {
    reconcile: reconcile
  };
})();