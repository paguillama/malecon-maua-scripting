const config = require('./config')
const utils = require('./utils')
const users = require('./users')

function checkAttendanceList(range){
  const startRow = config.positioning.attendance.status.startRow,
    startCol = config.positioning.attendance.status.startCol;

  const values = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.attendanceStatus);
  let rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    const sheet = SpreadsheetApp.getActive().getSheetByName(config.sheetNames.userAttendance);
    rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, sheet.getMaxColumns() - startCol + 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function checkAttendanceTypes(range){
  const startRow = config.positioning.attendance.types.startRow,
    startCol = config.positioning.attendance.types.startCol;

  const values = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.attendanceTypes);

  let rangeToValidate;
  if (range) {
    rangeToValidate = range;
  } else {
    const sheet = SpreadsheetApp.getActive().getSheetByName(config.sheetNames.userAttendance);
    rangeToValidate = sheet.getRange(startRow, startCol, sheet.getMaxRows() - startRow + 1, 1);
  }

  utils.createValueInListValidation(values, rangeToValidate);
}

function updateUsers() {
  const usersKeyMap = users.getUsersMap();

  const usersData = Object.keys(usersKeyMap).reduce((usersData, key) => {
    usersData[key] = {
      user: usersKeyMap[key],
      key: key
    };
    return usersData;
  }, {});

  const startRow = config.positioning.attendance.users.startRow,
    startCol = config.positioning.attendance.users.startCol,
    sheet = SpreadsheetApp.getActive().getSheetByName(config.sheetNames.userAttendance),
    rangeRows = sheet.getMaxRows() - startRow + 1;

  let attendanceRows = [];

  if (config.positioning.attendance.users.startCol <= sheet.getMaxColumns()) {
    const range = sheet.getRange(startRow, startCol, rangeRows, sheet.getMaxColumns() - startCol + 1);

    const rangeValues = range.getValues();
    const indexHash = {};
    rangeValues[0].forEach(function (key, valueIndex) {
      if (key) {
        let userData = usersData[key];
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
    attendanceRows.forEach(row => row.forEach((value, valueIndex) => {
      indexHash[valueIndex].attendance.push(value);
    }));
  }

  const usersArray = Object.keys(usersData)
    .map(key => usersData[key])
    .sort((a, b) => {
      if (!b.user && a.user) {
        return -1;
      }

      if (!a.user && b.user) {
        return 1;
      }

      return a.key < b.key ? -1 : 1;
    });

  const newValues = [ usersArray.map(user => user.key) ];
  for(let i = 0; i <= rangeRows - 2; i++) {
    const rowArray = usersArray.map(userData => (userData.attendance || {})[i] || '');
    newValues.push(rowArray);
  }

  const targetRange = sheet.getRange(startRow, startCol, rangeRows, usersArray.length);
  targetRange.clear();
  targetRange.setValues(newValues);

  usersArray.forEach((user, index) => {
    const color = !user.user ? 'error' : 'neutral';
    sheet.getRange(startRow, startCol + index)
      .setBackground(config.colors[color]);
  });
}

module.exports = {
  checkAttendanceList: checkAttendanceList,
  checkAttendanceTypes: checkAttendanceTypes,
  updateUsers: updateUsers
};
