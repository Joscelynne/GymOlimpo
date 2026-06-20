# Requirements Document

## Introduction

GymOlimpo requiere un rediseño completo de su panel de administración (dashboard) para transformarlo en un sistema moderno de gestión tipo SaaS. El dashboard actual presenta problemas de aprovechamiento del espacio, métricas básicas, botones sin funcionalidad completa y ausencia de visualizaciones gráficas. El nuevo panel debe ofrecer una experiencia ejecutiva del negocio, con métricas en tiempo real, alertas inteligentes, gráficos interactivos, calendario de reservas, tablas rediseñadas y acciones rápidas completamente funcionales. El stack tecnológico es Angular 17 + Ionic 7 + Firebase (AngularFire compat), con diseño dark mode inspirado en Stripe, Linear y Vercel Dashboard.

## Glossary

- **Dashboard**: Panel de administración principal accesible solo para usuarios con rol `admin`.
- **KPI_Card**: Tarjeta visual que muestra una métrica clave del negocio (clientes activos, reservas, ingresos, etc.).
- **Alert_Panel**: Componente que agrupa y prioriza alertas del negocio por nivel de urgencia.
- **Chart_Component**: Componente de gráfico interactivo integrado con datos de Firebase.
- **Calendar_View**: Vista de calendario que muestra reservas, cupos y eventos por día/semana.
- **Reservas_Table**: Tabla rediseñada con badges visuales para gestión de reservas recientes.
- **Pagos_Panel**: Panel de pagos recientes con estado de validación y método de pago.
- **Planes_Panel**: Panel de clientes con planes próximos a vencer.
- **Clientes_Inactivos_Panel**: Panel de clientes sin asistencia en los últimos 15 días.
- **Horarios_Panel**: Panel de los horarios con mayor demanda y ocupación.
- **Quick_Actions**: Conjunto de botones de acciones rápidas completamente funcionales.
- **GymService**: Servicio Angular existente que gestiona la comunicación con Firestore.
- **AdminPage**: Componente Angular/Ionic que representa el dashboard de administración.
- **Firestore**: Base de datos Firebase en tiempo real que almacena horarios, reservas, pagos y usuarios.
- **Horario**: Documento Firestore con campos `fecha`, `hora`, `cupos`, `cuposDisponibles`, `entrenador`.
- **Reserva**: Documento Firestore con campos `userId`, `clienteNombre`, `fecha`, `hora`, `estado`, `createdAt`.
- **Pago**: Documento Firestore con campos `userId`, `planId`, `planNombre`, `monto`, `referencia`, `estado`, `createdAt`.
- **Cliente**: Documento Firestore en colección `users` con campos de perfil, plan activo y sesiones.
- **Dark_Theme**: Tema visual oscuro con fondo `#0d1117`, tarjetas `#141b24`, bordes `#1e2a38` y acentos verde `#22c55e`.
- **Badge**: Etiqueta visual de color que indica el estado de un registro (confirmada, cancelada, pendiente_pago).
- **RouterLink**: Directiva Angular para navegación entre rutas sin recarga de página.

---

## Requirements

### Requirement 1: Tarjetas KPI con Métricas en Tiempo Real

**User Story:** Como administrador del gimnasio, quiero ver las métricas clave del negocio en tarjetas visuales modernas, para tomar decisiones rápidas y monitorear el estado del gimnasio en tiempo real.

#### Acceptance Criteria

1. THE AdminPage SHALL mostrar una sección de KPI_Cards con al menos seis métricas: clientes activos, reservas del día, ingresos del mes, pagos pendientes, planes próximos a vencer (≤ 7 días) y porcentaje de ocupación semanal.
2. WHEN los datos de Firestore cambian, THE KPI_Card SHALL actualizar su valor mostrado sin recargar la página completa, dentro de un máximo de 3 segundos tras el cambio en Firestore.
3. THE KPI_Card SHALL mostrar un ícono representativo, el valor numérico principal y una etiqueta descriptiva para cada métrica.
4. WHEN los datos del período anterior equivalente (mismo período del mes/semana anterior) están disponibles en Firestore, THE KPI_Card SHALL mostrar un indicador de tendencia (subida o bajada) junto al valor principal.
5. IF los datos del período anterior no están disponibles, THEN THE KPI_Card SHALL mostrar únicamente el valor actual sin indicador de tendencia, sin mostrar error ni espacio vacío.
6. THE KPI_Card SHALL aplicar colores semánticos según la métrica: verde para clientes activos y reservas del día (positivas), naranja para pagos pendientes y planes próximos a vencer (advertencia), y rojo para ocupación semanal superior al 90% (crítica).
7. WHEN el usuario mueve el cursor sobre una KPI_Card en escritorio, THE KPI_Card SHALL aplicar un efecto de elevación visual y una transición suave de 200ms.
8. IF los datos de Firestore no están disponibles al cargar la página, THEN THE KPI_Card SHALL mostrar un indicador de carga (skeleton loader) en lugar del valor; WHEN los datos estén disponibles, THE KPI_Card SHALL reemplazar el skeleton loader con el valor real.
9. THE AdminPage SHALL mostrar las KPI_Cards en una grilla de 3 columnas en escritorio (≥ 1024px), 2 columnas en tablet (≥ 768px) y 1 columna en móvil (< 768px).

---

### Requirement 2: Panel de Alertas Inteligentes

**User Story:** Como administrador, quiero ver un panel centralizado de alertas priorizadas, para atender urgencias del negocio sin tener que revisar cada módulo por separado.

#### Acceptance Criteria

1. THE Alert_Panel SHALL mostrar alertas agrupadas en tres categorías de urgencia visualizadas de arriba hacia abajo en orden: roja (urgente), amarilla (advertencia) y verde (informativa), con un ícono distinto por categoría.
2. WHEN existen pagos con `estado === 'pendiente'` en Firestore, THE Alert_Panel SHALL generar una alerta roja con el conteo exacto de pagos pendientes por validar.
3. WHEN existen clientes cuya `vigenciaFin` es menor o igual a la fecha actual más 7 días calendario (inclusive), THE Alert_Panel SHALL generar una alerta amarilla con el conteo de planes próximos a vencer.
4. WHEN todos los `cuposDisponibles` de un Horario para la fecha actual son iguales a 0, THE Alert_Panel SHALL generar una alerta verde indicando los horarios completamente reservados del día.
5. WHEN un cliente tiene más de 3 reservas con `estado === 'cancelada'` dentro de la ventana móvil de los últimos 30 días calculada desde el instante actual, THE Alert_Panel SHALL generar una alerta amarilla con el nombre del cliente y el conteo de cancelaciones.
6. THE Alert_Panel SHALL mostrar cada alerta con: ícono de categoría, descripción del problema y conteo de elementos afectados.
7. WHEN el administrador hace clic en el botón de acción de una alerta, THE Alert_Panel SHALL navegar usando RouterLink a: `/pagos` para alertas de pagos pendientes, `/admin/clientes` para alertas de planes y clientes, y `/horarios` para alertas de horarios.
8. IF no existen alertas activas en ninguna categoría, THEN THE Alert_Panel SHALL mostrar el mensaje "Todo en orden" con ícono verde.
9. THE Alert_Panel SHALL reflejar cambios en los datos de Firestore dentro de un máximo de 5 segundos sin requerir interacción del usuario.
10. IF Firestore no está disponible al cargar el Alert_Panel, THEN THE Alert_Panel SHALL mostrar un mensaje de error indicando que no se pudieron cargar las alertas y SHALL preservar las últimas alertas cargadas exitosamente si las hay.

---

### Requirement 3: Gráficos de Ocupación y Reservas

**User Story:** Como administrador, quiero visualizar gráficos de ocupación semanal y evolución de reservas, para identificar tendencias y planificar la capacidad del gimnasio.

#### Acceptance Criteria

1. WHEN el AdminPage carga, THE Chart_Component SHALL mostrar un gráfico de barras verticales donde cada barra representa un horario del día actual con su porcentaje de ocupación calculado como ((cupos - cuposDisponibles) / cupos × 100), redondeado a entero, en escala 0–100%.
2. WHEN el AdminPage carga, THE Chart_Component SHALL mostrar un gráfico de líneas con la cantidad de reservas por cada uno de los últimos 7 días calendario (incluyendo hoy), donde los días sin reservas se representan con valor 0.
3. WHEN el AdminPage carga, THE Chart_Component SHALL mostrar un gráfico de barras horizontales con los 5 horarios de mayor demanda, ordenados por mayor porcentaje de ocupación promedio calculado con la misma fórmula del criterio 1 sobre todos los días registrados.
4. WHEN los datos de Firestore se actualizan, THE Chart_Component SHALL re-renderizar el gráfico afectado dentro de 3 segundos con los nuevos valores, sin recargar la página.
5. THE Chart_Component SHALL aplicar los colores del Dark_Theme: fondo #141b24, líneas de grilla #1e2a38, barras en verde #22c55e, texto en #94a3b8.
6. THE Chart_Component SHALL ajustar su ancho al 100% del contenedor padre en todos los breakpoints: móvil (< 768px), tablet (768px–1024px) y escritorio (> 1024px), sin desbordamiento horizontal.
7. IF un gráfico tiene menos de 2 puntos de datos, THEN THE Chart_Component SHALL reemplazar ese gráfico con un mensaje que indique el nombre del gráfico y la razón por la que no hay datos suficientes.
8. IF Firestore no está disponible al cargar un gráfico, THEN THE Chart_Component SHALL mostrar un mensaje de error por gráfico afectado y SHALL preservar los datos del último renderizado exitoso si los hay.

---

### Requirement 4: Vista de Calendario de Reservas

**User Story:** Como administrador, quiero ver un calendario con las reservas del día y la semana, para gestionar la ocupación y detectar horarios críticos de forma visual.

#### Acceptance Criteria

1. THE Calendar_View SHALL mostrar por defecto la fecha del día actual con todos los Horarios de ese día obtenidos desde Firestore, clasificados como: libre (0% ocupación), parcial (> 0% y ≤ 75% ocupación) o lleno (100% ocupación).
2. WHEN el administrador hace clic en el botón de navegación al día siguiente o anterior, THE Calendar_View SHALL cargar los Horarios de la nueva fecha desde Firestore y actualizar la vista sin recargar la página.
3. THE Calendar_View SHALL mostrar para cada bloque horario: hora de inicio, cupos totales, cupos disponibles, porcentaje de ocupación calculado como floor((cupos - cuposDisponibles) / cupos × 100) y lista de nombres de clientes con reserva confirmada.
4. WHEN un bloque horario tiene `cuposDisponibles === 0`, THE Calendar_View SHALL resaltar ese bloque con borde rojo y badge "Lleno".
5. WHEN un bloque horario tiene `cuposDisponibles > 0` y ocupación calculada superior al 75%, THE Calendar_View SHALL mostrar ese bloque con borde naranja y badge "Casi lleno".
6. THE Calendar_View SHALL mostrar la fecha del día actual con etiqueta en negrita y subrayado cuando sea el día seleccionado.
7. THE Calendar_View SHALL mostrar una lista de bloques en orden cronológico en viewport < 768px y una grilla en viewport ≥ 768px, sin scroll horizontal en ningún breakpoint.
8. WHEN el Calendar_View comienza la carga de datos de Firestore para una fecha, THE Calendar_View SHALL mostrar un indicador de carga hasta que los datos estén disponibles.
9. IF Firestore no está disponible al cargar una fecha, THEN THE Calendar_View SHALL mostrar un mensaje de error indicando que no se pudieron cargar los horarios para esa fecha.

---

### Requirement 5: Tabla Rediseñada de Últimas Reservas

**User Story:** Como administrador, quiero ver las últimas reservas en una tabla moderna con badges de estado y acciones disponibles, para gestionar reservas sin navegar a otro módulo.

#### Acceptance Criteria

1. THE Reservas_Table SHALL mostrar las últimas 50 reservas ordenadas por `createdAt` descendente obtenidas desde Firestore; WHEN Firestore emite un cambio, THE Reservas_Table SHALL reflejar el nuevo estado dentro de 3 segundos sin recargar la página.
2. THE Reservas_Table SHALL incluir las columnas: Cliente, Fecha, Hora, Estado de Reserva, Estado de Asistencia, Estado de Pago, Plan Asociado y Acciones.
3. THE Reservas_Table SHALL mostrar el estado de cada reserva con un Badge de color: verde para `confirmada`, naranja para `pendiente_pago` y rojo para `cancelada`; IF el valor de `estado` no corresponde a ninguno de estos tres valores, THEN THE Badge SHALL mostrar el valor literal en color gris.
4. WHEN el administrador hace clic en "Confirmar Asistencia" en una fila, THE Reservas_Table SHALL deshabilitar ese botón inmediatamente, llamar al método `confirmarAsistencia` del GymService y reflejar el cambio de estado en la fila sin recargar la página; IF la llamada falla, THE Reservas_Table SHALL re-habilitar el botón y mostrar el mensaje de error devuelto por GymService.
5. WHEN el administrador hace clic en "Cancelar Reserva" en una fila, THE Reservas_Table SHALL mostrar un diálogo de confirmación con el nombre del cliente y los datos de la reserva; WHEN el administrador confirma en el diálogo, THE Reservas_Table SHALL ejecutar el método `cancelarReserva` del GymService; IF el administrador cancela el diálogo, THE Reservas_Table SHALL cerrar el diálogo sin ejecutar ninguna acción.
6. THE Reservas_Table SHALL mostrar el estado del pago como Badge adicional (verde para `validado`, naranja para `pendiente`) cuando el campo `estadoPago` esté disponible en el documento de Firestore; IF el campo no existe, THE Badge de pago no SHALL mostrarse.
7. THE Reservas_Table SHALL ser horizontalmente scrollable en viewport < 768px, manteniendo todas las columnas visibles sin truncamiento.
8. IF la colección de reservas está vacía o no devuelve resultados, THEN THE Reservas_Table SHALL mostrar un ícono y el mensaje "No hay reservas para mostrar" en lugar de la tabla.

---

### Requirement 6: Panel de Pagos Recientes

**User Story:** Como administrador, quiero ver los últimos pagos registrados con su estado de validación, para hacer seguimiento rápido sin ingresar al módulo de pagos.

#### Acceptance Criteria

1. THE Pagos_Panel SHALL mostrar los últimos 10 pagos de Firestore ordenados por `createdAt` descendente, con los campos: nombre del cliente, nombre del plan, monto, estado y fecha de creación.
2. IF el pago tiene `estado === 'validado'`, THEN THE Pagos_Panel SHALL mostrar ese pago con un Badge verde con la etiqueta "Validado".
3. IF el pago tiene `estado === 'pendiente'`, THEN THE Pagos_Panel SHALL mostrar ese pago con un Badge naranja con la etiqueta "Pendiente".
4. IF el pago tiene `estado === 'cancelado'`, THEN THE Pagos_Panel SHALL mostrar ese pago con un Badge rojo con la etiqueta "Cancelado".
5. WHEN el administrador hace clic en "Ver todos los pagos", THE Pagos_Panel SHALL navegar a la ruta `/pagos` usando RouterLink sin recargar la página.
6. THE Pagos_Panel SHALL mostrar el monto con el símbolo "$" antepuesto y separador de miles (formato: $1.234.567).
7. IF no existen pagos en Firestore, THEN THE Pagos_Panel SHALL mostrar el mensaje "No hay pagos recientes para mostrar".
8. IF Firestore no está disponible al cargar el panel, THEN THE Pagos_Panel SHALL mostrar un mensaje de error visible y no SHALL mostrar datos parciales sin indicación de error.

---

### Requirement 7: Panel de Planes Próximos a Vencer

**User Story:** Como administrador, quiero ver qué clientes tienen planes por vencer pronto, para contactarlos y fomentar la renovación.

#### Acceptance Criteria

1. THE Planes_Panel SHALL mostrar clientes cuya `vigenciaFin` es mayor o igual al inicio del día actual y menor o igual al inicio del día actual más 7 días calendario (inclusive), obtenidos desde la colección `users` de Firestore, con un máximo de 200 registros evaluados.
2. THE Planes_Panel SHALL mostrar para cada cliente: nombre completo, nombre del plan activo, fecha de vencimiento y días restantes calculados como la diferencia entera en días completos entre el inicio del día actual y `vigenciaFin`; IF un cliente tiene múltiples planes activos, SHALL mostrarse el plan con la `vigenciaFin` más próxima; los registros SHALL ordenarse de forma ascendente por días restantes.
3. WHEN los días restantes son 0, THE Planes_Panel SHALL mostrar ese cliente con indicador visual de urgencia alta y badge "Vence hoy".
4. WHEN los días restantes son 1, THE Planes_Panel SHALL mostrar ese cliente con indicador visual de urgencia alta y badge "Vence mañana".
5. WHEN los días restantes están entre 2 y 7, THE Planes_Panel SHALL mostrar ese cliente con indicador visual de advertencia y badge "X días" donde X es el número exacto de días restantes.
6. IF no existen clientes con planes por vencer en el rango definido, THEN THE Planes_Panel SHALL mostrar un mensaje informando que no hay planes por vencer en los próximos 7 días.
7. IF Firestore no está disponible al cargar el panel, THEN THE Planes_Panel SHALL mostrar un mensaje de error con una acción de reintento visible.

---

### Requirement 8: Panel de Clientes Inactivos

**User Story:** Como administrador, quiero identificar clientes que no asisten hace más de 15 días, para tomar acciones de retención.

#### Acceptance Criteria

1. WHEN el administrador accede al AdminPage, THE Clientes_Inactivos_Panel SHALL mostrar clientes cuyo campo `planActivo` es no-nulo y no-vacío, y cuya última reserva con `estado === 'confirmada'` tiene una fecha de creación (`createdAt`) con más de 15 días de antigüedad respecto a la fecha actual; los clientes sin ninguna reserva registrada SHALL incluirse si su plan está activo, usando la fecha de inicio del plan como referencia.
2. WHEN el administrador accede al AdminPage, THE Clientes_Inactivos_Panel SHALL mostrar para cada cliente inactivo: nombre completo, nombre del plan activo, días de inactividad calculados como diferencia entera en días completos entre `createdAt` de la última reserva confirmada (o fecha de inicio del plan) y la fecha actual, y fecha de la última sesión registrada; IF el cliente no tiene reservas, THE panel SHALL mostrar "Sin sesiones registradas" en el campo de última sesión.
3. THE Clientes_Inactivos_Panel SHALL limitar la lista a los 10 clientes con mayor número de días de inactividad, ordenados de forma descendente por días de inactividad.
4. IF no existen clientes inactivos según el criterio definido, THEN THE Clientes_Inactivos_Panel SHALL mostrar el mensaje "Todos los clientes están activos".
5. IF Firestore no está disponible al cargar el panel, THEN THE Clientes_Inactivos_Panel SHALL mostrar un mensaje de error visible y no SHALL mostrar datos parciales sin indicación de fallo.

---

### Requirement 9: Panel de Horarios Más Demandados

**User Story:** Como administrador, quiero ver qué horarios tienen mayor demanda, para optimizar la oferta de clases y detectar necesidades de expansión.

#### Acceptance Criteria

1. THE Horarios_Panel SHALL calcular y mostrar los 5 horarios con mayor porcentaje de ocupación promedio, donde el porcentaje se calcula por bloque horario como ((cupos - cuposDisponibles) / cupos × 100) promediado sobre todos los días registrados en Firestore para ese bloque.
2. THE Horarios_Panel SHALL mostrar para cada horario: hora del bloque en formato HH:MM, porcentaje de ocupación promedio redondeado a entero y una barra de progreso visual en escala 0–100%.
3. IF el porcentaje de ocupación promedio de un horario es mayor al 85%, THEN THE Horarios_Panel SHALL mostrar ese horario con indicador visual de alta demanda y badge "Alta demanda".
4. IF el porcentaje de ocupación promedio de un horario está entre 50% y 85% (inclusive), THEN THE Horarios_Panel SHALL mostrar ese horario con indicador visual de demanda media y badge "Demanda media".
5. IF el porcentaje de ocupación promedio de un horario es menor al 50%, THEN THE Horarios_Panel SHALL mostrar ese horario con indicador visual neutro y badge "Baja demanda".
6. THE Horarios_Panel SHALL reflejar cambios en los datos de Firestore dentro de un máximo de 5 segundos sin recargar la página.
7. IF no existen datos de horarios en Firestore, THEN THE Horarios_Panel SHALL mostrar el mensaje "No hay datos de horarios disponibles" en lugar del ranking.

---

### Requirement 10: Acciones Rápidas Completamente Funcionales

**User Story:** Como administrador, quiero ejecutar acciones frecuentes desde el dashboard sin navegar a otros módulos, para agilizar la gestión diaria del gimnasio.

#### Acceptance Criteria

1. THE Quick_Actions SHALL mostrar una cuadrícula de acciones con íconos de Ionicons, etiquetas descriptivas y estados visuales de habilitado/deshabilitado diferenciables por contraste (relación mínima WCAG 2.1 AA: 4.5:1).
2. WHEN el administrador hace clic en "Generar Horarios (30 días)", THE Quick_Actions SHALL deshabilitar el botón inmediatamente, ejecutar el método `generarHorariosProximos30Dias` del GymService y mostrar un indicador de carga durante la ejecución.
3. WHEN `generarHorariosProximos30Dias` completa exitosamente, THE Quick_Actions SHALL mostrar una notificación de éxito con descripción del resultado y re-habilitar el botón.
4. WHEN `generarHorariosProximos30Dias` falla, THE Quick_Actions SHALL mostrar el mensaje de error devuelto por GymService y re-habilitar el botón.
5. WHEN el administrador hace clic en "Gestionar Usuarios", THE Quick_Actions SHALL navegar a la ruta `/admin/usuarios` usando RouterLink.
6. WHEN el administrador hace clic en "Gestionar Clientes", THE Quick_Actions SHALL navegar a la ruta `/admin/clientes` usando RouterLink.
7. WHEN el administrador hace clic en "Validar Pagos", THE Quick_Actions SHALL navegar a la ruta `/pagos` usando RouterLink.
8. WHEN el administrador hace clic en "Gestionar Horarios", THE Quick_Actions SHALL navegar a la ruta `/horarios` usando RouterLink.
9. WHEN el administrador hace clic en "Ver Reportes", THE Quick_Actions SHALL navegar a la ruta `/admin/reportes` usando RouterLink.
10. WHEN el administrador hace clic en "Gestionar Planes", THE Quick_Actions SHALL navegar a la ruta `/planes` usando RouterLink.

---

### Requirement 11: Diseño Visual Dark Mode y Responsivo

**User Story:** Como administrador, quiero que el dashboard tenga un diseño oscuro moderno y se adapte a todos los dispositivos, para usarlo tanto en escritorio como en tablet o móvil.

#### Acceptance Criteria

1. THE AdminPage SHALL aplicar el Dark_Theme existente del proyecto: fondo `#0d1117`, tarjetas `#141b24`, bordes `#1e2a38`, texto principal `#e2e8f0`, texto secundario `#94a3b8` y acento verde `#22c55e` en todos los componentes del dashboard.
2. THE AdminPage SHALL aplicar la tipografía Inter para todos los textos del dashboard.
3. THE AdminPage SHALL aplicar bordes redondeados de al menos 12px en todas las tarjetas y paneles del dashboard.
4. WHEN el AdminPage termina de cargar, THE AdminPage SHALL mostrar las tarjetas con una transición desde estado no visible y posición desplazada 16px hacia abajo hasta opacidad completa y posición final, con duración de 300ms.
5. THE AdminPage SHALL ser completamente responsive con breakpoints en: móvil (< 768px), tablet (768px–1023px) y escritorio (≥ 1024px), sin scroll horizontal en ningún breakpoint.
6. THE AdminPage SHALL mantener un ancho máximo de contenido de 1400px centrado en pantallas grandes.
7. WHILE el ancho de pantalla es menor a 768px, THE AdminPage SHALL reorganizar las grillas de KPI_Cards a 2 columnas, y las grillas de tablas de datos y paneles de gráficos a 1 columna.
8. THE AdminPage SHALL mantener compatibilidad con el sistema de routing y lazy-loading existente sin modificar la configuración de rutas.
9. WHILE el viewport es menor a 768px, THE AdminPage SHALL mostrar todo el contenido del dashboard sin truncamiento ni desbordamiento horizontal.

---

### Requirement 12: Actualización Reactiva sin Recarga de Página

**User Story:** Como administrador, quiero que todos los datos del dashboard se actualicen automáticamente cuando cambian en Firebase, para mantener una vista en tiempo real del negocio.

#### Acceptance Criteria

1. THE AdminPage SHALL suscribirse a Observables para todos los datos obtenidos de Firestore y SHALL reflejar cambios en Firestore dentro de un máximo de 3 segundos sin recargar la página.
2. THE AdminPage SHALL cancelar todas las suscripciones activas cuando el componente se destruye, para prevenir memory leaks.
3. WHEN una acción (confirmar asistencia, cancelar reserva, generar horarios) se ejecuta exitosamente, THE AdminPage SHALL mostrar una notificación con el resultado de la operación que se descarte automáticamente tras 5 segundos, sin recargar la página.
4. WHEN una acción falla, THE AdminPage SHALL mostrar el mensaje de error específico devuelto por el GymService en una notificación descartable por el usuario, con un máximo de 10 segundos antes del auto-descarte.
5. THE AdminPage SHALL reutilizar los métodos existentes del GymService (`confirmarAsistencia`, `cancelarReserva`, `generarHorariosProximos30Dias`, `getPagosPendientes`, `getReservasRecientes`, `getHorarios`, `getReservasPorFecha`) sin duplicar lógica de negocio.
