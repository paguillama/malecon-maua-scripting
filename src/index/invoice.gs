function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(malecon.Texts.invoice.menu.main)
    .addItem(malecon.Texts.invoice.menu.validate, 'checkInvoice')
    .addItem(malecon.Texts.invoice.menu.reconcile, 'reconcile')
    .addItem(malecon.Texts.invoice.menu.reconcileAndUpdate, 'reconcileAndUpdate')
    .addItem(malecon.Texts.invoice.menu.reconcileUpdateAndSendEmail, 'sendBalancesEmail')
    .addToUi();
}

function sendBalancesEmail () {
  malecon.Reconciliation.reconcile(true);
  malecon.Mail.sendBalancesMails();
}

function reconcile () {
  malecon.Reconciliation.reconcile(false);
}

function reconcileAndUpdate () {
  malecon.Reconciliation.reconcile(true);
}

function checkInvoice () {
  malecon.Invoice.checkCategories();
  malecon.Invoice.checkSkipReconcile();
  malecon.Invoice.checkUsers();
  malecon.Invoice.checkAccounts();
  malecon.Invoice.formatDate();
  malecon.Invoice.formatValue();
  malecon.Invoice.sort();
}