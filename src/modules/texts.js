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
        account: 'Cuenta'
      },
      noDataMessage: 'No hay transacciones para la cuenta seleccionada'
    }
  },
  invoice: {
    menu: {
      main: 'Malecón',
      validate: 'Validar',
      reconcile: 'Conciliar',
      reconcileAndUpdate: 'Conciliar y actualizar planillas de socios'
    }
  },
  invoiceMigration: {
    menu: {
      main: 'Malecón',
      migrate: 'Migrar'
    }
  }
};