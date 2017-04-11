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

    reconcileTransactions(transactions, invoices);
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

    range.setBackground(Config.colors.neutral);
    transactionsData.invalidRows.forEach(function (rowIndex) {
      sheet.getRange(rowIndex, 1, 1, sheet.getMaxColumns())
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
    var valueIndex = 6;

    var transactionsData = values.reduce(function (transactionsData, row, rowIndex) {
      if (row[dateIndex] &&
        row[userIndex] &&
        row[accountIndex] &&
        row[numberIndex] &&
        row[categoryIndex] &&
        row[valueIndex]) {

        transactionsData.transactions.push({
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
        transactionsData.invalidRows.push(rowIndex + startRow);
      }

      return transactionsData;
    }, {
      transactions: [],
      invalidRows: []
    });

    range.setBackground(Config.colors.neutral);
    transactionsData.invalidRows.forEach(function (rowIndex) {
      sheet.getRange(rowIndex, 1, 1, sheet.getMaxColumns())
        .setBackground(Config.colors.error);
    });

    return transactionsData.transactions;
  }

  function reconcileTransactions(transactions, invoices) {
    var usersMap = Users.getUsers().reduce(function(userMap, user) {
      userMap[user.key] = {
        userData: user,
        transactions: []
      };
      return userMap;
    }, {});

    var invoicesSheet = SpreadsheetApp.openById(Config.ids.invoices)
      .getSheetByName(Config.sheetNames.invoicesTransactions);

    invoices.forEach(function (invoice) {
      var invoiceRange = invoicesSheet.getRange(invoice.rowIndex, 1, 1, invoicesSheet.getMaxColumns());
      var matchCell = invoiceRange.getCell(1, Config.positioning.invoice.match.startCol);

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

        var error = getInvoiceError(transaction, invoice);
        if (!error) {
          matchCell.setValues([['Conciliado']])
            .setBackground(Config.colors.neutral);

          if (transaction.invoices.length === 1) {
            user.transactions.push(transaction);
          }
        } else {
          matchCell.setValues([[error]])
            .setBackground(Config.colors.error);
        }

      } else {
        matchCell.setValues([['Sin conciliar']])
          .setBackground(Config.colors.error);
      }
      
    });
  }

  function getInvoiceError(transaction, invoice) {
    var invoiceSum = transaction.invoices.reduce(function (value, invoice) {
      return value + invoice.value;
    }, 0);

    if (invoiceSum > transaction.value) {
      Logger.log('transaction' + JSON.stringify(transaction));
      Logger.log('invoice' + JSON.stringify(invoice));
      return 'El valor de los recibos excede el de la transacción bancaria';
    }

    var lastUser = (transaction.invoices[0] || {}).user;
    if (lastUser && invoice.user !== lastUser) {
      return 'El usuario no coincide con el del recibo anterior (' + lastUser + ')';
    }
  }

  return {
    reconcile: reconcile
  };
})();