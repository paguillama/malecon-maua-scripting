module.exports = {
  attendance: {
    menu: {
      main: 'Malecón',
      validate: 'Validar',
      takeAttendance: 'Tomar asistencias'
    }
  },
  balance: {
    menu: {
      main: 'Malecón',
      reconcile: 'Conciliar',
      reconcileAndUpdate: 'Conciliar y actualizar planillas de socios',
    },
    headers: {
      userNumber: 'Socio Nº',
      userDocument: 'C.I.',
      admissionDate: 'Ingreso',
      phone: 'Tel.'
    },
    transactions: {
      headers: {
        date: 'Fecha',
        invoice: 'Recibo',
        value: 'Valor',
        balance: 'Saldo',
        amount: 'Monto',
        account: 'Cuenta',
        category: 'Categoría',
      },
      noDataMessage: 'No hay transacciones para la cuenta seleccionada'
    }
  },
  invoice: {
    menu: {
      main: 'Malecón',
      validate: 'Validar',
      reconcile: 'Conciliar',
      reconcileAndUpdate: 'Conciliar y actualizar planillas de socios',
      reconcileUpdateAndSendEmail: 'Conciliar y enviar por mail las planillas de socios actualizadas',
    }
  },
  invoiceMigration: {
    menu: {
      main: 'Malecón',
      migrate: 'Migrar'
    }
  }
};