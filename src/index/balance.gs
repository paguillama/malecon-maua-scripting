function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu(malecon.Texts.balance.menu.main)
    .addItem(malecon.Texts.balance.menu.reconcile, 'reconcile')
    .addToUi();
}

function reconcile () {
  malecon.Reconciliation.reconcile();
}