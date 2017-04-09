Attendance = (function () {

  function checkAttendanceList(range){
    var startRow = Config.positioning.attendance.status.startRow,
      startCol = Config.positioning.attendance.status.startCol;

    var values = Utils.getValues(Config.ids.configSpreadsheet, Config.sheetNames.attendanceStatus);
    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.userAttendance);
      rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns() - startCol + 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function checkAttendanceTypes(range){
    var startRow = Config.positioning.attendance.types.startRow,
      startCol = Config.positioning.attendance.types.startCol;

    var values = Utils.getValues(Config.ids.configSpreadsheet, Config.sheetNames.attendanceTypes);

    var rangeToValidate;
    if (range) {
      rangeToValidate = range;
    } else {
      var sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.userAttendance);
      rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);
    }

    Utils.createValueInListValidation(values, rangeToValidate);
  }

  function updateUsers() {
    var usersKeyMap = Users.getUsersMap();
    
    var usersData = Object.keys(usersKeyMap).reduce(function (usersData, key) {
      usersData[key] = {
        user: usersKeyMap[key],
        key: key
      };
      return usersData;
    }, {});

    var startRow = Config.positioning.attendance.users.startRow,
      startCol = Config.positioning.attendance.users.startCol,
      sheet = SpreadsheetApp.getActive().getSheetByName(Config.sheetNames.userAttendance),
      attendanceRows = [],
      rangeRows = sheet.getMaxRows() - startRow + 1;

    if (Config.positioning.attendance.users.startCol <= sheet.getMaxColumns()) {
      var range = sheet.getRange(startRow, startCol, rangeRows, sheet.getMaxColumns() - startCol + 1);

      var rangeValues = range.getValues();
      var indexHash = {};
      rangeValues[0].forEach(function (key, valueIndex) {
        if (key) {
          var userData = usersData[key];
          if (!userData) {
            userData = usersData[key] = {
              key: key
            };
          }

          if (userData.attendance) {
            throw Error('El usuario ' + key + ' está repetido.');
          }
          userData.attendance = [];
          indexHash[valueIndex] = userData;
        } else {
          throw Error('Columna ' + (valueIndex + 1) + ' vacía.');
        }
      });

      attendanceRows = rangeValues.slice(1);
      attendanceRows.forEach(function (row) {
        row.forEach(function (value, valueIndex) {
          indexHash[valueIndex].attendance.push(value);
        });
      });
    }

    var usersArray = Object.keys(usersData).map(function (key) {
      return usersData[key];
    }).sort(function (a, b) {
      if (!b.user && a.user) {
        return -1;
      }

      if (!a.user && b.user) {
        return 1;
      }

      return a.key < b.key ? -1 : 1;
    });

    var userKeys = usersArray.map(function (user) {
      return user.key;
    });
    var newValues = [ userKeys ];
    for(var i = 0; i <= rangeRows - 2; i++) {
      var rowArray = usersArray.map(function (userData) {
        return (userData.attendance || {})[i] || '';
      });

      newValues.push(rowArray);
    }

    var targetRange = sheet.getRange(startRow, startCol, rangeRows, usersArray.length);
    targetRange.clear();
    targetRange.setValues(newValues);

    usersArray.forEach(function (user, index) {
      var targetRange = sheet.getRange(startRow, startCol + index);
      var color = !user.user ? 'error' : 'neutral';
      targetRange.setBackground(Config.colors[color]);
    });
  }

  return {
    checkAttendanceList: checkAttendanceList,
    checkAttendanceTypes: checkAttendanceTypes,
    updateUsers: updateUsers
  };
})();