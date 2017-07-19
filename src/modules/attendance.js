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

      return a.number < b.number ? -1 : 1;
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

function takeAttendance () {
  const sheet = SpreadsheetApp.openById(config.ids.userAttendance)
    .getSheetByName(config.sheetNames.userAttendance);

  const startRow = config.positioning.attendance.users.startRow
  const startCol = config.positioning.attendance.users.startCol

  const userIndexes = sheet.getRange(startRow, startCol, 1, sheet.getMaxColumns() - startCol + 1)
    .getValues()[0]
    .reduce((userIndexes, userKey, index) => ({
      ...userIndexes,
      [userKey]: index
    }), {})

  const events = sheet.getRange(2, 1, sheet.getMaxRows() - 1, 2)
    .getValues()
    .map(eventRow => ({
      date: eventRow[0],
      type: eventRow[1],
    }))

  const attendance = sheet.getRange(2, 3, sheet.getMaxRows() - 1, sheet.getMaxColumns() - startCol + 1)
    .getValues()

  const attendanceStatusMap = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.attendanceStatus)
    .reduce((attendanceStatus, row) => ({
      ...attendanceStatus,
      [row[0]]: true
    }), {});

  const summary = users.getUsers()
    .map(user => {
      const userIndex = userIndexes[user.key]
      return {
        user,
        eventsAttendance: events.map((event, eventIndex) => {
          const userAttendance = (userIndex || userIndex === 0) && attendance[eventIndex][userIndex]
          return {
            event,
            attendance: userAttendance && attendanceStatusMap[userAttendance] && userAttendance || null
          }
        })
      }
    })

  Browser.msgBox(JSON.stringify(summary));
}

module.exports = {
  checkAttendanceList: checkAttendanceList,
  checkAttendanceTypes: checkAttendanceTypes,
  updateUsers: updateUsers,
  takeAttendance: takeAttendance
};
