const config = require('./config')
const utils = require('./utils')
const users = require('./users')
const texts = require('./texts')

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

  const eventsData = sheet.getRange(2, 1, sheet.getMaxRows() - 1, 2)
    .getValues()
    .map((eventRow, index) => ({
      event: {
        date: eventRow[0],
        type: eventRow[1],
      },
      index
    }))

  const attendance = sheet.getRange(2, 3, sheet.getMaxRows() - 1, sheet.getMaxColumns() - startCol + 1)
    .getValues()

  const attendanceStatusMap = utils.getValues(config.ids.configSpreadsheet, config.sheetNames.attendanceStatus)
    .reduce((attendanceStatus, [key]) => ({
      ...attendanceStatus,
      [key]: key,
    }), {});

  const getOrCreateSpreadsheet = utils.getOrCreateSpreadsheet(config.ids.userBalancesFolder);
  users.getUsers()
    .map(user => {
      const userIndex = userIndexes[user.key]
      const eventsAttendance = eventsData
        .filter(eventData => {
          const eventDate = Date.parse(eventData.event.date)
          return !eventDate || (eventDate >= Date.parse(user.startDate) && (user.endDate === '-' || eventDate <= Date.parse(user.endDate)))
        })
        .map(eventData => {
          const userAttendance = (userIndex || userIndex === 0) && attendance[eventData.index][userIndex]
          return {
            event: eventData.event,
            attendance: userAttendance && attendanceStatusMap[userAttendance] || null,
          }
        })

      const attendancesByStatus = eventsAttendance.reduce((attendancesByStatus, eventAttendance) => {
        // TODO - 'noAttendance' namespacing (collisions)
        const newValue = (attendancesByStatus[eventAttendance.attendance || 'noAttendance'] || 0) + 1
        attendancesByStatus[eventAttendance.attendance || 'noAttendance'] = newValue
        return attendancesByStatus
      }, {})

      return {
        user,
        eventsAttendance,
        attendancesByStatus
      }
    })
    .forEach(userData => {
      const spreadsheetName = 'Nº ' + userData.user.number + ' ' + userData.user.name;
      const spreadsheetId = getOrCreateSpreadsheet(spreadsheetName, config.sheetNames.attendance);
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

      let sheet = spreadsheet.getSheetByName(config.sheetNames.attendance);
      if (sheet) {
        sheet.clear();
        sheet.activate();
      } else {
        sheet = spreadsheet.insertSheet(config.sheetNames.attendance, spreadsheet.getNumSheets());
      }
      const sheetTitle = userData.user.name;
      const headerLabels = texts.balance.headers;
      const headers = [
        [sheetTitle, '', '', ''],
        [headerLabels.userNumber, userData.user.number, headerLabels.userDocument, userData.user.document || '-'],
        // TODO - bug with start date (substracting 1 day [probably timezone])
        [headerLabels.admissionDate, userData.user.startDate, headerLabels.phone, userData.user.phone || '-']
      ];

      let row = 1;
      sheet.getRange(row, 1, headers.length, headers[0].length)
        .setValues(headers)
        .setBorder(true, true, true, true, true, true);

      sheet.getRange(row, 1, 1, headers[0].length)
        .mergeAcross()
        .setHorizontalAlignment('center');

      sheet.getRange(row + 2, 1)
        .setNumberFormat(config.formatting.date);

      row += headers.length + 1;

      const attendanceTable = userData.eventsAttendance.map(eventAttendance => [
        eventAttendance.event.date,
        eventAttendance.event.type,
        eventAttendance.attendance || '-',
      ])

      let col = 1;
      if (attendanceTable.length) {
        sheet.getRange(row, 1, attendanceTable.length + 1, attendanceTable[0].length)
          .setValues([['Fecha', 'Evento', 'Asistencia']].concat(attendanceTable))
          .setBorder(true, true, true, true, true, true);

        col = attendanceTable[0].length + 2
      }

      const percentagesTable = Object.keys(attendanceStatusMap)
        .map(attendanceStatus => {
          return ({
            attendanceStatus,
            percentage: userData.eventsAttendance.length ? Math.floor(((userData.attendancesByStatus[attendanceStatus] || 0) * 100 / userData.eventsAttendance.length) * 100) / 100 : 0,
          })
        })
        .concat(!userData.attendancesByStatus.noAttendance ? [] : [{
          attendanceStatus: '-',
          percentage: Math.floor((userData.attendancesByStatus.noAttendance * 100 / userData.eventsAttendance.length) * 100) / 100,
        }])
        .sort((a, b) => a.percentage > b.percentage && -1 ||
          a.percentage < b.percentage && 1 ||
          a.attendanceStatus > b.attendanceStatus && -1 ||
          a.attendanceStatus < b.attendanceStatus && 1 || 0
        )
        .map(attendanceData => ([
          attendanceData.attendanceStatus,
          attendanceData.percentage,
        ]))
      sheet.getRange(row, col, percentagesTable.length + 1, percentagesTable[0].length)
        .setValues([['Asistencia', '%']].concat(percentagesTable))
        .setBorder(true, true, true, true, true, true);
    })
}

module.exports = {
  checkAttendanceList: checkAttendanceList,
  checkAttendanceTypes: checkAttendanceTypes,
  updateUsers: updateUsers,
  takeAttendance: takeAttendance
};
