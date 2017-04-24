Permissions = (function () {

  function setEditors(spreadsheet, users) {
    //add users as editors on the sreadsheet
    return SpreadsheetApp.getActive().getName();
  }

  function addEditor(user) {
    //var ss = SpreadsheetApp.getActive();
    var ss = SpreadsheetApp.openById('1K9p8ivc5x_nhx41c4Wqqp81AX99Lhn3BUXDNkzbo8kI');
    //var protection = ss.protect();
    var me = Session.getEffectiveUser();
    //ss.addEditor(user);
    return ss.getEditors();
  }

  return {
    setEditors: setEditors,
    addEditor: addEditor
  };

})();


function test() {
  Logger.log(Permissions.addEditor('danielsosa.ho@gmail.com'));
}