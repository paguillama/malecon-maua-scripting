Config = {
  ids: {
    userBalancesFolder: '0B-8lg-RJkLm3YmFlRGJSZi1rNm8',
    usersSpreadsheet: '1-PkcLTxb8NCK3ufhLFDRlyaAV6mEv2npioQP1ieDH0Q',
    configSpreadsheet: '1lAZM_7DSeyRv8qoOrQA0O0WpIh7Sy95d3kKpMZ55pkM',
    invoices: '1DYSFGhBrNikHILmF4rPEdWqUfFC7CMppf4XnHLeXfgg'
  },
  sheetNames: {
    balance: 'Balance',
    users: 'Lista',
    attendanceStatus: 'Estados de asistencias',
    attendanceTypes: 'Tipos de asistencias',
    userAttendance: 'Asistencias de socios',
    invoicesTransactions: 'Comprobantes',
    transactionCategories: 'Categorías de transacciones',
    accounts: 'Cuentas'
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
      categories: {
        startRow: 2,
        startCol: 6
      },
      sourceUserKeys: {
        startRow: 2,
        startCol: 3
      },
      targetUserKeys: {
        startRow: 2,
        startCol: 2
      },
      accounts: {
        startRow: 2,
        startCol: 3
      },
      value: {
        startRow: 2,
        startCol: 7
      }
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