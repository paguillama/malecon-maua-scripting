function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu(malecon.Texts.balance.menu.main)
    .addItem(malecon.Texts.balance.menu.reconcile, 'reconcile')
    .addItem(malecon.Texts.balance.menu.reconcileAndUpdate, 'reconcileAndUpdate')
    .addToUi();
}

function reconcile () {
  malecon.Reconciliation.reconcile(false);
}

function reconcileAndUpdate () {
  malecon.Reconciliation.reconcile(true);
}