# 📋 Tablero de Tareas con Clasificación de Capas — FreelancerHub

> [!IMPORTANT]
> **Aclaración para el Equipo de Desarrollo:**
> Las actividades están divididas estrictamente por su capa de arquitectura técnica. Revisa el badge de tu tarea para saber si es de **[BACKEND / DB]**, **[FRONTEND WEB (React)]** o **[FRONTEND MÓVIL (Flutter)]**.

---

## 👥 Resumen de Roles y Capas

| Integrante | Capa Principal Asignada | Resumen de Actividades |
| :--- | :--- | :--- |
| **Paulo Essau** | **BACKEND & BASE DE DATOS** | Índices PostgreSQL, Modelado Propuestas, API Postulaciones, Escrow Core y Billetera Digital. *(0% Frontend)* |
| **Diego Alejandro** | **MÓVIL FLUTTER & BACKEND** | 1 Pantalla Flutter (Cotización de Hitos) + 4 Módulos Backend (Entregas SHA-256, Pagos Atómicos, Disputas y Alcance). |
| **Karla Mtz** | **FRONTEND WEB (React)** | Publicación de Proyectos, Tarjetas PCI Web, Matriz Comparativa MCDA, Kanban de Hitos y Reseña Ciega. |
| **Uriel Hernandez** | **MÓVIL, BACKEND & WEB** | 1 Pantalla Flutter (Feed Convocatorias) + 1 Módulo Backend (Tarjetas) + 3 Módulos Web (Escrow, Visor Entregas y Chat). |
| **Axel Rocha** | **MÓVIL FLUTTER & WEB** | 1 Modal Web (Postulación) + 4 Módulos Móviles en Flutter (Carga Evidencias, Biometría, Billetera y Modo Offline). |
| **Christopher Isaac** | **BACKEND, MÓVIL & QA** | 2 Módulos Backend (Feed y Seguridad PII) + 1 Módulo WebSockets + 1 Pantalla Flutter (Chat) + Suite E2E Playwright. |

---

## 👤 Axel (5 Tareas)

### 1. FREEL-45: [FRONTEND WEB] Modal para Postular Propuesta Económica por Hitos (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Modales de Postulación).

[OBJETIVO TÉCNICO]
Construir el modal web para que los freelancers postulen su cotización desglosada al ver una convocatoria.

[ARCHIVOS A CREAR/MODIFICAR]
- src/features/projects/components/SubmitProposalModal.jsx

[QUÉ DEBES PROGRAMAR]
1. Modal en React con inputs: Carta de presentación, Precio total ofertado, Días estimados y hasta 3 URLs de portafolio.
2. Desglose dinámico de hitos con campos de monto y fecha de entrega parcial.
3. Conectar con POST /api/v1/proposals y mostrar feedback Toast tras postular.

[CRITERIOS DE ACEPTACIÓN]
- Impide postular si el monto supera el presupuesto del cliente o faltan campos obligatorios.
```

---
### 2. FLH-MOB-DELIVERY: [FRONTEND MÓVIL] Carga de Evidencias de Entregables en Flutter (HU-06)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Dart / Carga Multimedia).

[OBJETIVO TÉCNICO]
Pantalla móvil para que el freelancer suba archivos de entrega o fotos de evidencia técnica desde el celular.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/screens/submit_delivery_screen.dart

[QUÉ DEBES PROGRAMAR]
1. Integración con image_picker y file_picker en Flutter para seleccionar archivos locales o capturar fotos.
2. Entrada para notas técnicas y enlace de repositorio.
3. Barra de progreso visual durante la subida multipart.
4. Conectar con POST /api/v1/milestones/:id/deliveries.

[CRITERIOS DE ACEPTACIÓN]
- Permite subir entregables desde el dispositivo móvil con manejo de errores por red.
```

---
### 3. FLH-MOB-APPROVE: [FRONTEND MÓVIL] Aprobación con Autenticación Biométrica o PIN (HU-07)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Seguridad Local).

[OBJETIVO TÉCNICO]
Integrar autenticación biométrica nativa para que el cliente autorice la liberación de fondos desde el smartphone.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/screens/milestone_approval_screen.dart

[QUÉ DEBES PROGRAMAR]
1. Pantalla de revisión de entregable en Flutter con botón 'Aprobar y Liberar Fondos'.
2. Invocar la librería 'local_auth' de Flutter para solicitar huella digital, FaceID o PIN de seguridad del dispositivo.
3. Al autenticarse correctamente, enviar la orden al backend para transferir el dinero.

[CRITERIOS DE ACEPTACIÓN]
- Si la biometría es cancelada o falla, la transacción no se envía al servidor.
```

---
### 4. FLH-MOB-WALLET: [FRONTEND MÓVIL] Billetera Digital y Solicitud de Retiros en Flutter (HU-14)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Finanzas Personales).

[OBJETIVO TÉCNICO]
Diseñar la sección financiera del desarrollador en la app móvil.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/screens/wallet_screen.dart

[QUÉ DEBES PROGRAMAR]
1. Tarjetas destacadas: Saldo Disponible vs Saldo en Custodia Escrow.
2. Listado cronológico de pagos recibidos con indicador de comisión descontada.
3. Modal para solicitar retiro bancario ingresando monto y cuenta CLABE.

[CRITERIOS DE ACEPTACIÓN]
- Permite al freelancer consultar sus ingresos acumulados y transferir fondos.
```

---
### 5. FLH-MOB-OFFLINE: [FRONTEND MÓVIL] Caching Local con Hive para Modo Offline (Rúbrica)
- **Prioridad**: `LOW` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Almacenamiento Local).

[OBJETIVO TÉCNICO]
Garantizar que la app móvil funcione y permita consultar convocatorias incluso sin conexión a internet.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/services/offline_cache_service.dart

[QUÉ DEBES PROGRAMAR]
1. Configurar Hive o SharedPreferences para persistir la última lista de proyectos consultados.
2. Si connectivity_plus reporta sin conexión, cargar los datos locales mostrando un banner discreto 'Modo Offline'.

[CRITERIOS DE ACEPTACIÓN]
- La app no se congela ni crashea al abrirse sin señal de red.
```

---

## 👤 Christian (5 Tareas)

### 1. FREEL-39: [BACKEND / API] API de Feed Reactivo con Filtrado por Tags y Presupuesto (HU-01 / HU-02)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Consultas Prisma).

[OBJETIVO TÉCNICO]
Construir el endpoint central de consulta y filtros de convocatorias para web y móvil.

[ARCHIVOS A MODIFICAR]
- src/presentation/routes/project.routes.ts
- src/presentation/controllers/project.controller.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint GET /api/v1/projects con query params: search, category, minBudget, maxBudget, skills, page, limit.
2. Filtrar únicamente proyectos con estado 'ACTIVE'.
3. Devolver lista paginada con metadatos (total, totalPages, currentPage).

[CRITERIOS DE ACEPTACIÓN]
- Permite filtros combinados de búsqueda con respuesta ágil.
```

---
### 2. FREEL-40 & 30: [BACKEND / SEGURIDAD] Control de Exposición de Datos y Sanitización (HU-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Seguridad de la Información / Zod).

[OBJETIVO TÉCNICO]
Asegurar que los endpoints públicos no expongan correos, teléfonos ni hashes de contraseñas de los clientes.

[ARCHIVOS A MODIFICAR]
- src/application/dtos/public-project-response.dto.ts
- src/presentation/middlewares/sanitize.middleware.ts

[QUÉ DEBES PROGRAMAR]
1. Diseñar DTO de salida para convocatorias públicas omitiendo información privada del cliente.
2. Middleware de sanitización para eliminar scripts maliciosos o etiquetas HTML peligrosas en títulos y descripciones.
3. Auditoría de respuestas en endpoints financieros para no exponer datos bancarios sensibles.

[CRITERIOS DE ACEPTACIÓN]
- Ningún endpoint público devuelve datos personales identificables (PII) innecesarios.
```

---
### 3. FLH-BE-SOCKET: [BACKEND / WEBSOCKETS] Servidor Socket.io en Vivo para Chat y Eventos (HU-11)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / WebSockets en Tiempo Real).

[OBJETIVO TÉCNICO]
Configurar la infraestructura de mensajería instantánea y eventos en vivo del sistema.

[ARCHIVOS A CREAR/MODIFICAR]
- src/infrastructure/realtime/socket.server.ts
- src/index.ts

[QUÉ DEBES PROGRAMAR]
1. Montar Socket.io sobre el servidor HTTP existente en Express.
2. Middleware de autenticación con JWT para autorizar conexiones websocket.
3. Manejo de salas por contrato ('room:contract_id') para que los mensajes solo lleguen a los involucrados.
4. Emitir eventos del ciclo de vida: 'new_message', 'milestone_submitted', 'milestone_approved'.

[CRITERIOS DE ACEPTACIÓN]
- Conexiones concurrentes estables sin memory leaks.
```

---
### 4. FLH-MOB-CHAT: [FRONTEND MÓVIL] Pantalla de Chat en Vivo en Flutter con WebSockets (HU-11)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Dart / Realtime Chat).

[OBJETIVO TÉCNICO]
Construir la pantalla de conversación instantánea en la app móvil.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/screens/chat_screen.dart

[QUÉ DEBES PROGRAMAR]
1. Integrar cliente 'socket_io_client' en Flutter conectado al servidor Socket.io con token JWT.
2. Pantalla de chat con burbujas de conversación, hora de envío y estado de lectura.
3. Notificación auditiva o háptica al recibir nuevos mensajes.

[CRITERIOS DE ACEPTACIÓN]
- Los mensajes recibidos se pintan en pantalla al instante sin recargar.
```

---
### 5. FLH-TEST-E2E: [QA / AUTOMATIZACIÓN] Suite de Pruebas de Integración E2E del Sistema (Rúbrica)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
QA & TESTING AUTOMATIZADO (Playwright / TypeScript).

[OBJETIVO TÉCNICO]
Automatizar la prueba de punta a punta del flujo completo del negocio como evidencia final del proyecto.

[ARCHIVOS A CREAR/MODIFICAR]
- e2e/full-business-cycle.spec.ts

[QUÉ DEBES PROGRAMAR]
1. Test 1: Cliente publica convocatoria con presupuesto y tags.
2. Test 2: Freelancer se postula cotizando hitos.
3. Test 3: Cliente acepta y realiza fondeo simulado en garantía Escrow.
4. Test 4: Freelancer entrega hito con archivo y hash SHA-256.
5. Test 5: Cliente aprueba hito y verifica acreditación de saldo en billetera.

[CRITERIOS DE ACEPTACIÓN]
- La suite corre completa con salida exitosa demostrando que todos los módulos se integran perfectamente.
```

---

## 👤 Diego (5 Tareas)

### 1. FREEL-46: [FRONTEND MÓVIL] Pantalla Flutter de Postulación y Cotización (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Dart) — Aplicación para smartphones.

[OBJETIVO TÉCNICO]
Crear la interfaz de usuario móvil para que los freelancers coticen proyectos divididos en hitos desde el celular.

[ARCHIVOS A MODIFICAR]
- lib/screens/proposal_submission_screen.dart
- lib/widgets/milestone_input_card.dart

[QUÉ DEBES PROGRAMAR]
1. Pantalla con formulario en Flutter: Carta de presentación, Precio total y Plazo en días.
2. Formulario dinámico de hitos: botón para agregar entregables parciales especificando título y monto.
3. Validación en tiempo real: verificar que la suma de los montos coincida exactamente con el precio total.
4. Consumir el endpoint POST /api/v1/proposals con Dio o Http enviando el token JWT.

[CRITERIOS DE ACEPTACIÓN]
- Diseño usando la paleta oficial (#5A0F24 Vino, #C68A8F Rosa Polvo, #F3EFE6 Crema).
- Manejo visual de errores con snackbars o alerts nativas.
```

---
### 2. FLH-BE-DELIVERY: [BACKEND / API] Entrega Técnica con Integridad Criptográfica SHA-256 (HU-06)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Multer / Crypto).

[OBJETIVO TÉCNICO]
Construir el servicio backend para la recepción de entregables de hitos asegurando la inmutabilidad de los archivos.

[ARCHIVOS A MODIFICAR]
- src/presentation/routes/delivery.routes.ts
- src/application/use-cases/submit-delivery.use-case.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/milestones/:id/deliveries soportando notas técnicas, URLs (GitHub/Drive) y archivos adjuntos (Multer).
2. Generar el hash criptográfico SHA-256 de cada archivo recibido antes de guardarlo en disco o storage.
3. Almacenar la URL y el hash SHA-256 en la base de datos para auditoría de integridad.
4. Actualizar el estado del hito a 'IN_REVIEW'.

[CRITERIOS DE ACEPTACIÓN]
- Hash SHA-256 persistido correctamente; previene manipulaciones posteriores de los archivos.
```

---
### 3. FLH-BE-RELEASE: [BACKEND / TRANSACCIONAL] Aprobación de Hitos y Liberación Atómica (HU-07)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Transacciones ACID en PostgreSQL).

[OBJETIVO TÉCNICO]
Endpoint transaccional crítico que descuenta el dinero de custodia y lo deposita en la billetera del freelancer al aprobarse un trabajo.

[ARCHIVOS A MODIFICAR]
- src/application/use-cases/approve-milestone.use-case.ts
- src/presentation/controllers/milestone.controller.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/milestones/:id/approve verificando que quien llama sea el CLIENT del proyecto.
2. Ejecutar transacción atómica en Prisma ($transaction):
   a. Pasar estado del hito a 'APPROVED'.
   b. Reducir saldo en garantía del contrato.
   c. Acreditar el saldo neto a la billetera del freelancer descontando la comisión.
   d. Generar registro contable de la operación.
3. Si era el último hito del proyecto, cambiar el estado del contrato a 'COMPLETED'.

[CRITERIOS DE ACEPTACIÓN]
- Transacción 100% atómica con rollback ante cualquier fallo para evitar saldos inconsistentes.
```

---
### 4. FLH-BE-DISPUTE: [BACKEND / ARBITRAJE] Módulo de Disputas Contractuales y rol Mediador (HU-12)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Seguridad & Roles).

[OBJETIVO TÉCNICO]
Crear el sistema de mediación cuando cliente y freelancer entran en conflicto sobre una entrega.

[ARCHIVOS A MODIFICAR]
- src/presentation/routes/dispute.routes.ts
- src/application/use-cases/resolve-dispute.use-case.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/contracts/:id/disputes: congela automáticamente el hito en disputa ('DISPUTED').
2. Endpoint GET /api/v1/disputes para listar casos abiertos (solo accesible por rol 'MEDIADOR').
3. Endpoint POST /api/v1/disputes/:id/resolve con veredicto del mediador (reembolso cliente, pago al dev o split 50/50).

[CRITERIOS DE ACEPTACIÓN]
- Solo usuarios con rol MEDIADOR pueden dictaminar y desbloquear los fondos.
```

---
### 5. FLH-BE-SCOPE: [BACKEND / ALGORITMOS] Regulación de Alcance con Triángulo de Hierro (HU-08)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Lógica Matemática de Negocio).

[OBJETIVO TÉCNICO]
Implementar el cálculo de impacto en costo y tiempo cuando el cliente pide cambios de requerimientos en contratos activos.

[ARCHIVOS A MODIFICAR]
- src/domain/services/scope-calculator.service.ts
- src/presentation/routes/change-request.routes.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/contracts/:id/change-requests para registrar adendas o variaciones.
2. Algoritmo Triángulo de Hierro: calcular incremento en presupuesto y días estimados según la complejidad añadida.
3. Exigir confirmación digital mutua antes de aplicar el nuevo alcance al contrato.

[CRITERIOS DE ACEPTACIÓN]
- Protege al desarrollador evitando peticiones de trabajo adicional sin presupuesto extra.
```

---

## 👤 Karla (5 Tareas)

### 1. FREEL-37: [FRONTEND WEB] Formulario de Creación y Publicación de Convocatorias (HU-01)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React 19 / Vite / Tailwind CSS) — Cero trabajo de Backend.

[OBJETIVO TÉCNICO]
Construir la pantalla web para que los clientes publiquen convocatorias de trabajo con validaciones en tiempo real.

[ARCHIVOS A CREAR/MODIFICAR]
- src/pages/CreateProjectPage.jsx
- src/routes/AppRoutes.jsx

[QUÉ DEBES PROGRAMAR]
1. Formulario web con inputs: Título (mín 10 caracteres), Descripción (mín 30 caracteres), Presupuesto estimado en MXN y Fecha límite.
2. Selector interactivo de habilidades (tags): chips seleccionables (ej. React, Node, PostgreSQL, Flutter) exigiendo mínimo 3 tags.
3. Conectar con el endpoint POST /api/v1/projects mediante axios y redirigir al Dashboard tras publicar.

[CRITERIOS DE ACEPTACIÓN]
- Diseño sobrio con paleta oficial (#5A0F24 Vino, #F3EFE6 Crema) y validaciones visuales sin emojis.
```

---
### 2. FREEL-32: [FRONTEND WEB] Registro Seguro de Métodos de Pago y Tarjetas (PAY-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Tailwind CSS / Seguridad PCI).

[OBJETIVO TÉCNICO]
Construir la pantalla para capturar y gestionar tarjetas de crédito/débito de clientes con validación de seguridad.

[ARCHIVOS A CREAR/MODIFICAR]
- src/pages/PaymentMethodsPage.jsx
- src/features/payments/CardInputForm.jsx

[QUÉ DEBES PROGRAMAR]
1. Formulario de captura con validación de algoritmo de Luhn y detección de franquicia (Visa, Mastercard, Amex).
2. Enmascaramiento automático: mostrar solo los últimos 4 dígitos (**** **** **** 4242).
3. Conectar con la API para listar tarjetas guardadas y botón para eliminar métodos de pago.

[CRITERIOS DE ACEPTACIÓN]
- Prohibición: Nunca guardar el código de seguridad CVC en memoria persistente ni local storage.
```

---
### 3. FLH-FE-MCDA: [FRONTEND WEB] Matriz Visual Comparativa de Candidatos con Score (HU-04)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Componentes Analíticos).

[OBJETIVO TÉCNICO]
Construir la interfaz para que el cliente compare postulantes evaluando tarifa, plazo y compatibilidad de habilidades.

[ARCHIVOS A CREAR/MODIFICAR]
- src/features/projects/components/CandidateComparisonView.jsx

[QUÉ DEBES PROGRAMAR]
1. Vista comparativa que liste a los candidatos en tarjetas lado a lado o tabla interactiva.
2. Mostrar: Nombre, reputación, precio cotizado, desglose de hitos y barra de score MCDA (0 a 100%).
3. Botones de acción: 'Ver Portafolio', 'Iniciar Chat' y 'Aceptar Propuesta' (que dispara la creación de contrato).

[CRITERIOS DE ACEPTACIÓN]
- Interfaz clara que facilita al cliente tomar una decisión informada de contratación.
```

---
### 4. FLH-FE-KANBAN: [FRONTEND WEB] Tablero Kanban de Seguimiento de Hitos de Contrato (HU-10)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Tableros Drag-and-Drop).

[OBJETIVO TÉCNICO]
Crear el tablero visual interactivo para monitorear el progreso de los hitos dentro de un contrato activo.

[ARCHIVOS A CREAR/MODIFICAR]
- src/pages/ContractKanbanPage.jsx

[QUÉ DEBES PROGRAMAR]
1. Tablero con 3 columnas: 'Por Hacer', 'En Revisión' y 'Aprobado & Pagado'.
2. Las tarjetas muestran título del hito, monto en custodia y botón para inspeccionar entrega técnica.
3. Actualización de estado en tiempo real para cliente y desarrollador.

[CRITERIOS DE ACEPTACIÓN]
- Refleja al instante el estado del flujo de entrega y pago del proyecto.
```

---
### 5. FLH-FE-REVIEW: [FRONTEND WEB] Modal de Calificación Ciega y Feedback Recíproco (HU-13)
- **Prioridad**: `LOW` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Modales & UX).

[OBJETIVO TÉCNICO]
Desarrollar el modal de evaluación recíproca con sistema ciego al concluir el último hito del contrato.

[ARCHIVOS A CREAR/MODIFICAR]
- src/features/reviews/BlindReviewModal.jsx

[QUÉ DEBES PROGRAMAR]
1. Modal emergente con selector de calificación de 1 a 5 estrellas y área de comentarios.
2. Mensaje informativo claro: 'Tu valoración permanecerá oculta hasta que ambas partes hayan emitido su calificación'.
3. Conectar con el endpoint POST /api/v1/reviews y deshabilitar reenvíos.

[CRITERIOS DE ACEPTACIÓN]
- Previene sesgos o represalias mostrando el estado 'Calificación enviada, esperando a la contraparte'.
```

---

## 👤 Paulo (5 Tareas)

### 1. FREEL-38: [BACKEND / DB] Índices de Búsqueda Full-Text para Feed (HU-01 / HU-02)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND & BASE DE DATOS (PostgreSQL / Prisma ORM) — Cero trabajo de Frontend.

[OBJETIVO TÉCNICO]
Optimizar el motor de PostgreSQL para que las consultas de búsqueda y filtrado de convocatorias resuelvan en milisegundos.

[ARCHIVOS A MODIFICAR]
- prisma/schema.prisma
- src/infrastructure/persistence/repositories/

[QUÉ DEBES PROGRAMAR]
1. En schema.prisma, agregar índices B-Tree y GIN en el modelo 'Project' sobre: status, category, budget y createdAt.
2. Configurar índices relacionales en 'ProjectSkill' para acelerar la búsqueda por etiquetas de tecnología.
3. Ejecutar 'pnpm prisma db push' para aplicar los cambios a la base de datos.

[CRITERIOS DE ACEPTACIÓN]
- Consultas con filtros combinados resuelven en < 50ms sin bloqueos de tabla.
```

---
### 2. FREEL-42: [BACKEND / DB] Modelado Relacional de Propuestas y Cotizaciones (HU-03)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND & BASE DE DATOS (Prisma ORM) — Cero trabajo de Frontend.

[OBJETIVO TÉCNICO]
Diseñar la estructura de persistencia para almacenar propuestas económicas e hitos cotizados por los freelancers.

[ARCHIVOS A MODIFICAR]
- prisma/schema.prisma

[QUÉ DEBES PROGRAMAR]
1. Crear modelo 'Proposal' con: id, projectId (FK), freelancerId (FK), coverLetter, totalPrice, estimatedDays, status (Enum: PENDING, ACCEPTED, REJECTED).
2. Crear modelo 'MilestoneQuote' con: id, proposalId (FK), title, description, amount, deliveryDays, order.
3. Configurar relaciones con onDelete: Cascade para consistencia referencial.

[CRITERIOS DE ACEPTACIÓN]
- Tablas creadas en PostgreSQL con relaciones validadas por Prisma Client.
```

---
### 3. FREEL-43 & 44: [BACKEND / API] Controladores y Casos de Uso de Postulación (HU-03 / HU-04)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / TypeScript / Clean Architecture).

[OBJETIVO TÉCNICO]
Implementar la lógica de negocio para recibir ofertas de freelancers aplicando validaciones de presupuesto y anti-abuso.

[ARCHIVOS A MODIFICAR]
- src/application/use-cases/
- src/presentation/controllers/
- src/presentation/routes/

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/proposals con DTO validado con Zod.
2. Regla 1: Validar que el monto total ofertado no exceda el presupuesto máximo fijado por el cliente.
3. Regla 2 (Anti-abuso): Restringir a máximo 1 propuesta activa por freelancer en un mismo proyecto (retornar 409 Conflict si ya existe).
4. Guardar la propuesta y sus hitos de manera transaccional.

[CRITERIOS DE ACEPTACIÓN]
- Retorna 201 Created al registrar exitosamente y 400/409 ante violaciones de negocio.
```

---
### 4. FLH-ESCROW-01: [BACKEND / CORE] Máquina de Estados de Contratos y Custodia Escrow (HU-05)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Transacciones PostgreSQL).

[OBJETIVO TÉCNICO]
Gestionar el ciclo de vida del contrato formal y la retención garantizada de fondos para proteger a cliente y freelancer.

[ARCHIVOS A MODIFICAR]
- src/domain/entities/
- src/application/use-cases/
- src/presentation/routes/

[QUÉ DEBES PROGRAMAR]
1. Modelo 'Contract' con máquina de estados estricta: DRAFT -> FUNDED -> IN_PROGRESS -> COMPLETED -> DISPUTED.
2. Endpoint POST /api/v1/contracts para crear el contrato al aceptar una propuesta.
3. Endpoint POST /api/v1/contracts/:id/fund para retener el saldo del cliente en custodia antes de habilitar el inicio del trabajo.
4. Regla: Ningún freelancer puede marcar avances si el contrato no está en estado 'FUNDED' o 'IN_PROGRESS'.

[CRITERIOS DE ACEPTACIÓN]
- Fondos retenidos inmutables: el cliente no puede retirar fondos de forma unilateral mientras el trabajo esté en curso.
```

---
### 5. FLH-WALLET-01: [BACKEND / FINANZAS] Billetera Digital, Service Fee y Retiros (HU-14)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Arquitectura Financiera).

[OBJETIVO TÉCNICO]
Administrar balances contables (saldo disponible vs retenido) y aplicar la comisión de plataforma.

[ARCHIVOS A MODIFICAR]
- src/application/use-cases/
- src/presentation/controllers/wallet.controller.ts

[QUÉ DEBES PROGRAMAR]
1. Modelos 'Wallet' y 'WalletTransaction' (entradas, salidas, comisiones).
2. Endpoint GET /api/v1/wallet para consultar balance retenido y balance disponible.
3. Aplicar descuento automático de comisión (service fee de plataforma ej. 10%) al acreditar pagos.
4. Endpoint POST /api/v1/wallet/withdraw para procesar órdenes de retiro a cuentas CLABE.

[CRITERIOS DE ACEPTACIÓN]
- Auditoría contable perfecta: el balance cuadra con el historial de transacciones.
```

---

## 👤 Uriel (5 Tareas)

### 1. FREEL-41: [FRONTEND MÓVIL] Catálogo y Feed Reactivo de Convocatorias en Flutter (HU-02)
- **Prioridad**: `URGENT` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND MÓVIL (Flutter / Dart) — Aplicación móvil.

[OBJETIVO TÉCNICO]
Construir la pantalla principal de exploración de vacantes para freelancers en la app móvil.

[ARCHIVOS A CREAR/MODIFICAR]
- lib/screens/project_feed_screen.dart
- lib/widgets/project_card.dart

[QUÉ DEBES PROGRAMAR]
1. Listado de proyectos activos con 'Pull to Refresh' y scroll infinito.
2. Barra de búsqueda superior con filtrado en tiempo real por palabras clave y tags de habilidades.
3. Filtros por slider de presupuesto mínimo y máximo.
4. Navegación al tocar una tarjeta hacia el detalle de la convocatoria.

[CRITERIOS DE ACEPTACIÓN]
- Estados de carga (shimmers) y pantalla amigable cuando no hay resultados.
```

---
### 2. FREEL-31: [BACKEND / API] API de Tokenización y Tarjetas PCI-DSS (PAY-01)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
BACKEND (Node.js / Express / Seguridad PCI-DSS).

[OBJETIVO TÉCNICO]
Construir los endpoints para el registro y almacenamiento seguro de métodos de pago en el servidor.

[ARCHIVOS A MODIFICAR]
- src/presentation/routes/payment-method.routes.ts
- src/application/use-cases/register-card.use-case.ts

[QUÉ DEBES PROGRAMAR]
1. Endpoint POST /api/v1/payment-methods: guardar solo token de pasarela, marca y últimos 4 dígitos.
2. Endpoint GET /api/v1/payment-methods: listar métodos de pago del usuario autenticado.
3. Endpoint DELETE /api/v1/payment-methods/:id: desvincular tarjeta.

[CRITERIOS DE ACEPTACIÓN]
- Cumplimiento estricto de PCI-DSS: prohibido almacenar números completos o CVCs en PostgreSQL.
```

---
### 3. FLH-FE-ESCROW: [FRONTEND WEB] Pantalla de Fondeo de Contrato en Garantía Escrow (HU-05)
- **Prioridad**: `HIGH` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Pasarela Financiera).

[OBJETIVO TÉCNICO]
Construir la pantalla web donde el cliente autoriza el contrato y realiza el depósito en garantía antes de iniciar el trabajo.

[ARCHIVOS A CREAR/MODIFICAR]
- src/pages/ContractFundingPage.jsx

[QUÉ DEBES PROGRAMAR]
1. Resumen contractual: monto acordado, freelancer asignado y lista de entregables pactados.
2. Selector de tarjeta guardada para ejecutar el fondeo en custodia.
3. Conectar con POST /api/v1/contracts/:id/fund para bloquear los fondos y cambiar estado a 'FUNDED'.

[CRITERIOS DE ACEPTACIÓN]
- Mensaje de confirmación y comprobante digital del depósito en garantía para auditoría.
```

---
### 4. FLH-FE-DELIVERY: [FRONTEND WEB] Visor de Entregables e Inspección Técnica con Hashes (HU-06)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / Inspección de Evidencias).

[OBJETIVO TÉCNICO]
Diseñar el centro de revisión de avances técnicos para que el cliente evalúe entregables antes de liberar fondos.

[ARCHIVOS A CREAR/MODIFICAR]
- src/features/contracts/components/DeliveryInspectionModal.jsx

[QUÉ DEBES PROGRAMAR]
1. Modal de inspección con notas técnicas enviadas por el desarrollador.
2. Visor de enlaces (GitHub, Figma, Demos) y botón de descarga de archivos adjuntos.
3. Mostrar badge de 'Integridad Verificada' con el hash criptográfico SHA-256.
4. Botón 'Aprobar Hito y Liberar Pago' que conecta con el endpoint de aprobación.

[CRITERIOS DE ACEPTACIÓN]
- El cliente tiene total claridad del entregable antes de autorizar el pago.
```

---
### 5. FLH-FE-CHAT: [FRONTEND WEB] Drawer Lateral de Chat Contextual por Proyecto (HU-11)
- **Prioridad**: `MEDIUM` | **Estado**: `TODO`

```text
[CAPA DEL PROYECTO]
FRONTEND WEB (React / WebSockets).

[OBJETIVO TÉCNICO]
Integrar panel deslizable de chat en vivo vinculado al contrato activo.

[ARCHIVOS A CREAR/MODIFICAR]
- src/features/chat/ProjectChatDrawer.jsx

[QUÉ DEBES PROGRAMAR]
1. Drawer lateral desplegable desde el detalle del proyecto.
2. Conexión con el servidor Socket.io enviando token JWT y uniéndose a la sala del contrato.
3. Lista de mensajes en tiempo real con indicador visual de 'Enviado' y 'Leído'.

[CRITERIOS DE ACEPTACIÓN]
- Comunicación fluida sin recargar pantalla y aislada por proyecto.
```

---
