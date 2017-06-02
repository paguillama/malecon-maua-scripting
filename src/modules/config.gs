Config = {
  ids: {
    userBalancesFolder: '0B-8lg-RJkLm3YmFlRGJSZi1rNm8',
    usersSpreadsheet: '1-PkcLTxb8NCK3ufhLFDRlyaAV6mEv2npioQP1ieDH0Q',
    accountsBalance: '1YVh1lq7XgI6RpnUpjtAcBMYyT7udA9fZuIvBnHu49zY',
    configSpreadsheet: '1lAZM_7DSeyRv8qoOrQA0O0WpIh7Sy95d3kKpMZ55pkM',
    invoices: '1DYSFGhBrNikHILmF4rPEdWqUfFC7CMppf4XnHLeXfgg',
    invoiceCategoryMonthlyValues: '1YbAZMu4YQeUn7s4r9_AQnoBJxnTHgarI8s8Z988YiL0'
  },
  organizationStartDate: '2009-01-01T03:00:00.000Z',
  sheetNames: {
    balance: 'Balance',
    users: 'Lista',
    attendanceStatus: 'Estados de asistencias',
    attendanceTypes: 'Tipos de asistencias',
    userAttendance: 'Asistencias de socios',
    invoicesTransactions: 'Comprobantes',
    debitsTransactions: 'Débitos',
    transactionCategories: 'Categorías de transacciones',
    accounts: 'Cuentas'
  },
  transactionCategoryTypes: {
    monthlyFromBeginning: 'Mensual desde inicio',
    monthlyFromAdmission: 'Mensual desde ingreso'
  },
  formatting: {
    date: 'yyy-mm-dd',
    decimalNumber: '#,##0.00'
  },
  colors: {
    error: '#f4c7c3',
    neutral: 'white',
    success: '#b7e1cd'
  },
  positioning: {
    attendance: {
      status: {
        startRow: 2,
        startCol: 3
      },
      types: {
        startRow: 2,
        startCol: 2
      },
      users: {
        startRow: 1,
        startCol: 3
      }
    },
    invoice: {
      startRow: 2,
      categoriesColumnLabel: 'Categoría',
      userColumnLabel: 'Socio',
      accountColumnLabel: 'Cuenta',
      dateColumnLabel: 'Fecha',
      numberColumnLabel: 'Número recibo',
      seriesColumnLabel: 'Serie recibo',
      valueColumnLabel: 'Valor',
      amountColumnLabel: 'Monto',
      reconcileColumnLabel: 'Conciliación',
      skipReconcileColumnLabel: 'Evadir concicliación',
      accountTransactionNumberColumnLabel: 'Comprobante'
    },
    accountBalance: {
      BHU: {
        startRow: 2,
        reconcileColumnLabel: 'Conciliación'
      },
      BROU: {
        startRow: 2,
        reconcileColumnLabel: 'Conciliación'
      }
    },
    accounts: {
      startRow: 2,
      keyColumnLabel: 'key'
    },
    users: {
      startRow: 2,
      keyColumnLabel: 'Key'
    }
  },
  accounts: [{
    name: 'BHU',
    key: 'BHU',
    sheetName: 'BHU',
    indexes: {
      // TODO - calculate them with header texts
      key: 7,
      positiveValue: 5,
      negativeValue: 4,
      date: 0,
      invoice: 3
    }
  }, {
    name: 'BROU',
    key: 'BROU',
    sheetName: 'BROU',
    indexes: {
      // TODO - calculate them with header texts
      key: 8,
      positiveValue: 6,
      negativeValue: 5,
      date: 0,
      invoice: 2
    }
  }]
};