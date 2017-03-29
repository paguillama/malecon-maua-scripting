MaleconConfig = {
  ids: {
    userBalancesFolder: '0B-8lg-RJkLm3YmFlRGJSZi1rNm8',
    usersSpreadsheet: '1-PkcLTxb8NCK3ufhLFDRlyaAV6mEv2npioQP1ieDH0Q',
    attendanceStatusSpreadsheet: '1lAZM_7DSeyRv8qoOrQA0O0WpIh7Sy95d3kKpMZ55pkM',
    invoices: '1DYSFGhBrNikHILmF4rPEdWqUfFC7CMppf4XnHLeXfgg'
  },
  sheetNames: {
    balance: 'Balance',
    users: 'Lista',
    attendance: 'Estados de asistencias',
    invoicesTransactions: 'Comprobantes'
  },
  formatting: {
    date: 'yyy-mm-dd'
  },
  colors: {
    error: '#f4c7c3',
    success: '#b7e1cd'
  },
  positioning: {
    attendance: {
      startRow: 3,
      startCol: 3
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