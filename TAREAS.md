# 📋 Tablero Maestro de Actividades — FreelancerHub

> [!NOTE]
> **Documento de Respaldo y Consulta Permanente (Offline / Git):**
> Si el servidor Fedora o el túnel de Cloudflare están apagados, consulta tus asignaciones técnicas directamente en este archivo en GitHub o clónalo en tu máquina.

---

## 👥 Resumen de Asignaciones (5 Tareas por Integrante)
- **Paulo Essau**: DB Índices, DB Propuestas, API Propuestas, Máquina Escrow y Billetera Digital.
- **Diego Alejandro**: Flutter Propuestas, API Entregas SHA-256, Aprobación Atómica, Disputas y Triángulo de Hierro.
- **Karla Mtz**: Formulario Web Convocatorias, Tarjetas Web PCI-DSS, Matriz Comparativa MCDA, Kanban Hitos y Reseñas Ciegas.
- **Uriel Hernandez**: Feed Móvil Flutter, Backend Tarjetas PCI-DSS, Fondeo Escrow Web, Visor Entregables y Chat Web.
- **Axel Rocha**: Modal Web Propuestas, Carga Evidencias Móvil, Aprobación Móvil Biometría/PIN, Billetera Móvil y Modo Offline.
- **Christopher Isaac**: API Feed y Filtros, Seguridad PII/Sanitización, WebSockets en Vivo, Chat Móvil y Suite Tests E2E.

---

## 👤 Axel (5 Tareas Asignadas)

### 1. FLH-MOB-OFFLINE: Móvil Flutter - Caching Local para Modo Offline (Rúbrica)
- **Prioridad**: `LOW` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Implementar persistencia y caché local en Flutter para que la aplicación sea utilizable sin conexión a internet.

[QUÉ DEBES REALIZAR]
1. Configurar Hive o SharedPreferences en Flutter para guardar en caché la última lista de convocatorias consultadas.
2. Si el dispositivo pierde conexión (detectado con connectivity_plus), cargar los datos desde la base local con badge 'Modo Offline'.
3. Encolar acciones offline básicas para sincronizarlas en cuanto regrese la conectividad a internet.

[CRITERIOS DE ACEPTACIÓN]
- La aplicación no muestra pantallas en blanco ni crashea si se abre sin internet.
- Notifica al usuario de forma amigable cuando está navegando con datos locales.
```

---
### 2. FLH-MOB-WALLET: Móvil Flutter - Billetera Digital y Solicitud de Retiros (HU-14)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Diseñar la sección de finanzas y billetera personal en la app móvil en Flutter.

[QUÉ DEBES REALIZAR]
1. Pantalla 'WalletScreen.dart' con tarjetas visuales destacadas:
   - Saldo Disponible (listo para transferir a banco).
   - Saldo en Garantía (retenido en hitos que están en progreso).
2. Gráfica o listado de últimos cobros recibidos con desglose de comisión.
3. Botón 'Solicitar Retiro': modal para ingresar importe a retirar y cuenta CLABE de destino.
4. Conectar con los endpoints GET /api/v1/wallet y POST /api/v1/wallet/withdraw.

[CRITERIOS DE ACEPTACIÓN]
- Pull to refresh para actualizar saldos.
- Validación de que el monto a retirar no supere el saldo disponible.
```

---
### 3. FLH-MOB-APPROVE: Móvil Flutter - Aprobación con Biometría o PIN (HU-07)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir la pantalla de aprobación de hitos en Flutter con confirmación de seguridad local antes de liberar dinero.

[QUÉ DEBES REALIZAR]
1. Pantalla de detalle de hito entregado para que el cliente inspeccione notas y enlaces en el celular.
2. Botón principal: 'Aprobar y Liberar Fondos'.
3. Integrar la librería 'local_auth' de Flutter: al presionar aprobar, exigir autenticación biométrica (Huella dactilar o FaceID) o PIN del sistema.
4. Tras la validación biométrica exitosa, enviar la petición autenticada al backend para liberar el pago.

[CRITERIOS DE ACEPTACIÓN]
- Si la biometría es cancelada o incorrecta, no se ejecuta ninguna llamada al backend.
- Feedback háptico y pantalla de confirmación exitosa con animación.
```

---
### 4. FLH-MOB-DELIVERY: Móvil Flutter - Carga de Evidencias de Entregables (HU-06)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Desarrollar la pantalla en Flutter para que el desarrollador pueda entregar avances o evidencias de su hito desde el teléfono.

[QUÉ DEBES REALIZAR]
1. Crear vista 'SubmitDeliveryScreen.dart' en Flutter.
2. Integración con image_picker y file_picker: permitir seleccionar archivos locales o capturar fotos de evidencia.
3. Campo para pegar enlace de repositorio/demo y caja de notas técnicas de entrega.
4. Barra de progreso visual durante la subida del archivo multipart.
5. Conectar con el endpoint POST /api/v1/milestones/:id/deliveries.

[CRITERIOS DE ACEPTACIÓN]
- Soporta subida de archivos de hasta 25MB con control de errores por timeout.
- Muestra diálogo de confirmación tras cargar la entrega con éxito.
```

---
### 5. FREEL-45: Web React - Modal para Postular Propuesta Económica (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir el modal web para que los freelancers envíen su propuesta formal desde el navegador al ver una convocatoria.

[QUÉ DEBES REALIZAR]
1. Modal 'SubmitProposalModal.jsx' que se abre desde el detalle de la convocatoria.
2. Campos del formulario:
   - Carta de propuesta (explicando enfoque técnico y experiencia).
   - Monto total ofertado en MXN (con validación de no exceder el presupuesto del cliente).
   - Plazo de entrega en días naturales.
   - Hasta 3 URLs de proyectos previos en su portafolio.
   - Desglose de hitos cotizados (Título, costo parcial y días).
3. Conectar con POST /api/v1/proposals y deshabilitar botón mientras envía para evitar dobles postulaciones.

[CRITERIOS DE ACEPTACIÓN]
- Notificación Toast de éxito al enviar y cierre automático del modal.
- Si ya postuló, la vista muestra 'Ya has enviado una propuesta a este proyecto'.
```

---

## 👤 Christian (5 Tareas Asignadas)

### 1. FLH-TEST-E2E: Suite de Pruebas Automatizadas de Integración E2E (Rúbrica)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Diseñar la suite de pruebas automatizadas que demuestre el funcionamiento de punta a punta del sistema completo para la entrega final.

[QUÉ DEBES REALIZAR]
1. Crear suite de pruebas en Playwright ('e2e/core-business-flow.spec.ts').
2. Automatizar el flujo completo:
   a. Cliente publica convocatoria.
   b. Freelancer postula con cotización de hitos.
   c. Cliente revisa comparativa y acepta propuesta.
   d. Fondeo simulado de contrato en garantía Escrow.
   e. Freelancer entrega hito con archivo y hash SHA-256.
   f. Cliente aprueba entrega y fondos se acreditan a billetera.
3. Generar reporte en video o HTML para evidencia de evaluación del parcial.

[CRITERIOS DE ACEPTACIÓN]
- La suite corre completa con código de salida 0 demostrando la integridad de todo el software.
```

---
### 2. FLH-MOB-CHAT: Móvil Flutter - Pantalla de Chat en Vivo y Notificaciones (HU-11)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir la experiencia de chat en tiempo real en la app móvil en Flutter conectada al servidor de sockets.

[QUÉ DEBES REALIZAR]
1. Integrar el cliente de Socket.io en Flutter ('socket_io_client').
2. Pantalla 'ChatScreen.dart' con burbujas diferenciadas:
   - Mensajes propios (alineados a la derecha con color Vino #5A0F24).
   - Mensajes de la contraparte (alineados a la izquierda con fondo Crema #F3EFE6).
3. Sonido o feedback al recibir mensaje y autoscroll al final de la conversación.
4. Indicador visual de lectura o estado de entrega del mensaje.

[CRITERIOS DE ACEPTACIÓN]
- Los mensajes nuevos aparecen al instante sin necesidad de refrescar la pantalla.
- Reconexión automática transparente si se pierde brevemente la red móvil.
```

---
### 3. FLH-BE-SOCKET: Backend - Servidor WebSockets para Chat y Notificaciones (HU-11)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Configurar la infraestructura de tiempo real con Socket.io en el backend para mensajería instantánea y alertas del sistema.

[QUÉ DEBES REALIZAR]
1. Instalar y configurar Socket.io en el servidor Express montado sobre HTTP.
2. Middleware de autenticación para WebSockets: validar token JWT en el handshake de conexión.
3. Salas por contrato: agrupar los sockets por 'room:contract_id' para que los mensajes solo lleguen a los participantes de ese acuerdo.
4. Eventos a emitir: 'new_message', 'milestone_submitted', 'milestone_approved' y 'contract_status_changed'.

[CRITERIOS DE ACEPTACIÓN]
- Usuarios no autorizados no pueden escuchar canales de contratos ajenos.
- Conexiones y desconexiones limpias sin memory leaks en el servidor.
```

---
### 4. FREEL-40 & 30: Seguridad - Control de Exposición de Datos y PCI-DSS (HU-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Auditar y aplicar control estricto de exposición de datos sensibles en las respuestas públicas de la API.

[QUÉ DEBES REALIZAR]
1. Crear DTO de salida 'PublicProjectResponseDto': omitir correo, teléfono y datos privados del cliente en el listado público de convocatorias.
2. Validar que ninguna ruta devuelva hashes de contraseñas, tokens de refresco ni claves internas.
3. Auditoría en rutas de pago: asegurar que las respuestas nunca devuelvan datos bancarios sensibles ni CVCs.
4. Aplicar middleware de sanitización para eliminar etiquetas HTML o scripts maliciosos en descripciones de proyectos.

[CRITERIOS DE ACEPTACIÓN]
- Ninguna respuesta pública expone información personal identificable (PII) innecesaria.
- Previene ataques de XSS en datos ingresados por usuarios.
```

---
### 5. FREEL-39: Backend - API de Feed Reactivo con Filtrado por Tags (HU-01 / HU-02)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir el endpoint central de consulta y filtrado de proyectos del marketplace para clientes y freelancers.

[QUÉ DEBES REALIZAR]
1. Implementar GET /api/v1/projects con query params opcionales:
   - 'search': búsqueda por palabra clave en título y descripción.
   - 'category': filtro por categoría del proyecto.
   - 'minBudget' y 'maxBudget': filtro por rango de presupuesto.
   - 'skills': filtro por array o lista separada por comas de habilidades.
   - 'page' y 'limit': paginación estándar (ej. 10 por página).
2. Retornar solo proyectos con status 'ACTIVE'.
3. Incluir metadatos de paginación (total, totalPages, currentPage).

[CRITERIOS DE ACEPTACIÓN]
- Permite combinar múltiples filtros simultáneamente.
- Tiempo de respuesta optimizado gracias a los índices de base de datos.
```

---

## 👤 Diego (5 Tareas Asignadas)

### 1. FLH-BE-SCOPE: Regulación de Alcance mediante Triángulo de Hierro (HU-08)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Crear el motor matemático en backend que calcula el impacto en costo y tiempo cuando el cliente solicita cambios al alcance original.

[QUÉ DEBES REALIZAR]
1. Endpoint POST /api/v1/contracts/:id/change-requests para registrar solicitudes de variación de requerimientos.
2. Algoritmo del Triángulo de Hierro: relacionar Alcance (Scope) vs Tiempo (Time) vs Costo (Cost). Si se agregan entregables, calcular el incremento sugerido en días y tarifa proporcional.
3. Flujo de aprobación: la adenda contractual requiere la firma/confirmación digital de ambas partes antes de actualizar el contrato base.

[CRITERIOS DE ACEPTACIÓN]
- Evita que los clientes exijan trabajo extra gratis.
- Guarda bitácora inmutable de todas las versiones del contrato.
```

---
### 2. FLH-BE-DISPUTE: Módulo de Arbitraje y Resolución de Disputas (HU-12)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Implementar el sistema legal y de resolución de conflictos cuando cliente y freelancer no llegan a un acuerdo en un hito.

[QUÉ DEBES REALIZAR]
1. Endpoint POST /api/v1/contracts/:id/disputes: permite a cualquiera de las partes abrir disputa argumentando motivos y adjuntando pruebas.
2. Al abrirse, el hito y los fondos correspondientes se congelan automáticamente (estado 'DISPUTED').
3. Endpoints exclusivos para rol 'MEDIADOR':
   - GET /api/v1/disputes: listar casos abiertos con historial de chat y evidencias.
   - POST /api/v1/disputes/:id/resolve: emitir sentencia (reembolso 100% al cliente, pago 100% al dev o split 50/50).

[CRITERIOS DE ACEPTACIÓN]
- Solo usuarios con rol MEDIADOR pueden dictaminar la resolución.
- El dinero se distribuye automáticamente según el porcentaje dictaminado.
```

---
### 3. FLH-BE-RELEASE: Transacción Atómica de Aprobación y Pago (HU-07)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir el endpoint transaccional crítico que libera los fondos en custodia hacia el freelancer cuando el cliente aprueba la entrega.

[QUÉ DEBES REALIZAR]
1. Endpoint POST /api/v1/milestones/:id/approve: validar que el usuario autenticado sea el CLIENT dueño del proyecto.
2. Ejecutar transacción atómica en Prisma ($transaction):
   a. Cambiar estado del hito a 'APPROVED'.
   b. Reducir el saldo en custodia (escrowBalance) del contrato.
   c. Acreditar el monto neto a la billetera (availableBalance) del freelancer descontando la comisión.
   d. Crear registro de transacción con ID único.
3. Si todos los hitos del contrato están aprobados, marcar el contrato como 'COMPLETED'.

[CRITERIOS DE ACEPTACIÓN]
- Operación 100% atómica: si algo falla en la transferencia contable, se hace rollback completo sin pérdida de dinero.
```

---
### 4. FLH-BE-DELIVERY: API de Entrega Técnica de Hitos con Hashes SHA-256 (HU-06)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Crear el servicio backend para que el freelancer suba los entregables de cada hito garantizando la integridad de los archivos.

[QUÉ DEBES REALIZAR]
1. Implementar POST /api/v1/milestones/:id/deliveries aceptando notas técnicas, URLs (GitHub/Figma/Drive) y archivos adjuntos (ZIP/PDF/Imágenes).
2. Para archivos físicos recibidos por Multer, calcular su hash criptográfico SHA-256 antes de guardarlos.
3. Guardar en base de datos la URL del archivo, el hash SHA-256 generado y cambiar el estado del hito a 'IN_REVIEW'.
4. Notificar o dejar disponible la entrega para que el cliente pueda revisarla.

[CRITERIOS DE ACEPTACIÓN]
- El hash SHA-256 queda persistido para comprobar que el archivo no fue alterado.
- El hito cambia de estado impidiendo nuevas entregas hasta que el cliente dictamine.
```

---
### 5. FREEL-46: Móvil Flutter - Pantalla de Postulación y Cotización por Hitos (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir la pantalla en Flutter para que los freelancers envíen su propuesta económica y coticen sus entregas desde el celular.

[QUÉ DEBES REALIZAR]
1. Crear la vista 'ProposalSubmissionScreen' en Flutter con inputs para: Carta de presentación, Precio total y Tiempo estimado.
2. Lista dinámica de hitos: botón para agregar/quitar entregables con su título, descripción y monto parcial.
3. Validación en tiempo real: verificar que la suma de los hitos coincida con el precio total ofertado.
4. Conectar con el endpoint POST /api/v1/proposals enviando el token JWT.

[CRITERIOS DE ACEPTACIÓN]
- Interfaz adaptada con la paleta oficial (Vino #5A0F24, Rosa Polvo #C68A8F, Crema #F3EFE6).
- Muestra alertas claras de éxito o errores de validación sin crashear.
```

---

## 👤 Karla (5 Tareas Asignadas)

### 1. FLH-FE-REVIEW: Web React - Modal de Calificación Ciega y Reseña (HU-13)
- **Prioridad**: `LOW` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Implementar el modal de evaluación recíproca al finalizar el contrato garantizando que ninguna parte vea la nota de la otra antes de calificar.

[QUÉ DEBES REALIZAR]
1. Modal 'BlindReviewModal.jsx' que se activa al completarse el último hito.
2. Selector interactivo de 1 a 5 estrellas con hover animado.
3. Campo de texto para retroalimentación cualitativa sobre comunicación, puntualidad y calidad técnica.
4. Banner explicativo: 'Tu reseña y la de la contraparte se mantendrán ocultas hasta que ambos hayan calificado'.
5. Conectar con el endpoint POST /api/v1/reviews.

[CRITERIOS DE ACEPTACIÓN]
- Bloquea la edición una vez enviado el feedback.
- Muestra el estado 'Esperando que la otra parte califique' tras enviar.
```

---
### 2. FLH-FE-KANBAN: Web React - Tablero Kanban de Hitos del Contrato (HU-10)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Crear el tablero Kanban interactivo para el seguimiento operativo de los hitos dentro de un contrato activo entre cliente y freelancer.

[QUÉ DEBES REALIZAR]
1. Componente 'ProjectKanbanBoard.jsx' con 3 columnas de estado:
   - Por Hacer (Hitos pendientes de iniciar o fondear).
   - En Revisión (Entregables enviados por el dev en espera de visto bueno).
   - Aprobado & Pagado (Hitos liberados con éxito).
2. Cada tarjeta de hito muestra: Título, monto asignado, fecha límite y botón para ver entregable o aprobar.
3. Integrar actualización en vivo sin tener que recargar toda la página.

[CRITERIOS DE ACEPTACIÓN]
- Permite al cliente y al freelancer ver en qué fase se encuentra exactamente el trabajo en tiempo real.
```

---
### 3. FLH-FE-MCDA: Web React - Matriz Visual Comparativa de Candidatos (HU-04)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir una tabla comparativa interactiva para que el cliente evalúe a todos los freelancers que postularon a su proyecto.

[QUÉ DEBES REALIZAR]
1. Componente 'CandidateComparisonTable.jsx' que reciba las propuestas de un proyecto.
2. Mostrar columnas clave: Freelancer (avatar y nombre), Cotización Total, Plazo en días, Desglose de hitos y Score de compatibilidad (0-100%).
3. Botones de acción directa: 'Ver Portafolio', 'Chatear' y 'Aceptar Propuesta' (que inicia la fase de contrato).
4. Filtro rápido para ordenar candidatos por menor precio, mayor reputación o mejor entrega estimada.

[CRITERIOS DE ACEPTACIÓN]
- Permite comparar hasta 3 candidatos en paralelo estilo tarjeta lado a lado.
- Diseño sobrio, sin emojis, utilizando iconos elegantes de Lucide.
```

---
### 4. FREEL-32: Web React - Registro Seguro de Tarjetas y Métodos de Pago (PAY-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Desarrollar la interfaz web segura para que los clientes registren sus tarjetas de crédito o débito cumpliendo con la normativa de seguridad.

[QUÉ DEBES REALIZAR]
1. Crear vista 'PaymentMethodsPage.jsx' con formulario de tarjeta (Número, Titular, MM/AA, CVC).
2. Algoritmo de Luhn en frontend para validar números de tarjeta en tiempo real y detectar marca (Visa, Mastercard, Amex).
3. Enmascaramiento de datos: nunca mostrar el número completo, solo los últimos 4 dígitos (**** **** **** 1234).
4. Conectar con la API de métodos de pago y listar las tarjetas registradas con opción de eliminar o marcar como principal.

[CRITERIOS DE ACEPTACIÓN]
- No almacena el CVC en ningún estado persistente o local storage.
- Feedback visual instantáneo ante campos incorrectos.
```

---
### 5. FREEL-37: Web React - Formulario de Creación de Convocatorias (HU-01)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir la pantalla web para que los clientes publiquen nuevas convocatorias de proyectos con sus requerimientos.

[QUÉ DEBES REALIZAR]
1. Crear el componente 'CreateProjectPage.jsx' en React con Tailwind.
2. Formulario con validación en vivo:
   - Título (mínimo 10 caracteres).
   - Descripción detallada (mínimo 30 caracteres).
   - Presupuesto estimado en MXN (> 0).
   - Selector de fecha estimada de entrega (posterior a hoy).
   - Selector interactivo de tags de habilidades (mínimo 3 requeridos, ej. React, Node, PostgreSQL).
3. Conectar con el endpoint POST /api/v1/projects enviando token JWT y redirigir al feed al completar.

[CRITERIOS DE ACEPTACIÓN]
- Formulario responsive que use la paleta oficial (Vino, Borgoña, Rosa Polvo, Arena).
- Deshabilita el botón de enviar mientras haya errores de validación.
```

---

## 👤 Paulo (5 Tareas Asignadas)

### 1. FLH-WALLET-01: Billetera Digital, Comisiones y Retiros (HU-14)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Gestionar los saldos de los usuarios, separar dinero en garantía de dinero disponible y procesar retiros bancarios.

[QUÉ DEBES REALIZAR]
1. Crear el modelo 'Wallet' (userId, availableBalance, escrowBalance) y 'Transaction' (monto, tipo, referencia).
2. Endpoint GET /api/v1/wallet: devuelve el desglose de saldo disponible y saldo retenido en hitos activos.
3. Descontar automáticamente el service fee de la plataforma (ej. 10%) al momento en que un pago se libera al saldo disponible.
4. Endpoint POST /api/v1/wallet/withdraw para registrar solicitudes de retiro a cuenta bancaria (CLABE).

[CRITERIOS DE ACEPTACIÓN]
- Transacciones inmutables: cada movimiento genera un registro contable.
- No permite retiros superiores al saldo disponible.
```

---
### 2. FLH-ESCROW-01: Máquina de Estados de Contratos y Fondos en Custodia (HU-05)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Implementar el ciclo de vida del contrato formal y la lógica de retención de fondos (Escrow) para garantizar la seguridad de ambas partes.

[QUÉ DEBES REALIZAR]
1. Diseñar el modelo 'Contract' en Prisma con estados: DRAFT (Borrador), FUNDED (Fondeado en garantía), IN_PROGRESS (En ejecución), COMPLETED (Finalizado), DISPUTED (En disputa).
2. Endpoint POST /api/v1/contracts para formalizar el acuerdo al aceptar una propuesta.
3. Endpoint POST /api/v1/contracts/:id/fund: simula o procesa el depósito en garantía antes de permitir al freelancer comenzar a trabajar.
4. Regla estricta: Los fondos fondeados no pueden ser retirados unilateralmente por el cliente sin revisión de hito o mediación.

[CRITERIOS DE ACEPTACIÓN]
- Ningún contrato pasa a IN_PROGRESS sin haber sido fondeado previamente.
- El estado queda auditado con fecha y monto retenido.
```

---
### 3. FREEL-43 & 44: API de Postulaciones y Control Anti-Abuso (HU-03 / HU-04)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir los endpoints para que los freelancers envíen sus propuestas aplicando reglas de negocio y restricciones de seguridad.

[QUÉ DEBES REALIZAR]
1. Implementar POST /api/v1/proposals en el backend: recibir carta de presentación, monto y array de hitos.
2. Validar que el freelancer autenticado tenga rol 'FREELANCER'.
3. Control anti-abuso: verificar que el freelancer NO tenga ya una propuesta activa o previa en el mismo proyecto (máximo 1).
4. Validar que el monto ofertado no exceda el presupuesto máximo fijado por el cliente.

[CRITERIOS DE ACEPTACIÓN]
- Retorna 201 Created con la propuesta e hitos creados.
- Retorna 400 si supera el presupuesto y 409 si ya había postulado previamente.
```

---
### 4. FREEL-42: DB Modelado de Propuestas y Cotización por Hitos (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Crear las tablas en base de datos para almacenar las propuestas económicas enviadas por los freelancers y el desglose de hitos cotizados.

[QUÉ DEBES REALIZAR]
1. En schema.prisma, crear el modelo 'Proposal' con campos: id, projectId (FK), freelancerId (FK), coverLetter (Text), totalPrice (Decimal), estimatedDays (Int), status (PENDING, ACCEPTED, REJECTED), createdAt.
2. Crear el modelo 'MilestoneQuote' con campos: id, proposalId (FK), title, description, amount (Decimal), deliveryDays (Int), order (Int).
3. Establecer relaciones con User y Project con borrado en cascada controlado.

[CRITERIOS DE ACEPTACIÓN]
- Cada propuesta puede tener N hitos asociados.
- La suma de los montos de los hitos coincide con el total de la cotización.
```

---
### 5. FREEL-38: DB & Índices de Búsqueda Full-Text para Feed (HU-01 / HU-02)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Optimizar el motor de base de datos PostgreSQL para que las búsquedas de proyectos en el Feed sean instantáneas y reactivas.

[QUÉ DEBES REALIZAR]
1. En schema.prisma, agregar índices B-Tree y GIN en el modelo Project sobre los campos: status, category, budget y createdAt.
2. Configurar la relación y búsqueda por tags de habilidades (skills) en ProjectSkill para búsquedas compuestas.
3. Ejecutar 'pnpm prisma db push' para impactar los índices en la base de datos de desarrollo y producción.

[CRITERIOS DE ACEPTACIÓN]
- Consultas de filtrado por categoría y rango de presupuesto resuelven en menos de 50ms.
- El esquema queda versionado sin conflictos con los modelos existentes.
```

---

## 👤 Uriel (5 Tareas Asignadas)

### 1. FLH-FE-CHAT: Web React - Drawer Lateral de Chat Contextual por Proyecto (HU-11)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Diseñar el panel deslizable de mensajería instantánea dentro de la plataforma web para la comunicación directa del contrato.

[QUÉ DEBES REALIZAR]
1. Componente 'ProjectChatDrawer.jsx' que se despliega desde el lateral derecho al presionar 'Mensajes'.
2. Historial de mensajes ordenado cronológicamente con separación de días.
3. Input con soporte para texto y envío de enlaces.
4. Conexión con WebSockets para recibir mensajes instantáneos sin recargar la página e indicador de 'Escribiendo...'.

[CRITERIOS DE ACEPTACIÓN]
- El chat queda estrictamente vinculado al ID del proyecto (no es un chat global aleatorio).
- No bloquea la navegación en el resto de la pantalla.
```

---
### 2. FLH-FE-DELIVERY: Web React - Visor de Entregables e Inspección Técnica (HU-06)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir el centro de inspección de entregables para que el cliente revise los avances de cada hito antes de liberar el dinero.

[QUÉ DEBES REALIZAR]
1. Componente 'DeliveryInspectionModal.jsx': se abre al hacer click en un hito que esté 'En Revisión'.
2. Mostrar notas técnicas enviadas por el desarrollador.
3. Visor de enlaces: preview de repositorios de GitHub, tableros de Figma o carpetas compartidas.
4. Descarga segura de archivos adjuntos mostrando el hash SHA-256 verificado con badge de 'Integridad Garantizada'.
5. Dos botones de acción: 'Solicitar Correcciones' (con campo de feedback) o 'Aprobar y Liberar Pago'.

[CRITERIOS DE ACEPTACIÓN]
- El cliente tiene total claridad técnica de lo que va a aprobar antes de soltar el dinero.
```

---
### 3. FLH-FE-ESCROW: Web React - Pantalla de Fondeo de Contrato en Custodia (HU-05)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Desarrollar la pantalla web donde el cliente formaliza el acuerdo y realiza el depósito en garantía antes de que comience el trabajo.

[QUÉ DEBES REALIZAR]
1. Componente 'ContractFundingPage.jsx' con el resumen legal del acuerdo: Freelancer seleccionado, Total a pagar y Calendario de hitos.
2. Selector de método de pago registrado o formulario rápido de tarjeta.
3. Desglose financiero transparente: Monto del trabajo + Tarifa de servicio = Total a retener.
4. Botón de acción 'Autorizar y Depositar en Custodia': conecta con el backend para bloquear los fondos en Escrow y cambiar el estado del contrato a IN_PROGRESS.

[CRITERIOS DE ACEPTACIÓN]
- Confirmación visual con modal de seguridad antes de procesar el cobro.
- Muestra comprobante digital del depósito en garantía para descargar o consultar.
```

---
### 4. FREEL-31: Backend - API de Tokenización y Tarjetas PCI-DSS (PAY-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Construir los endpoints para el registro y gestión segura de métodos de pago en el backend cumpliendo con las normas de protección de datos.

[QUÉ DEBES REALIZAR]
1. Endpoint POST /api/v1/payment-methods: recibir token de tarjeta, marca (Visa/Mastercard), últimos 4 dígitos y fecha de expiración.
2. Prohibición estricta: NUNCA guardar números de tarjeta completos ni códigos CVC en base de datos.
3. Guardar en el modelo PaymentMethod de Prisma asociándolo al usuario autenticado.
4. Endpoint GET /api/v1/payment-methods para consultar las tarjetas guardadas del usuario.
5. Endpoint DELETE /api/v1/payment-methods/:id para desvincular un método de pago.

[CRITERIOS DE ACEPTACIÓN]
- Respuestas 100% sanitizadas que cumplen la normativa PCI-DSS.
- Solo el usuario propietario puede consultar o eliminar sus métodos de pago.
```

---
### 5. FREEL-41: Móvil Flutter - Catálogo y Feed Reactivo de Convocatorias (HU-02)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[OBJETIVO DE LA ACTIVIDAD]
Desarrollar la pantalla principal de exploración de vacantes y proyectos en la app móvil en Flutter.

[QUÉ DEBES REALIZAR]
1. Crear la vista 'ProjectFeedScreen' con un listado scrolleable de convocatorias activas con 'Pull to Refresh'.
2. Barra de búsqueda superior para filtrar por título o descripción en tiempo real (debounce).
3. Chips de categorías y filtro por tags de habilidades (ej. Flutter, React, Python).
4. Filtro por rango de presupuesto (slider de precio mínimo y máximo).
5. Tarjetas limpias que muestren: Título, Cliente, Presupuesto en badge destacado, tiempo restante y cantidad de postulaciones.

[CRITERIOS DE ACEPTACIÓN]
- Al tocar una convocatoria, navega al detalle del proyecto.
- Manejo de estados de carga (shimmers) y pantalla vacía cuando no hay coincidencias.
```

---
