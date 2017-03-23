MaleconBalance = (function () {

  function generateUserData() {

    function processRow(rowValue, account, userData) {
      if ((rowValue[account.indexes.positiveValue] || rowValue[account.indexes.negativeValue]) && rowValue[account.indexes.date]) {
        userData.transactions[account.sheetName].push({
          value: (rowValue[account.indexes.positiveValue] || 0) - (rowValue[account.indexes.negativeValue] || 0),
          date: rowValue[account.indexes.date],
          invoice: rowValue[account.indexes.invoice]
        });
      } else {
        // TODO - handle it
      }
    }

    function fillUserSpreadsheet(userData) {

      function createSheet() {
        var spreadsheet = SpreadsheetApp.openById(userData.spreadsheetId);

        sheet = spreadsheet.getSheetByName(MaleconConfig.sheetNames.balance);
        if (sheet) {
          sheet.clear();
          sheet.activate();
        } else {
          sheet = spreadsheet.insertSheet(MaleconConfig.sheetNames.balance, spreadsheet.getNumSheets());
        }
        var sheetTitle = userData.name;
        var headerLabels = MaleconTexts.balance.headers;
        var headers = [
          [sheetTitle, '', '', ''],
          [headerLabels.userNumber, userData.number, headerLabels.userDocument, userData.document || '-'],
          // TODO - bug with start date (substracting 1 day [probably timezone])
          [headerLabels.admissionDate, userData.startDate, headerLabels.phone, userData.phone || '-']
        ];

        var row = 1;
        sheet.getRange(row, 1, headers.length, 4)
          .setValues(headers)
          .setBorder(true, true, true, true, true, true);

        sheet.getRange(row, 1, 1, headers[0].length)
          .mergeAcross()
          .setHorizontalAlignment('center');

        sheet.getRange(row + 2, 1)
          .setNumberFormat(MaleconConfig.formatting.date);

        row = row + headers.length + 1;

        return {
          row: row,
          col: 1
        };
      }

      function createTransactions(position, account) {
        var row = position.row,
          col = position.col;

        var transactionLabels = MaleconTexts.balance.transactions;
        var transactionHeaders = [transactionLabels.headers.date, transactionLabels.headers.invoice, transactionLabels.headers.value];
        var extraHeaders = [transactionLabels.headers.balance];
        var headers = transactionHeaders.concat(extraHeaders);

        sheet.getRange(row, col, 1, 1)
          .setValues([[account.name]]);
        sheet.getRange(row, col, 1, headers.length)
          .mergeAcross()
          .setHorizontalAlignment('center');
        row = row + 1;

        var transactions = userData.transactions[account.sheetName];
        if (transactions.length) {

          sheet.getRange(row, col, 1, headers.length)
            .setValues([headers]);
          row = row + 1;

          var transactionValues = transactions.map(function (transaction) {
            return [
              transaction.date,
              transaction.invoice,
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

            sheet.getRange(row, col, transactionValues.length, 1)
              .setNumberFormat(MaleconConfig.formatting.date);
          }

          row = row + transactionValues.length;
        } else {
          sheet.getRange(row, col, 1, 1)
            .setValues([[MaleconTexts.balance.transactions.noDataMessage]]);
          sheet.getRange(row, col, 1, headers.length)
            .mergeAcross()
            .setHorizontalAlignment('center');
          row = row + 1;
        }

        col = col + headers.length;
        sheet.getRange(position.row, position.col, row - position.row, col - position.col)
          .setBorder(true, true, true, true, true, true);

        return {
          row: row,
          col: col
        }
      }

      var sheet = null;
      var position = createSheet();

      MaleconConfig.accounts.forEach(function (account) {
        var accountPosition = createTransactions(position, account);
        position = {
          row: position.row,
          col: accountPosition.col + 1
        }
      });
    }

    var spreadsheet = SpreadsheetApp.getActive();

    var usersMap = MaleconUsers.getUsersMap();

    MaleconConfig.accounts.forEach(function (account) {
      var sheet = spreadsheet.getSheetByName(account.sheetName);

      var row = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
      var rowValues = row.getValues();

      rowValues.forEach(function (rowValue) {
        var key = rowValue[account.indexes.key];
        if (!key || !usersMap[key]) {
          // TODO - handle it - other checks (value, date, etc)
          // Browser.msgBox('Error', 'Row does not contain key.' + JSON.stringify(rowValue), Browser.Buttons.OK);
          return;
        }

        processRow(rowValue, account, usersMap[key]);
      });
    });

    Object.keys(usersMap).forEach(function (key) {
      var user = usersMap[key];
      var spreadsheetName = 'Nº ' + user.number + ' ' + user.name;
      user.spreadsheetId = MaleconUtils.createSpreadsheet(spreadsheetName, MaleconConfig.ids.userBalancesFolder, MaleconConfig.sheetNames.balance);
      fillUserSpreadsheet(user);
    });
  }
  
  return {
    generateUserData: generateUserData
  };
})();