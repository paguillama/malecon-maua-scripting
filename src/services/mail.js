const userBalanceTemplate = require('../templates/user-balance');
const config = require('./config');
const log = require('./log');
const {
  getUsers,
  getSpreadsheetName,
} = require('./users');

const sendBalancesMail = (userBalancesFolder, documentsFolderUrl) => (user) => {
  const files = userBalancesFolder.getFilesByName(getSpreadsheetName(user));
  const file = files.hasNext() && files.next() || null;

  if (file) {
    const spreadsheet = SpreadsheetApp.openById(file.getId());

    spreadsheet.getSheets()
      .forEach(sheet => {
        const lastColumn = sheet.getLastColumn();
        for(let i = 1; i <= lastColumn; i++) {
          sheet.autoResizeColumn(i);
        }
      });

    const mimeType = 'application/pdf';
    const content = spreadsheet.getAs(mimeType).getBytes();

    const template = HtmlService.createTemplate(userBalanceTemplate({
      user,
      documentsFolderUrl,
    }));

    MailApp.sendEmail(user.email, 'Tus cuentas actualizadas en Malecón Mauá', 'Por favor usa un visor de mails que soporte HTML', {
      name: 'Mailing Malecón Mauá',
      htmlBody: template.evaluate().getContent(),
      attachments: {
        fileName: `Balance ${user.name}.pdf`,
        content,
        mimeType: mimeType,
      },
    });
  }
};

const sendBalancesMails = () => {
  SpreadsheetApp.flush();
  const userBalancesFolder = DriveApp.getFolderById(config.ids.userBalancesFolder);
  const documentsFolderUrl = DriveApp.getFolderById(config.ids.documentsFolder).getUrl();
  getUsers()
    .filter((user, index) => user.active && user.email)
    .forEach(sendBalancesMail(userBalancesFolder, documentsFolderUrl))
}


module.exports = {
  sendBalancesMails,
};