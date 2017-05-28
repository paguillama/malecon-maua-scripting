Reconciliation = (function () {

  function reconcile() {

    var accounts = Utils.getObject(Config.sheetNames.accounts).filter(function (account) {
      return account.sheetName;
    });

    var accountsSpreadsheet = SpreadsheetApp.openById(Config.ids.accountsBalance);
    var transactions = accounts.reduce(function (transactions, account) {
      var accountTransactions = getAccountTransactions(account, accountsSpreadsheet);

      transactions[account.key] = accountTransactions.reduce(function (accountTransactionsMap, transaction) {
        accountTransactionsMap[transaction.number] = transaction;
        return accountTransactionsMap;
      }, {});

      return transactions;
    }, {});

    var invoices = getInvoices(Config.sheetNames.invoicesTransactions);
    var debits = getInvoices(Config.sheetNames.debitsTransactions);

    var usersMap = reconcileTransactions(transactions, invoices, debits, accounts);

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

  function getInvoices(sheetname) {
    var spreadsheet = SpreadsheetApp.openById(Config.ids.invoices);
    var sheet = spreadsheet.getSheetByName(sheetname);
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
    var skipReconcileIndex = Utils.getPosition(sheet, Config.positioning.invoice.skipReconcileColumnLabel, startRow).startCol - 1;
    var accountTransactionNumberIndex = Utils.getPosition(sheet, Config.positioning.invoice.accountTransactionNumberColumnLabel, startRow).startCol - 1;

    var invoiceData = values.reduce(function (invoiceData, row, rowIndex) {
      if (row[dateIndex] &&
        row[userIndex] &&
        row[accountIndex] &&
        row[categoryIndex] &&
        row[valueIndex] &&
        row[skipReconcileIndex]) {

        invoiceData.invoices.push({
          date: row[dateIndex],
          user: row[userIndex],
          account: row[accountIndex],
          number: row[numberIndex],
          series: row[seriesIndex],
          category: row[categoryIndex],
          value: row[valueIndex],
          amount: row[amountIndex],
          skipReconcile: row[skipReconcileIndex] === 'Sí',
          accountTransactionNumber: row[accountTransactionNumberIndex],
          rowIndex: rowIndex + startRow,
          sheet: sheet
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

  function reconcileTransactions(transactions, invoices, debits, accounts) {
    var usersMap = Users.getUsers().reduce(function(usersMap, user) {
      usersMap[user.key] = {
        userData: user,
        transactions: [],
        skippedInvoices: [],
        errorInvoices: []
      };
      return usersMap;
    }, {});

    var invoicesSpreadsheet = SpreadsheetApp.openById(Config.ids.invoices);

    // TODO - same column for both sheets?
    var invoicesSheet = invoicesSpreadsheet.getSheetByName(Config.sheetNames.invoicesTransactions);
    var invoiceReconcileCol = Utils.getPosition(invoicesSheet, Config.positioning.invoice.reconcileColumnLabel).startCol;

    processInvoiceTransactions(invoices);
    processInvoiceTransactions(debits);

    function processInvoiceTransactions(invoiceTransactions) {

      invoiceTransactions.forEach(function (invoice) {

        var user = usersMap[invoice.user];
        if (!user) {
          return addError('Socio desconocido', invoice, false);
        }

        var accountTransactions = transactions[invoice.account];
        if (!accountTransactions) {
          return addError('Cuenta desconocida', invoice, user, false);
        }

        var transaction = invoice.number && accountTransactions[invoice.number] ||
          invoice.accountTransactionNumber && accountTransactions[invoice.accountTransactionNumber];
        if (!transaction) {
          return addError('Sin conciliar', invoice, user, invoice.skipReconcile);
        }

        transaction.invoices.push(invoice);

        if (transaction.invoices.length === 1) {
          user.transactions.push(transaction);
        }

      });
    }

    function addError(message, invoice, user, skipInvoice) {
      invoice.sheet.getRange(invoice.rowIndex, invoiceReconcileCol, 1, 1)
        .setValues([[message]])
        .setBackground(Config.colors.error);

      if (user) {
        if (skipInvoice) {
          user.skippedInvoices.push(invoice);
        } else {
          user.errorInvoices.push(invoice);
        }
      }
    }

    var accountsBalanceSpreadsheet = SpreadsheetApp.openById(Config.ids.accountsBalance);
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
            invoice.sheet.getRange(invoice.rowIndex, invoiceReconcileCol, 1, 1)
              .setValues([[message]])
              .setBackground(color);
          });
        });
    });

    return usersMap;
  }

  function createUsersSpreadsheets(usersMap) {
    
    var categories = Utils.getObject(Config.sheetNames.transactionCategories);
    var monthlyCategories = categories.reduce(function (monthlyCategories, category) {
      if(category.type === Config.transactionCategoryTypes.monthlyFromBeginning ||
        category.type === Config.transactionCategoryTypes.monthlyFromAdmission) {

        var monthlyValues = Utils.getObject(category.key, {
          spreadsheetId: Config.ids.invoiceCategoryMonthlyValues
        });

        monthlyCategories.push({
          categoryData: category,
          monthlyValues: monthlyValues.concat().sort(sortByObjectDate)
        })
      }

      return monthlyCategories;
    }, []);

    Object.keys(usersMap).forEach(function (key) {
      var user = usersMap[key];
      var spreadsheetName = 'Nº ' + user.userData.number + ' ' + user.userData.name;
      var spreadsheetId = Utils.getOrCreateSpreadsheet(spreadsheetName, Config.ids.userBalancesFolder, Config.sheetNames.balance);
      setUserSpreadsheetData(user, spreadsheetId);
    });

    function setUserSpreadsheetData(user, spreadsheetId) {
      var userData = user.transactions.reduce(function (userData, transaction) {
        if (transaction.reconciled) {
          addInvoicesToAccountCategoryMap(transaction.invoices, userData.accountCategoryMap);
          addInvoicesToCategoryMap(transaction.invoices, userData.categoryMap);
        }
        return userData;
      }, {
        accountCategoryMap: {},
        categoryMap: {}
      });
      addInvoicesToAccountCategoryMap(user.skippedInvoices, userData.accountCategoryMap);
      addInvoicesToCategoryMap(user.skippedInvoices, userData.categoryMap);

      function addInvoicesToAccountCategoryMap(invoices, accountCategoryMap) {
        invoices.forEach(function (invoice) {
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

      function addInvoicesToCategoryMap(invoices, categoryMap) {
        invoices.forEach(function (invoice) {
          var categoryInvoices = categoryMap[invoice.category];
          if (!categoryInvoices) {
            categoryInvoices = categoryMap[invoice.category] = [];
          }

          categoryInvoices.push(invoice);
        });
      }

      var monthsData = monthlyCategories.reduce(function (monthsData, category) {
        var invoices = user.userData.active && userData.categoryMap[category.categoryData.key] || [];
        const sortedInvoices = invoices.concat().sort(sortByObjectDate);

        var categoryMonthsData = sortedInvoices.reduce(function (categoryMonthsData, invoice) {
          var categoryValueOnInvoiceDate = getCategoryValueOnDate(invoice.date, category.monthlyValues);
          if (categoryValueOnInvoiceDate !== 0) {
            var accumulatedValue = categoryMonthsData.remainder + invoice.value;

            if (accumulatedValue >= categoryValueOnInvoiceDate) {
              categoryMonthsData.months += Math.floor(accumulatedValue / categoryValueOnInvoiceDate);
              categoryMonthsData.remainder = accumulatedValue % categoryValueOnInvoiceDate;
            } else {
              categoryMonthsData.remainder = accumulatedValue;
            }
          }

          return categoryMonthsData;
        }, {
          months: 0,
          remainder: 0
        });

        monthsData[category.categoryData.key] = categoryMonthsData;

        return monthsData;
      }, {});

      var position = createSheet(user, spreadsheetId);
      Object.keys(userData.accountCategoryMap)
        .forEach(function (accountKey) {
          var accountCategories = userData.accountCategoryMap[accountKey];
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

      categoryInvoices.sort(function compare(a, b) {
        return a.date >= b.date ? 1 : -1;
      });
      var transactionValues = categoryInvoices.map(function (transaction) {
        return [
          transaction.date,
          transaction.number || transaction.accountTransactionNumber,
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

  function getCategoryValueOnDate(date, monthlyValues) {
    var value = 0;

    var parsedDate = Date.parse(date)
    for(var i = 0; i < monthlyValues.length; i++) {
      if (Date.parse(monthlyValues[i].date) > parsedDate) {
        break;
      }

      value = monthlyValues[i].value;
    }

    return value;
  }

  function sortByObjectDate(a, b) {
    return Date.parse(a.date) < Date.parse(b.date);
  }

  return {
    reconcile: reconcile
  };
})();