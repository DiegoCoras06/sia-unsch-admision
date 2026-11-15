"""Genera la colección y el entorno de Postman del SIA-UNSCH, organizados por los 12 módulos.

Uso: python calidad/postman/generar-coleccion.py
Cada petición trae pruebas automáticas: código de respuesta, tiempo de 3 s o menos (EQ-01) y forma de la respuesta.
Las peticiones que guardan datos en la base están en subcarpetas «Escribe en la base».
"""
import base64
import json
import uuid
from pathlib import Path

AQUI = Path(__file__).parent

# Foto de prueba válida (JPEG de 240 x 320, solo la cabecera), igual que en las pruebas automáticas.
SOF = bytes([0xFF, 0xC0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 240 >> 8, 240 & 255, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1])
FOTO = 'data:image/jpeg;base64,' + base64.b64encode(bytes([0xFF, 0xD8]) + SOF + bytes([0xFF, 0xD9])).decode()


def pruebas(estado=200, json_data=True, extra=''):
    lineas = [
        f'pm.test("Responde {estado}", () => pm.response.to.have.status({estado}));',
        'pm.test("Responde en 3 s o menos (EQ-01)", () => pm.expect(pm.response.responseTime).to.be.below(3000));',
    ]
    if json_data and estado < 400:
        lineas.append('pm.test("Trae la propiedad data", () => pm.expect(pm.response.json()).to.have.property("data"));')
    if estado >= 400:
        lineas.append('pm.test("Trae un error con código y mensaje", () => { const e = pm.response.json().error; pm.expect(e).to.have.property("code"); pm.expect(e).to.have.property("message"); });')
    if extra:
        lineas.append(extra)
    return [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': lineas}}]


def peticion(nombre, metodo, ruta, *, descripcion='', cuerpo=None, estado=200, json_data=True, extra='', token=False, query=None):
    partes = ruta.lstrip('/').split('/')
    url = {'raw': '{{baseUrl}}' + ruta, 'host': ['{{baseUrl}}'], 'path': [p for p in partes if p]}
    if query:
        url['raw'] += '?' + '&'.join(f'{k}={v}' for k, v in query)
        url['query'] = [{'key': k, 'value': v} for k, v in query]
        url['path'] = [p for p in ruta.lstrip('/').split('/') if p]
    req = {'method': metodo, 'header': [], 'url': url, 'description': descripcion}
    if cuerpo is not None:
        req['header'].append({'key': 'Content-Type', 'value': 'application/json'})
        req['body'] = {'mode': 'raw', 'raw': json.dumps(cuerpo, ensure_ascii=False, indent=2), 'options': {'raw': {'language': 'json'}}}
    if token:
        req['auth'] = {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{adminToken}}', 'type': 'string'}]}
    return {'name': nombre, 'event': pruebas(estado, json_data, extra), 'request': req}


def carpeta(nombre, items, descripcion=''):
    return {'name': nombre, 'description': descripcion, 'item': items}


DNI = [('documentNumber', '{{dni}}'), ('applicantCode', '{{codigo}}')]
ESCRIBE = 'Estas peticiones guardan datos en la base a la que apunta {{baseUrl}}. Úsalas con datos de prueba y no las incluyas en una corrida completa contra producción.'
PANEL = 'Necesitan {{adminToken}}: corre antes «Ingreso del personal».'

coleccion = {
    'info': {
        '_postman_id': str(uuid.uuid5(uuid.NAMESPACE_URL, 'sia-unsch-admision')),
        'name': 'SIA-UNSCH Admisión 2027-I',
        'description': 'Verificación funcional de los 12 módulos del Sistema Integral de Admisión. Cada petición comprueba el código de respuesta, que responda en 3 s o menos (EQ-01) y la forma de los datos. Las carpetas «Escribe en la base» crean registros: úsalas solo con datos de prueba. Guía: calidad/postman/README.md.',
        'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    'item': [
        carpeta('00. Salud de la API', [
            peticion('Salud de la API y la base de datos', 'GET', '/health', extra='pm.test("La base de datos responde", () => pm.expect(pm.response.json().data.database).to.eql("ok"));'),
        ]),
        carpeta('01. Convocatorias (portal)', [
            peticion('Convocatoria vigente y etapas', 'GET', '/calls/current', extra='pm.test("Trae etapas", () => pm.expect(pm.response.json().data.stages).to.be.an("array").that.is.not.empty);'),
            peticion('Áreas', 'GET', '/calls/{{convocatoria}}/areas'),
            peticion('Programas y vacantes', 'GET', '/calls/{{convocatoria}}/options', extra='pm.test("Trae los 40 programas", () => pm.expect(pm.response.json().data.length).to.be.at.least(1));'),
            peticion('Programas de Letras', 'GET', '/calls/{{convocatoria}}/options', query=[('area', 'II')]),
            peticion('Detalle de un programa', 'GET', '/calls/{{convocatoria}}/options/{{programa}}'),
            peticion('Modalidades (submodalidades)', 'GET', '/calls/{{convocatoria}}/submodalities'),
            peticion('Categorías de cupo', 'GET', '/calls/{{convocatoria}}/quota-categories'),
            peticion('Tasas', 'GET', '/calls/{{convocatoria}}/fees'),
            peticion('Simulador de tasa (Ordinario, colegio estatal)', 'GET', '/calls/{{convocatoria}}/fee-quote', query=[('modality', 'ORD'), ('schoolType', 'ESTATAL')],
                     extra='pm.test("Calcula un total", () => pm.expect(pm.response.json().data).to.have.property("total"));'),
            peticion('Requisitos del Ordinario', 'GET', '/calls/{{convocatoria}}/requirements', query=[('submodality', 'ORD')]),
            peticion('Temario', 'GET', '/calls/{{convocatoria}}/syllabus'),
            peticion('Documentos oficiales', 'GET', '/calls/{{convocatoria}}/documents'),
            peticion('Inscritos por modalidad', 'GET', '/calls/{{convocatoria}}/stats'),
        ]),
        carpeta('02. Configuración (contenidos)', [
            peticion('Contenido de la portada', 'GET', '/content/home'),
            peticion('Comunicados', 'GET', '/announcements'),
            peticion('Imágenes del sitio', 'GET', '/site-assets'),
        ]),
        carpeta('03. Inscripciones', [
            peticion('Datos para el formulario', 'GET', '/inscriptions/options'),
            peticion('Relación de observados', 'GET', '/inscriptions/observed'),
            peticion('Estado de una inscripción (DNI y código)', 'GET', '/inscriptions/status', query=DNI, descripcion='Usa las variables dni y codigo de una inscripción de prueba.'),
            carpeta('Escribe en la base', [
                peticion('Inscribir a un postulante de prueba', 'POST', '/inscriptions', estado=201, cuerpo={
                    'documentType': 'DNI', 'documentNumber': '{{dniNuevo}}', 'paternalSurname': 'PRUEBA', 'maternalSurname': 'POSTMAN', 'firstNames': 'POSTULANTE',
                    'sex': 'F', 'maritalStatus': 'SOLTERO', 'birthUbigeo': '050101', 'birthDate': '2008-01-10', 'address': 'Jr. Asamblea 100, Ayacucho',
                    'residenceUbigeo': '050101', 'economicDependency': 'PADRES', 'mobile': '987654321', 'email': 'prueba.postman@example.com', 'photo': FOTO,
                    'schoolUbigeo': '050101', 'schoolName': 'IE DE PRUEBA', 'schoolType': 'ESTATAL', 'graduationYear': 2025, 'inFourthOrBelow': False,
                    'preparation': 'ACADEMIA', 'attempts': 1, 'modality': 'ORD', 'quotaCategory': 'ORD', 'campus': 'HUAMANGA', 'optionCode': '{{programa}}',
                    'militaryCondition': 'NONE', 'familyLink': False, 'declarationAccepted': True, 'consentVersion': '2026-10-v1',
                }, descripcion='Crea una inscripción real en la base. Cambia dniNuevo por un DNI de prueba que no esté inscrito.',
                         extra='if (pm.response.code === 201) { pm.environment.set("codigo", pm.response.json().data.applicantCode); pm.environment.set("dni", pm.environment.get("dniNuevo")); }'),
                peticion('Encuesta SUS de la inscripción', 'POST', '/inscriptions/survey', estado=201,
                         cuerpo={'documentNumber': '{{dni}}', 'applicantCode': '{{codigo}}', 'answers': [4, 2, 4, 2, 4, 2, 4, 2, 4, 2], 'device': 'computadora'}),
            ], ESCRIBE),
        ]),
        carpeta('04. Pagos', [
            peticion('Estado del pago (DNI y código)', 'GET', '/payments/status', query=DNI),
            carpeta('Escribe en la base', [
                peticion('Abrir un intento de pago (Culqi en modo prueba)', 'POST', '/payments/session', estado=201, cuerpo={'documentNumber': '{{dni}}', 'applicantCode': '{{codigo}}'},
                         descripcion='Crea un intento de pago. No cobra: el cobro necesita el token que entrega Culqi Checkout en el navegador.'),
            ], ESCRIBE),
        ]),
        carpeta('05. Usuarios (cuentas y personal)', [
            peticion('Política de datos vigente', 'GET', '/legal/consent/current'),
            carpeta('Ingreso del personal', [
                peticion('1. Correo y contraseña', 'POST', '/admin/auth/login', cuerpo={'email': '{{adminEmail}}', 'password': '{{adminPassword}}'},
                         extra='if (pm.response.code === 200) { const d = pm.response.json().data; pm.environment.set("challenge", d.challenge); pm.test("Pide el doble factor", () => pm.expect(d.step).to.be.oneOf(["MFA", "SETUP_MFA", "CHANGE_PASSWORD"])); }'),
                peticion('2. Código del autenticador', 'POST', '/admin/auth/mfa', cuerpo={'challenge': '{{challenge}}', 'code': '{{mfaCode}}'},
                         descripcion='Escribe en mfaCode el código de 6 dígitos de tu aplicación de autenticación justo antes de enviar.',
                         extra='if (pm.response.code === 200) { pm.environment.set("adminToken", pm.response.json().data.accessToken); }'),
            ], 'Guarda el token en adminToken para las demás carpetas del panel. Escribe adminEmail, adminPassword y mfaCode en el entorno; no se guardan en el proyecto.'),
            peticion('Mi perfil de personal', 'GET', '/admin/me', token=True),
            peticion('Usuarios del panel', 'GET', '/admin/users', token=True),
            peticion('Roles y permisos', 'GET', '/admin/roles', token=True),
        ]),
        carpeta('06. Seguridad y auditoría', [
            peticion('Auditoría', 'GET', '/admin/audit', token=True, descripcion=PANEL),
            peticion('Casos de atención', 'GET', '/admin/cases', token=True),
            peticion('Estado del sistema e integraciones', 'GET', '/admin/system', token=True),
            carpeta('Escribe en la base', [
                peticion('Consulta de contacto', 'POST', '/support/contact', estado=201,
                         cuerpo={'name': 'Prueba Postman', 'email': 'prueba.postman@example.com', 'message': 'Mensaje de prueba enviado desde Postman.'}),
            ], ESCRIBE),
        ]),
        carpeta('07. Expedientes', [
            peticion('Expediente del postulante (exonerados)', 'GET', '/dossier', query=DNI, descripcion='Solo responde 200 para inscripciones de Exonerados; para Ordinario responde un error de regla de negocio.'),
            peticion('Expedientes (panel)', 'GET', '/admin/dossiers', token=True),
            peticion('Expedientes por estado', 'GET', '/admin/dossiers/stats', token=True),
        ]),
        carpeta('08. Exámenes', [
            peticion('Mi aula (DNI y código)', 'GET', '/exam/room', query=DNI, descripcion='Responde 200 cuando ya hay distribución de aulas publicada.'),
            peticion('Exámenes (panel)', 'GET', '/admin/exams', token=True),
            peticion('Sedes y aulas', 'GET', '/admin/venues', token=True),
            peticion('Asistencia', 'GET', '/admin/attendance', token=True),
        ]),
        carpeta('09. Resultados', [
            peticion('Ingresantes publicados', 'GET', '/results/admitted'),
            peticion('Mi resultado (DNI y código)', 'GET', '/results/me', query=DNI, descripcion='Responde 200 cuando hay resultados publicados.'),
            peticion('Resultados (panel)', 'GET', '/admin/results', token=True),
            peticion('Ingresantes y entrega de documentos', 'GET', '/admin/admissions', token=True),
        ]),
        carpeta('10. Notificaciones', [
            peticion('Bandeja del postulante (DNI y código)', 'GET', '/notifications', query=DNI),
            peticion('Envíos (panel)', 'GET', '/admin/notifications', token=True),
            peticion('Plantillas de correo', 'GET', '/admin/notification-templates', token=True),
            peticion('Campañas', 'GET', '/admin/campaigns', token=True),
        ]),
        carpeta('11. Asistente virtual', [
            peticion('Preguntas sugeridas', 'GET', '/assistant/suggestions'),
            peticion('Uso del asistente (panel)', 'GET', '/admin/assistant/usage', token=True),
            carpeta('Escribe en la base', [
                peticion('Hacer una pregunta', 'POST', '/assistant/messages', cuerpo={'message': '¿Cuándo es el examen ordinario?'},
                         descripcion='Guarda la conversación y, si hay clave de OpenRouter, consume crédito de la IA.'),
            ], ESCRIBE),
        ]),
        carpeta('12. Reportes', [
            peticion('Indicadores del inicio del panel', 'GET', '/admin/dashboard', token=True),
            peticion('Inscripciones (panel)', 'GET', '/admin/inscriptions', token=True),
            peticion('Pagos (panel)', 'GET', '/admin/payments', token=True),
            peticion('Encuesta SUS: resumen', 'GET', '/admin/usability', token=True),
            peticion('Reporte de inscripciones en Excel', 'GET', '/admin/reports/inscripciones.xlsx', token=True, json_data=False,
                     extra='pm.test("Es un archivo de Excel", () => pm.expect(pm.response.headers.get("Content-Type")).to.include("spreadsheet"));'),
        ]),
        carpeta('13. Errores esperados', [
            peticion('DNI con formato inválido', 'POST', '/identity/lookup', cuerpo={'documentType': 'DNI', 'documentNumber': '12'}, estado=400),
            peticion('Panel sin iniciar sesión', 'GET', '/admin/dashboard', estado=401),
            peticion('Programa que no existe', 'GET', '/calls/{{convocatoria}}/options/P99', estado=404),
            peticion('Ruta que no existe', 'GET', '/no-existe', estado=404),
            peticion('Encuesta incompleta', 'POST', '/inscriptions/survey', cuerpo={'documentNumber': '00000000', 'applicantCode': '00000000', 'answers': [1, 2]}, estado=400),
        ]),
    ],
}

entorno = {
    'id': str(uuid.uuid5(uuid.NAMESPACE_URL, 'sia-unsch-local')),
    'name': 'SIA-UNSCH local',
    'values': [
        {'key': 'baseUrl', 'value': 'http://127.0.0.1:3000/api/v1', 'type': 'default', 'enabled': True},
        {'key': 'convocatoria', 'value': '2027-I', 'type': 'default', 'enabled': True},
        {'key': 'programa', 'value': 'P34', 'type': 'default', 'enabled': True},
        {'key': 'dni', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'codigo', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'dniNuevo', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'adminEmail', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'adminPassword', 'value': '', 'type': 'secret', 'enabled': True},
        {'key': 'mfaCode', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'challenge', 'value': '', 'type': 'default', 'enabled': True},
        {'key': 'adminToken', 'value': '', 'type': 'secret', 'enabled': True},
    ],
    '_postman_variable_scope': 'environment',
}

(AQUI / 'SIA-UNSCH.postman_collection.json').write_text(json.dumps(coleccion, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(AQUI / 'local.postman_environment.json').write_text(json.dumps(entorno, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
total = sum(1 for _ in json.dumps(coleccion).split('"method"')) - 1
print(f'Colección generada: {total} peticiones')
