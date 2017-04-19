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

    reconcileTransactions(transactions, invoices, accounts);
  }

  function getAccountTransactions(account, accountsSpreadsheet) {
    if (!account.sheetName) {
      return [];
    }

    var sheet = accountsSpreadsheet.getSheetByName(account.sheetName);
    var startRow = 2;
    var range = sheet.getRange(startRow, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns());
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

    transactionsData.invalidRows.forEach(function (rowIndex) {
      sheet.getRange(rowIndex, Config.positioning.balance[account.key].match.startCol, 1, 1)
        .setValues([['Sin conciliar']])
        .setBackground(Config.colors.error);
    });

    return transactionsData.transactions;
  }

  function getInvoices() {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.invoices);
    var sheet = spreadsheet.getSheetByName(Config.sheetNames.invoicesTransactions);
    var startRow = 2;
    var range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns());
    var values = range.getValues();

    // TODO - move
    var dateIndex = 0;
    var userIndex = 1;
    var accountIndex = 2;
    var numberIndex = 3;
    var seriesIndex = 4;
    var categoryIndex = 5;
    var valueIndex = 7;

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
          rowIndex: rowIndex + startRow,
          match: false
        });

      } else {
        invoiceData.invalidRows.push(rowIndex + startRow);
      }

      return invoiceData;
    }, {
      invoices: [],
      invalidRows: []
    });

    range.setBackground(Config.colors.neutral);
    invoiceData.invalidRows.forEach(function (rowIndex) {
      sheet.getRange(rowIndex, Config.positioning.invoice.match.startCol, 1, 1)
        .setValues([['Sin conciliar']])
        .setBackground(Config.colors.error);
    });

    return invoiceData.invoices;
  }

  function reconcileTransactions(transactions, invoices, accounts) {
    var usersMap = Users.getUsers().reduce(function(userMap, user) {
      userMap[user.key] = {
        userData: user,
        transactions: []
      };
      return userMap;
    }, {});

    var invoicesSheet = SpreadsheetApp.openById(Config.ids.invoices)
      .getSheetByName(Config.sheetNames.invoicesTransactions);
    var accountsBalanceSpreadsheet = SpreadsheetApp.openById(Config.ids.accountsBalance);

    invoices.forEach(function (invoice) {
      var matchCell = invoicesSheet.getRange(invoice.rowIndex, Config.positioning.invoice.match.startCol, 1, 1);

      var accountTransactions = transactions[invoice.account];
      if (!accountTransactions) {
        matchCell.setValues([['La cuenta no coincide con las cuentas preexistentes']])
          .setBackground(Config.colors.error);
        return;
      }

      var user = usersMap[invoice.user];
      if (!user) {
        matchCell.setValues([['El usuario no coincide con los usuarios preexistentes']])
          .setBackground(Config.colors.error);
        return;
      }

      var transaction = accountTransactions[invoice.number];
      if (transaction) {
        transaction.invoices.push(invoice);

        if (transaction.invoices.length === 1) {
          user.transactions.push(transaction);
        }
      } else {
        matchCell.setValues([['Sin conciliar']])
          .setBackground(Config.colors.error);
      }
      
    });

    accounts.forEach(function (account) {
      var accountSheet = accountsBalanceSpreadsheet.getSheetByName(account.sheetName);

      var accountTransactions = transactions[account.key];
      Object.keys(accountTransactions)
        .forEach(function (transactionKey) {
          var transaction = accountTransactions[transactionKey];
          var invoiceData = transaction.invoices.reduce(function (invoiceData, invoice) {
            invoiceData.sum += invoice.value;

            if (invoiceData.users.indexOf(invoice.user) === -1) {
              invoiceData.users.push(invoice.user);
            }

            return invoiceData;
          }, {
            sum: 0,
            users: []
          });

          var message = 'Conciliado';
          var color = Config.colors.neutral;
          if (transaction.invoices.length === 0) {
            message = 'Sin conciliar';
            color = Config.colors.error;
          } else if (invoiceData.users.length > 1) {
            message = 'Múltiples socios para una misma transacción: ' + transaction.users.join(', ');
            color = Config.colors.error;
          } else if (transaction.value !== invoiceData.sum) {
            message = 'Valor no coincide';
            color = Config.colors.error;
          }

          accountSheet.getRange(transaction.rowIndex, Config.positioning.balance[account.key].match.startCol, 1, 1)
            .setValues([[message]])
            .setBackground(color);
          transaction.invoices.forEach(function (invoice) {
            var matchCell = invoicesSheet.getRange(invoice.rowIndex, Config.positioning.invoice.match.startCol, 1, 1);
            matchCell.setValues([[message]])
              .setBackground(color);
          });
        });
    });

  }

  return {
    reconcile: reconcile
  };
})();