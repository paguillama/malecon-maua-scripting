module.exports = data => `
<html>
<head>
	<title>Title1!</title>
	<style>
	.preheader {
	  display: none !important;
	}
	.malecon--color {
    color: #007DC2;
  }
  </style>
</head>
<body>
  <span class="preheader">${data.user.firstName}! Este es el detalle de tu balance actualizado</span>
	<h1 class="malecon--color">Tus cuentas de Malec&oacute;n Ma&uacute;a</h1>
	<p>Hola ${data.user.firstName}!</p>
	<p>Adjuntamos el detalle de tu balance actualizado.</p>
	<p>Recuerda que &eacute;sta y otra informaci&oacute;n puedes encontrarla en <a href="${data.documentsFolderUrl}">la carpeta compartida de Malec&oacute;n</a>.</p>
	<p>Si tienes alguna duda o consulta acerca del balance enviado, por favor comun&iacute;cate con nosotros respondiendo este mail.</p>
	<p>Saludos!</p>
</body>
</html>
`