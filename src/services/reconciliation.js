const texts = require('./texts')
const users = require('./users')
const config = require('./config')
const utils = require('./utils')
const log = require('./log')

function reconcile(shouldCreateUsersSpreadsheets) {
  const accounts = utils.getObject(config.sheetNames.accounts)
    .filter(account => account.sheetName);

  const transactions = getAccountsTransactions(accounts);

  const invoices = getInvoices(config.sheetNames.invoicesTransactions);
  const debits = getInvoices(config.sheetNames.debitsTransactions);

  const usersMap = reconcileTransactions(transactions, invoices.concat(debits), accounts);

  shouldCreateUsersSpreadsheets && createUsersSpreadsheets(usersMap);
}

function getAccountsTransactions(accounts) {
  const accountsSpreadsheet = SpreadsheetApp.openById(config.ids.accountsBalance);
  const descriptionsToFilterAccounts = utils.getObject(config.sheetNames.descriptionsToFilterAccounts)
    .reduce((descriptionsToFilterAccounts, description) => {
      const accountDescriptions = descriptionsToFilterAccounts[description.account] || (descriptionsToFilterAccounts[description.account] = {});
      accountDescriptions[description.key] = true;
      return descriptionsToFilterAccounts;
    }, {});

  return accounts.reduce((transactions, account) => {
    const accountTransactions = getAccountTransactions(account, accountsSpreadsheet, descriptionsToFilterAccounts[account.key] || {});

    transactions[account.key] = accountTransactions.reduce((accountTransactionsMap, transaction) => {
      const numberArray = accountTransactionsMap.number[transaction.number] || (accountTransactionsMap.number[transaction.number] = []);
      numberArray.push(transaction);
      if (transaction.id) {
        accountTransactionsMap.id[transaction.id] = transaction;
      }
      return accountTransactionsMap;
    }, {
      number: {},
      id: {},
    });

    return transactions;
  }, {});
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
    if (!row[account.numberIndex] && row[account.numberIndex] !== 0) {
      missing.push('Número de comprobante');
    }
    if (!missing.length) {
      transactionsData.transactions.push({
        value: (row[account.positiveValueIndex] || 0) - (row[account.negativeValueIndex] || 0),
        date: row[account.dateIndex],
        number: '' + row[account.numberIndex],
        id: '' + row[account.id],
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
  const commentsIndex = getPosition(invoiceLabels.comments);

  sheet.getRange(2, numberIndex + 1, sheet.getMaxRows() - 1, 1)
    .setNumberFormat(config.formatting.text);

  const range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns());

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
        number: '' + row[numberIndex],
        series: row[seriesIndex],
        category: row[categoryIndex],
        value: row[valueIndex],
        amount: row[amountIndex],
        skipReconcile: row[skipReconcileIndex] === 'Sí',
        accountTransactionNumber: '' + row[accountTransactionNumberIndex],
        comments: '' + row[commentsIndex],
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

    let transaction;
    transaction = invoice.accountTransactionNumber && accountTransactions.id[invoice.accountTransactionNumber] ||
      invoice.number && accountTransactions.id[invoice.number];

    if (!transaction) {
      const numberTransactions = invoice.accountTransactionNumber && accountTransactions.number[invoice.accountTransactionNumber] ||
        invoice.number && accountTransactions.number[invoice.number];
      if (numberTransactions) {
        if (numberTransactions.length === 1) {
          transaction = numberTransactions[0];
        } else {
          return addError('La cuenta tiene registros con el número duplicado', invoice, user, invoice.skipReconcile, invoiceReconcileCol);
        }
      }
    }

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
    Object.keys(accountTransactions.number).forEach(transactionNumber => {
      const transactionArray = accountTransactions.number[transactionNumber];
      transactionArray.forEach(transaction => {
        let message = 'Conciliado';
        transaction.reconciled = true;

        if (!transaction.id && transactionArray.length > 1) {
          message = 'Número duplicado, por favor ingrese un identificador';
          transaction.reconciled = false;
        } else if (transaction.invoices.length === 0) {
          message = 'Sin conciliar';
          transaction.reconciled = false;
        } else {
          const invoiceData = transaction.invoices.reduce((invoiceData, invoice) => {
            invoiceData.sum += invoice.amount;
            invoiceData.users.indexOf(invoice.user) === -1 && invoiceData.users.push(invoice.user)

            return invoiceData;
          }, {
            sum: 0,
            users: []
          });

          if (invoiceData.users.length > 1) {
            message = 'Múltiples socios para una misma transacción: ' + transaction.users.join(', ');
            transaction.reconciled = false;
          } else if (!isEqual(transaction.value, invoiceData.sum)) {
            message = 'Monto no coincide';
            transaction.reconciled = false;
          }
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
      })
    });
  });

  return usersMap;
}

function isEqual(a, b) {
  // TODO - improve
  // Floating point sucks for this things, so
  // if the diff is really small they are equal
  return Math.abs(a - b) < 0.00001;
}

const monthlyCategoriesFilter = category => category.type === config.transactionCategoryTypes.monthlyFromBeginning || category.type === config.transactionCategoryTypes.monthlyFromAdmission;

const getCategoryTypeValueChanges = category => utils.getObject(category.key, {
  spreadsheetId: config.ids.invoiceCategoryMonthlyValues
}).sort(sortByObjectDate)
  .map(valueChange => ({
    ...valueChange,
    date: Date.UTC(valueChange.date.getFullYear(), valueChange.date.getMonth())
  }))
  .reduce((typeMonthlyChanges, valueChange) => ({
    ...typeMonthlyChanges,
    [valueChange.userType]: (typeMonthlyChanges[valueChange.userType] || []).concat(valueChange)
  }), {})

function createUsersSpreadsheets(usersMap) {
  const categoriesData = utils.getObject(config.sheetNames.transactionCategories)
    .reduce((categoriesData, category) => {
      if (monthlyCategoriesFilter(category)) {
        categoriesData.monthly.push({
          category,
          typeMonthlyChanges: getCategoryTypeValueChanges(category)
        });
      } else {
        categoriesData.other.push(category);
      }
      return categoriesData;
    }, {
      monthly: [],
      other: [],
    });

  const getOrCreateSpreadsheet = utils.getOrCreateSpreadsheet(config.ids.userBalancesFolder)
  Object.keys(usersMap).forEach(key => {
    const user = usersMap[key];
    const spreadsheetName = users.getSpreadsheetName(user.userData);
    const spreadsheetId = getOrCreateSpreadsheet(spreadsheetName, config.sheetNames.balance);

    const categoryMap = user.transactions.reduce(function (categoryMap, transaction) {
      if (transaction.reconciled) {
        addInvoicesToCategoryMap(transaction.invoices, categoryMap);
      }
      return categoryMap;
    }, {});
    addInvoicesToCategoryMap(user.skippedInvoices, categoryMap);

    const monthsData = getUserMonthsData(categoriesData.monthly, user.userData, categoryMap);

    let position = createSheet(user, spreadsheetId, monthsData);

    categoriesData.monthly.forEach(({ category }) => {
      const categoryInvoices = categoryMap[category.key];

      if (!categoryInvoices || !categoryInvoices.length) {
        return position;
      }
      const tablePosition = createTable(position, category.key, categoryInvoices, false);
      position = {
        ...position,
        row: tablePosition.row + 1,
      }
    });

    const otherInvoices = categoriesData.other.reduce((invoices, category) =>
      invoices.concat((categoryMap[category.key] || []).map(categoryTransaction => ({
        ...categoryTransaction,
        category,
      }))), []);
    if (otherInvoices.length) {
      const tablePosition = createTable(position, 'Otros', otherInvoices, true);
      position = {
        ...position,
        col: tablePosition.col + 1,
      }
    }
  });
}

function sortByObjectDate(a, b) {
  return Date.parse(a.date) < Date.parse(b.date) ? -1 : 1;
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

function addInvoicesToCategoryMap(invoices, categoryMap) {
  invoices.forEach(invoice => {
    let categoryInvoices = categoryMap[invoice.category];
    if (!categoryInvoices) {
      categoryInvoices = categoryMap[invoice.category] = [];
    }

    categoryInvoices.push(invoice);
  });
}

const getDateMonth = date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth()))
const getNextMonth = date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1));

const getUserMonthsData = (monthlyCategoriesData, user, userCategoryMap) =>
  monthlyCategoriesData.map((monthlyCategoryData) => {
    const startDate = monthlyCategoryData.category.type === config.transactionCategoryTypes.monthlyFromBeginning ? monthlyCategoryData.category.startDate.getTime() : user.startDate
    const typeMonthlyChanges = monthlyCategoryData.typeMonthlyChanges[user.type]
    const getTypeMonthlyChange = date => typeMonthlyChanges.reduce((dateTypeMonthlyChange, typeMonthlyChange) => typeMonthlyChange.date <= date && typeMonthlyChange.date > dateTypeMonthlyChange.date ? typeMonthlyChange : dateTypeMonthlyChange, typeMonthlyChanges[0])
    const invoices = userCategoryMap[monthlyCategoryData.category.key] || []
    const total = invoices.reduce((total, invoice) => total + invoice.value, 0)


    const lastPaidMonth = getDateMonth(new Date(startDate))
    lastPaidMonth.setUTCMonth(lastPaidMonth.getUTCMonth() - 1);
    let paid = 0;
    let monthValue = getTypeMonthlyChange(getNextMonth(lastPaidMonth).getTime()).value;

    while (paid + monthValue <= total) {
      lastPaidMonth.setUTCMonth(lastPaidMonth.getUTCMonth() + 1);
      paid += monthValue
      monthValue = getTypeMonthlyChange(getNextMonth(lastPaidMonth).getTime()).value;
    }

    return {
      key: monthlyCategoryData.category.key,
      total,
      paid,
      lastPaidMonth,
    };
  });

function createSheet(user, spreadsheetId, monthsData) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  let sheet = spreadsheet.getSheetByName(config.sheetNames.balance);
  if (sheet) {
    const sheetMaxRows = sheet.getMaxRows();
    sheet.insertRowsAfter(sheetMaxRows, 200);
    sheet.deleteRows(1, sheetMaxRows);
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
    [headerLabels.admissionDate, new Date(user.userData.startDate), headerLabels.phone, user.userData.phone || '-']
  ];

  let row = 1;
  sheet.getRange(row, 1, headers.length, 4)
    .setValues(headers)
    .setBorder(true, true, true, true, true, true);

  sheet.getRange(row, 1, 1, headers[0].length)
    .mergeAcross()
    .setHorizontalAlignment('center')
    .setBackground(config.colors.headers)
    .setFontWeight('bold');

  sheet.getRange(row + 2, 1)
    .setNumberFormat(config.formatting.date);

  row += headers.length + 1;

  if (user.userData.active) {
    const userStartDate = new Date(user.userData.startDate);
    userStartDate.setUTCDate(1)

    const monthRows = monthsData
      .map(monthData => [
        monthData.key,
        monthData.total,
        monthData.paid,
        `${('0' + (monthData.lastPaidMonth.getUTCMonth() + 1)).slice(-2)}/${monthData.lastPaidMonth.getUTCFullYear()}`,
        monthData.total - monthData.paid
      ])

    const monthsHeaders = [
      ['Resumen por categorías', '', '', '', ''],
      ['Categoría', 'Total', 'Total pago', 'Último mes pago', 'Remanente']
    ];
    const monthsTable = monthsHeaders.concat(monthRows)

    sheet.getRange(row, 1, monthsHeaders.length, monthsTable[0].length)
      .setBackground(config.colors.headers)
      .setFontWeight('bold');

    sheet.getRange(row, 1, monthsTable.length, monthsTable[0].length)
      .setValues(monthsTable)
      .setBorder(true, true, true, true, true, true);

    sheet.getRange(row + monthsHeaders.length, 2, monthRows.length, 1)
      .setNumberFormat(config.formatting.decimalNumber);

    sheet.getRange(row + monthsHeaders.length, 3, monthRows.length, 1)
      .setNumberFormat(config.formatting.decimalNumber);

    sheet.getRange(row + monthsHeaders.length, 4, monthRows.length, 1)
      .setNumberFormat(config.formatting.month);

    sheet.getRange(row + monthsHeaders.length, 5, monthRows.length, 1)
      .setNumberFormat(config.formatting.decimalNumber);

    sheet.getRange(row, 1, 1, monthsTable[0].length)
      .mergeAcross()
      .setHorizontalAlignment('center');

    row += monthsTable.length + 1
  }

  return {
    row,
    col: 1,
    sheet,
  };
}

function createTable(position, name, invoices, manyCategories) {
  let row = position.row,
    col = position.col;

  const headerLabels = texts.balance.transactions.headers;
  const dataHeaders = [headerLabels.date]
    .concat(manyCategories ? headerLabels.category : [])
    .concat([headerLabels.account, headerLabels.invoice, headerLabels.amount, headerLabels.value]);
  const computedHeaders = manyCategories ? [] : [headerLabels.balance];
  const headers = dataHeaders.concat(computedHeaders);

  const sheet = position.sheet;

  sheet.getRange(row, col, 1, 1)
    .setValues([[name]]);
  sheet.getRange(row, col, 1, headers.length)
    .mergeAcross()
    .setHorizontalAlignment('center')
    .setBackground(config.colors.headers)
    .setFontWeight('bold');
  row = row + 1;

  sheet.getRange(row, col, 1, headers.length)
    .setValues([headers])
    .setBackground(config.colors.headers)
    .setFontWeight('bold');
  row = row + 1;

  invoices.sort(sortByObjectDate);
  const values = invoices.map((invoice, index) => ([
    invoice.date,
  ]
    .concat(manyCategories ? invoice.category.key : [])
    .concat([
      invoice.account,
      invoice.number || invoice.accountTransactionNumber || invoice.comments,
      invoice.amount,
      invoice.value
    ])));
  sheet.getRange(row, col, values.length, dataHeaders.length)
    .setValues(values);

  if (computedHeaders.length) {
    sheet.getRange(row, col + dataHeaders.length)
      .setFormulasR1C1([['=R[0]C[-1]']]);

    if (values.length > 1) {
      const formulas = values.slice(1).map(() => ['=R[-1]C[0] + R[0]C[-1]']);
      sheet.getRange(row + 1, col + dataHeaders.length, values.length - 1, 1)
        .setFormulasR1C1(formulas);
    }
  }

  const categoryShift = manyCategories ? 1 : 0;

  sheet.getRange(row, col, values.length, 1)
    .setNumberFormat(config.formatting.date);

  if (manyCategories) {
    sheet.getRange(row, col + 1, values.length, 1)
      .setNumberFormat(config.formatting.text);
  }

  sheet.getRange(row, col + categoryShift + 1, values.length, 1)
    .setNumberFormat(config.formatting.text);

  sheet.getRange(row, col + categoryShift + 2, values.length, 1)
    .setNumberFormat(config.formatting.text);

  sheet.getRange(row, col + categoryShift + 3, values.length, 3)
    .setNumberFormat(config.formatting.decimalNumber);

  row = row + values.length;

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