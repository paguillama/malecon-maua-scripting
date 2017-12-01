const texts = require('./texts')
const users = require('./users')
const config = require('./config')
const utils = require('./utils')

function reconcile() {
  const accounts = utils.getObject(config.sheetNames.accounts)
    .filter(account => account.sheetName);

  const accountsSpreadsheet = SpreadsheetApp.openById(config.ids.accountsBalance);
  const descriptionsToFilterAccounts = utils.getObject(config.sheetNames.descriptionsToFilterAccounts)
    .reduce((descriptionsToFilterAccounts, description) => {
      const accountDescriptions = descriptionsToFilterAccounts[description.account] || (descriptionsToFilterAccounts[description.account] = {});
      accountDescriptions[description.key] = true;
      return descriptionsToFilterAccounts;
    }, {});

  const transactions = accounts.reduce((transactions, account) => {
    const accountTransactions = getAccountTransactions(account, accountsSpreadsheet, descriptionsToFilterAccounts[account.key] || {});

    transactions[account.key] = accountTransactions.reduce((accountTransactionsMap, transaction) => {
      accountTransactionsMap[transaction.number] = transaction;
      return accountTransactionsMap;
    }, {});

    return transactions;
  }, {});

  const invoices = getInvoices(config.sheetNames.invoicesTransactions);
  const debits = getInvoices(config.sheetNames.debitsTransactions);

  const usersMap = reconcileTransactions(transactions, invoices.concat(debits), accounts);

  createUsersSpreadsheets(usersMap);
}

function getAccountTransactions(account, accountsSpreadsheet, descriptionsToFilter) {
  if (!account.sheetName) {
    return [];
  }

  const accountSheet = accountsSpreadsheet.getSheetByName(account.sheetName);
  const startRow = 2;
  const maxRows = accountSheet.getMaxRows();
  if (maxRows === startRow - 1) {
    return [];
  }

  const range = accountSheet.getRange(startRow, 1, maxRows - 1, accountSheet.getMaxColumns());
  const values = range.getValues();

  const transactionsData = values.reduce((transactionsData, row, relativeRowIndex) => {
    const rowIndex = relativeRowIndex + startRow;
    if (row[account.descriptionIndex] && descriptionsToFilter[row[account.descriptionIndex]]) {
      transactionsData.skippedRows.push(rowIndex);
      return transactionsData;
    }

    const missing = [];
    if (!(row[account.positiveValueIndex] || row[account.negativeValueIndex])) {
      missing.push('Valores positivos o negativos');
    }
    if (!row[account.dateIndex]) {
      missing.push('Fecha');
    }
    if (!row[account.numberIndex]) {
      missing.push('Número de comprobante');
    }
    if (!missing.length) {
      transactionsData.transactions.push({
        value: (row[account.positiveValueIndex] || 0) - (row[account.negativeValueIndex] || 0),
        date: row[account.dateIndex],
        number: row[account.numberIndex],
        rowIndex,
        invoices: []
      });
    } else {
      transactionsData.invalidRows.push({
        rowIndex,
        missing
      });
    }

    return transactionsData;
  }, {
    transactions: [],
    invalidRows: [],
    skippedRows: []
  });

  const reconcileCol = utils.getPosition(accountSheet, config.positioning.accountBalance[account.key].reconcileColumnLabel).startCol;
  if (transactionsData.skippedRows.length) {
    transactionsData.skippedRows.forEach(rowIndex => accountSheet
      .getRange(rowIndex, reconcileCol, 1, 1)
      .setValues([['Fila salteada']])
      .setBackground(config.colors.info));
  }

  if (transactionsData.invalidRows.length) {
    transactionsData.invalidRows.forEach(({ rowIndex, missing }) => accountSheet
      .getRange(rowIndex, reconcileCol, 1, 1)
      .setValues([['Campos inválidos: ' + missing.join(', ')]])
      .setBackground(config.colors.error));
  }

  return transactionsData.transactions;
}

function getInvoices(sheetname) {
  const spreadsheet = SpreadsheetApp.openById(config.ids.invoices);
  const sheet = spreadsheet.getSheetByName(sheetname);
  const startRow = config.positioning.invoice.startRow;
  const range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns());

  const getPosition = label => utils.getPosition(sheet, label, startRow).startCol - 1;
  const invoiceLabels = config.positioning.invoice;
  const dateIndex = getPosition(invoiceLabels.dateColumnLabel);
  const userIndex = getPosition(invoiceLabels.userColumnLabel);
  const accountIndex = getPosition(invoiceLabels.accountColumnLabel);
  const numberIndex = getPosition(invoiceLabels.numberColumnLabel);
  const seriesIndex = getPosition(invoiceLabels.seriesColumnLabel);
  const categoryIndex = getPosition(invoiceLabels.categoriesColumnLabel);
  const valueIndex = getPosition(invoiceLabels.valueColumnLabel);
  const amountIndex = getPosition(invoiceLabels.amountColumnLabel);
  const skipReconcileIndex = getPosition(invoiceLabels.skipReconcileColumnLabel);
  const accountTransactionNumberIndex = getPosition(invoiceLabels.accountTransactionNumberColumnLabel);

  const invoiceData = range.getValues().reduce((invoiceData, row, rowIndex) => {
    const missing = [];
    if (!row[dateIndex]) {
      missing.push(invoiceLabels.dateColumnLabel);
    }
    if (!row[userIndex]) {
      missing.push(invoiceLabels.userColumnLabel);
    }
    if (!row[accountIndex]) {
      missing.push(invoiceLabels.accountColumnLabel);
    }
    if (!row[categoryIndex]) {
      missing.push(invoiceLabels.categoriesColumnLabel);
    }
    if (!row[valueIndex]) {
      missing.push(invoiceLabels.valueColumnLabel);
    }
    if (!row[skipReconcileIndex]) {
      missing.push(invoiceLabels.skipReconcileColumnLabel);
    }
    if (!missing.length) {
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
      invoiceData.invalidRows.push({
        rowIndex: rowIndex + startRow,
        missing
      });
    }

    return invoiceData;
  }, {
    invoices: [],
    invalidRows: []
  });

  const reconcileCol = utils.getPosition(sheet, invoiceLabels.reconcileColumnLabel, startRow).startCol;
  range.setBackground(config.colors.neutral);
  invoiceData.invalidRows.forEach(({ rowIndex, missing }) => sheet
    .getRange(rowIndex, reconcileCol, 1, 1)
    .setValues([['Campos inválidos: ' + missing.join(', ')]])
    .setBackground(config.colors.error));

  return invoiceData.invoices;
}

function reconcileTransactions(transactions, invoices, accounts) {
  const usersMap = users.getUsers().reduce((usersMap, user) => {
    usersMap[user.key] = {
      userData: user,
      transactions: [],
      skippedInvoices: [],
      errorInvoices: []
    };
    return usersMap;
  }, {});

  const invoicesSpreadsheet = SpreadsheetApp.openById(config.ids.invoices);

  // TODO - same column for both sheets?
  const invoicesSheet = invoicesSpreadsheet.getSheetByName(config.sheetNames.invoicesTransactions);
  const invoiceReconcileCol = utils.getPosition(invoicesSheet, config.positioning.invoice.reconcileColumnLabel).startCol;

  invoices.forEach(invoice => {
    const user = usersMap[invoice.user];
    if (!user) {
      return addError('Socio desconocido', invoice, null, false, invoiceReconcileCol);
    }

    const accountTransactions = transactions[invoice.account];
    if (!accountTransactions) {
      return addError('Cuenta desconocida', invoice, user, false, invoiceReconcileCol);
    }

    const transaction = invoice.accountTransactionNumber && accountTransactions[invoice.accountTransactionNumber] ||
      invoice.number && accountTransactions[invoice.number];
    if (!transaction) {
      return addError('Sin conciliar', invoice, user, invoice.skipReconcile, invoiceReconcileCol);
    }

    transaction.invoices.push(invoice);

    if (transaction.invoices.length === 1) {
      user.transactions.push(transaction);
    }
  });

  const accountsBalanceSpreadsheet = SpreadsheetApp.openById(config.ids.accountsBalance);
  accounts.forEach(account => {
    const accountSheet = accountsBalanceSpreadsheet.getSheetByName(account.sheetName);
    const accountReconcileCol = utils.getPosition(accountSheet, config.positioning.accountBalance[account.key].reconcileColumnLabel).startCol;

    const accountTransactions = transactions[account.key];
    Object.keys(accountTransactions).forEach(transactionKey => {
      const transaction = accountTransactions[transactionKey];
      const invoiceData = transaction.invoices.reduce((invoiceData, invoice) => {
        invoiceData.sum += invoice.amount;

        if (invoiceData.users.indexOf(invoice.user) === -1) {
          invoiceData.users.push(invoice.user);
        }

        return invoiceData;
      }, {
        sum: 0,
        users: []
      });

      let message = 'Conciliado';
      transaction.reconciled = true;
      if (transaction.invoices.length === 0) {
        message = 'Sin conciliar';
        transaction.reconciled = false;
      } else if (invoiceData.users.length > 1) {
        message = 'Múltiples socios para una misma transacción: ' + transaction.users.join(', ');
        transaction.reconciled = false;
      } else if (!isEqual(transaction.value, invoiceData.sum)) {
        message = 'Monto no coincide';
        transaction.reconciled = false;
      }

      const color = transaction.reconciled ? config.colors.neutral : config.colors.error;
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

function isEqual(a, b) {
  // Floating point sucks for this things, so
  // if the diff is really small they are equal
  return Math.abs(a - b) < 0.00001;
}

function createUsersSpreadsheets(usersMap) {

  const categories = utils.getObject(config.sheetNames.transactionCategories);

  const { monthlyFromBeginning, monthlyFromAdmission } = config.transactionCategoryTypes;
  const monthlyCategories = categories
    .filter(category => category.type === monthlyFromBeginning || category.type === monthlyFromAdmission)
    .map(category => ({
      categoryData: category,
      monthlyValues: utils.getObject(category.key, {
        spreadsheetId: config.ids.invoiceCategoryMonthlyValues
      }).concat().sort(sortByObjectDate)
    }));

  const categoriesTypeHash = categories.reduce((categoriesTypeHash, category) => {
    categoriesTypeHash[category.key] = category.type
    return categoriesTypeHash;
  }, {});

  const organizationStartDate = new Date(config.organizationStartDate);

  Object.keys(usersMap).forEach(key => {
    const user = usersMap[key];
    const spreadsheetName = 'Nº ' + user.userData.number + ' ' + user.userData.name;
    const spreadsheetId = utils.getOrCreateSpreadsheet(spreadsheetName, config.ids.userBalancesFolder, config.sheetNames.balance);

    const userData = user.transactions.reduce(function (userData, transaction) {
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

    const monthsData = getUserMonthsData(monthlyCategories, user.userData, userData.categoryMap);

    let position = createSheet(user, spreadsheetId, monthsData, categoriesTypeHash, organizationStartDate);
    Object.keys(userData.accountCategoryMap).forEach(accountKey => {
      let accountCategories = userData.accountCategoryMap[accountKey];
      Object.keys(accountCategories).forEach(categoryKey => {
        const categoryInvoices = accountCategories[categoryKey];

        const tablePosition = createTable(position, accountKey, categoryKey, categoryInvoices);
        position = {
          row: position.row,
          col: tablePosition.col + 1,
          sheet: position.sheet
        }
      });
    });
  });
}

function sortByObjectDate(a, b) {
  return Date.parse(a.date) < Date.parse(b.date) ? -1 : 1;
}

function getMonth(months, categoryType, userStartDate, organizationStartDate) {

  if (categoryType === config.transactionCategoryTypes.monthlyFromAdmission) {
    return addMonthsToDateAndFormat(months, userStartDate)
  } else {
    return addMonthsToDateAndFormat(months, organizationStartDate)
  }
}

function addMonthsToDateAndFormat(months, date) {
  const newDate = new Date(date.getTime());

  // -1 because the start month should be paid too
  const monthsToAdd = months - 1;
  
  newDate.setUTCMonth(newDate.getUTCMonth() + monthsToAdd);
  return (newDate.getUTCMonth() + 1) + '/' + newDate.getUTCFullYear()
}

function addError(message, invoice, user, skipInvoice, invoiceReconcileCol) {
  invoice.sheet.getRange(invoice.rowIndex, invoiceReconcileCol, 1, 1)
    .setValues([[message]])
    .setBackground(config.colors.error);

  if (user) {
    if (skipInvoice) {
      user.skippedInvoices.push(invoice);
    } else {
      user.errorInvoices.push(invoice);
    }
  }
}

function addInvoicesToAccountCategoryMap(invoices, accountCategoryMap) {
  invoices.forEach(invoice => {
    let accountCategories = accountCategoryMap[invoice.account];
    if (!accountCategories) {
      accountCategories = accountCategoryMap[invoice.account] = {};
    }

    let categoryInvoices = accountCategories[invoice.category];
    if (!categoryInvoices) {
      categoryInvoices = accountCategories[invoice.category] = [];
    }

    categoryInvoices.push(invoice);
  });
}

function addInvoicesToCategoryMap(invoices, categoryMap) {
  invoices.forEach(invoice => {
    let categoryInvoices = categoryMap[invoice.category];
    if (!categoryInvoices) {
      categoryInvoices = categoryMap[invoice.category] = [];
    }

    categoryInvoices.push(invoice);
  });
}

function getUserMonthsData(monthlyCategories, user, userCategoryMap) {

  return monthlyCategories.reduce(function (monthsData, category) {
    const invoices = user.active && userCategoryMap[category.categoryData.key] || [];
    const sortedInvoices = invoices.concat().sort(sortByObjectDate);

    const categoryMonthsData = sortedInvoices.reduce(function (categoryMonthsData, invoice) {
      const categoryValueOnInvoiceDate = getCategoryValueOnDate(invoice.date, category.monthlyValues, user.type);
      if (categoryValueOnInvoiceDate !== 0) {
        const accumulatedValue = categoryMonthsData.remainder + invoice.value;

        if (accumulatedValue >= categoryValueOnInvoiceDate) {
          categoryMonthsData.months += Math.floor(accumulatedValue / categoryValueOnInvoiceDate);
          categoryMonthsData.remainder = accumulatedValue % categoryValueOnInvoiceDate;
        } else {
          categoryMonthsData.remainder = accumulatedValue;
        }
      }

      categoryMonthsData.total += invoice.value;

      return categoryMonthsData;
    }, {
      months: 0,
      remainder: 0,
      total: 0
    });

    monthsData[category.categoryData.key] = categoryMonthsData;

    return monthsData;
  }, {})
}

function getCategoryValueOnDate(date, monthlyValues, userType) {
  let value = 0;

  const parsedDate = Date.parse(date)
  for(let i = 0; i < monthlyValues.length; i++) {
    if (userType === monthlyValues[i].userType) {
      if (Date.parse(monthlyValues[i].date) > parsedDate) {
        break;
      }

      value = monthlyValues[i].value;
    }
  }

  return value;
}

function createSheet(user, spreadsheetId, monthsData, categoriesTypeHash, organizationStartDate) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  let sheet = spreadsheet.getSheetByName(config.sheetNames.balance);
  if (sheet) {
    sheet.clear();
    sheet.activate();
  } else {
    sheet = spreadsheet.insertSheet(config.sheetNames.balance, spreadsheet.getNumSheets());
  }
  const sheetTitle = user.userData.name;
  const headerLabels = texts.balance.headers;
  const headers = [
    [sheetTitle, '', '', ''],
    [headerLabels.userNumber, user.userData.number, headerLabels.userDocument, user.userData.document || '-'],
    // TODO - bug with start date (substracting 1 day [probably timezone])
    [headerLabels.admissionDate, user.userData.startDate, headerLabels.phone, user.userData.phone || '-']
  ];

  let row = 1;
  sheet.getRange(row, 1, headers.length, 4)
    .setValues(headers)
    .setBorder(true, true, true, true, true, true);

  sheet.getRange(row, 1, 1, headers[0].length)
    .mergeAcross()
    .setHorizontalAlignment('center');

  sheet.getRange(row + 2, 1)
    .setNumberFormat(config.formatting.date);

  row += headers.length + 1;

  if (user.userData.active) {
    const userStartDate = new Date(user.userData.startDate);
    userStartDate.setUTCDate(1)

    const monthRows = Object.keys(monthsData)
      .map(function (key) {
        const item = monthsData[key]
        return [
          key,
          item.total,
          getMonth(item.months, categoriesTypeHash[key], userStartDate, organizationStartDate),
          item.remainder
        ]
      })

    const monthsTable = [
      ['Resumen por categorías', '', '', ''],
      ['Categoría', 'Valor', 'Último mes pago', 'Remanente']
    ].concat(monthRows)

    sheet.getRange(row, 1, monthsTable.length, monthsTable[0].length)
      .setValues(monthsTable)
      .setBorder(true, true, true, true, true, true);

    sheet.getRange(row, 1, 1, monthsTable[0].length)
      .mergeAcross()
      .setHorizontalAlignment('center');

    row += monthsTable.length + 1
  }

  return {
    row: row,
    col: 1,
    sheet: sheet
  };
}

function createTable(position, accountKey, categoryKey, categoryInvoices) {
  let row = position.row,
    col = position.col;

  const headerLabels = texts.balance.transactions.headers;
  const transactionHeaders = [headerLabels.date, headerLabels.invoice, headerLabels.amount, headerLabels.value];
  const extraHeaders = [headerLabels.balance];
  const headers = transactionHeaders.concat(extraHeaders);

  const sheet = position.sheet;

  sheet.getRange(row, col, 1, 1)
    .setValues([[accountKey + ' ' + categoryKey]]);
  sheet.getRange(row, col, 1, headers.length)
    .mergeAcross()
    .setHorizontalAlignment('center');
  row = row + 1;

  sheet.getRange(row, col, 1, headers.length)
    .setValues([headers]);
  row = row + 1;

  categoryInvoices.sort(sortByObjectDate);
  const transactionValues = categoryInvoices.map(transaction => ([
    transaction.date,
    transaction.number || transaction.accountTransactionNumber,
    transaction.amount,
    transaction.value
  ]));
  sheet.getRange(row, col, transactionValues.length, transactionHeaders.length)
    .setValues(transactionValues);

  sheet.getRange(row, col + transactionHeaders.length)
    .setFormulasR1C1([['=R[0]C[-1]']]);

  if (transactionValues.length > 1) {
    const formulas = transactionValues.slice(1).map(function () {
      return ['=R[-1]C[0] + R[0]C[-1]'];
    });
    sheet.getRange(row + 1, col + transactionHeaders.length, transactionValues.length - 1, 1)
      .setFormulasR1C1(formulas);
  }

  sheet.getRange(row, col, transactionValues.length, 1)
    .setNumberFormat(config.formatting.date);

  sheet.getRange(row, col + 1, transactionValues.length, 1)
    .setNumberFormat('0');

  sheet.getRange(row, col + 2, transactionValues.length, 3)
    .setNumberFormat(config.formatting.decimalNumber);

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

module.exports = {
  reconcile: reconcile
};