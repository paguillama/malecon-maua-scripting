MaleconAttendance = (function () {

  function checkAttendanceList(){
    var startRow = MaleconConfig.positioning.attendance.status.startRow,
      startCol = MaleconConfig.positioning.attendance.status.startCol;

    var values = MaleconUtils.getValues(MaleconConfig.ids.configSpreadsheet, MaleconConfig.sheetNames.attendanceStatus);
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.userAttendance);
    var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns() - startCol + 1);

    MaleconUtils.createValueInListValidation(values, range);
  }

  function checkAttendanceTypes(){
    var startRow = MaleconConfig.positioning.attendance.types.startRow,
      startCol = MaleconConfig.positioning.attendance.types.startCol;

    var values = MaleconUtils.getValues(MaleconConfig.ids.configSpreadsheet, MaleconConfig.sheetNames.attendanceTypes);
    var sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.userAttendance);
    var range = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);

    MaleconUtils.createValueInListValidation(values, range);
  }

  function updateUsers() {
    var usersKeyMap = MaleconUsers.getUsersMap();
    
    var usersData = Object.keys(usersKeyMap).reduce(function (usersData, key) {
      usersData[key] = {
        user: usersKeyMap[key],
        key: key
      };
      return usersData;
    }, {});

    var startRow = MaleconConfig.positioning.attendance.users.startRow,
      startCol = MaleconConfig.positioning.attendance.users.startCol,
      sheet = SpreadsheetApp.getActive().getSheetByName(MaleconConfig.sheetNames.userAttendance),
      attendanceRows = [],
      rangeRows = sheet.getMaxRows() - startRow + 1;

    if (MaleconConfig.positioning.attendance.users.startCol <= sheet.getMaxColumns()) {
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
      targetRange.setBackground(MaleconConfig.colors[color]);
    });
  }

  return {
    checkAttendanceList: checkAttendanceList,
    checkAttendanceTypes: checkAttendanceTypes,
    updateUsers: updateUsers
  };
})();