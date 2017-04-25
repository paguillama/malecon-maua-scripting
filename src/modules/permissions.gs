Permissions = (function () {
  function addEditor(user) {
    var ss = SpreadsheetApp.getActive();
    try {
      ss.getEditors(); // throws exception if user does not have permission to edit the document
      ss.addEditor(user);
      return { error: null, message: 'Permisos actualizados' };
    } catch (error) {
      Logger.log(error.stack ? error.stack : error);
      return { error: error.stack ? error.stack : error };
    }
  }
  function addViewer(user) {
    var ss = SpreadsheetApp.getActive();
    try {
      ss.getEditors(); // throws exception if user does not have permission to edit the document
      ss.addViewer(user);
      return { error: null, message: 'Permisos actualizados' };
    } catch (error) {
      Logger.log(error.stack ? error.stack : error);
      return { error: error.stack ? error.stack : error };
    }
  }
  function setPermissions(commission) {
    if (commissions.hasOwnProperty(commission)) {
      var errors = [];
      commissions[commission].forEach(function (user) {
        var result = {};
        if (user.permission === 'editor') {
          result = addEditor(user.email);
          if (result.error)
            errors.push(user.email);
        }
        if (user.permission === 'viewer') {
          result = addViewer(user.email);
          if (result.error)
            errors.push(user.email);
        }
      }, null);
      if (errors.length) {
        var unassigned = errors.reduce(function (prev, current) {
          return prev + ' ' + current;
        }, '')
        return { error: 'The following users could not be assigned: ' + unassigned }
      }
      else
        return { error: null, message: 'Los permisos fueron asignados' }
    }
    else
      return { error: 'Commission ' + commission + ' does not exists' }
  }

  return {
    setPermissions: setPermissions
  };

})();
// TODO add to general malecon-scripting/config.gs file
// (consult whith if this souldn't be a configuration spreadsheet)
var commissions = {
  devs: [
    { email: 'paguillama@gmail.com', permission: 'editor' },
    { email: 'danielsosa.uy@gmail.com', permission: 'editor' }
  ],
  administracion: [
    { email: 'gracesori7@gmail.com', permission: 'editor' },
    { email: 'juanlatorre24@gmail.com', permission: 'editor' },
    { email: 'vivianaayala2210@gmail.com', permission: 'viewer' },
    { email: 'luciadabezies@gmail.com', permission: 'viewer' },
    { email: 'aliceveroduarte@gmail.com', permission: 'viewer' }
  ]
}
// Mockup of the library namespace
// TODO remove
malecon = {
  Permissions: Permissions
}