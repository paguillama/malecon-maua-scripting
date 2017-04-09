function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu(malecon.Texts.balance.menu.main)
    .addItem(malecon.Texts.balance.menu.balance, 'generateUserBalanceMenu')
    .addToUi();
}

function generateUserBalanceMenu () {
  malecon.Balance.generateUserData();
}