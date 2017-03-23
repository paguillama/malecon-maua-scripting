MaleconConfig = {
  ids: {
    userBalancesFolder: '0B1HKgEsP1qLNa2wyMmo1QnB4TlU',
    usersSpreadsheet: '1R0_cB60QtY5CpXZW7BDnwJlWtu6KIMUTUw_Q-q2D0eQ'
  },
  sheetNames: {
    balance: 'Balance',
    users: 'Socios'
  },
  formatting: {
    date: 'dd/MM/yyyy'
  },
  accounts: [{
    name: 'BHU',
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