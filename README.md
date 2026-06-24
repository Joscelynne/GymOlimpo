# GymOlimpo 
GymOlympo es una plataforma integral de gestión para gimnasios, diseñada para optimizar tanto la experiencia de los clientes al agendar y pagar sus entrenamientos, como la administración diaria del centro deportivo por parte de los administradores y entrenadores.
GymOlympo fue desarrollado gracias a reuniones con un gimnasio real que facilitó el desarrollo junto su problematica.
---

## Descripción del Proyecto

La aplicación GymOlimpo permite digitalizar los procesos operativos de un gimnasio. Se divide en dos perfiles de acceso claramente definidos mediante control de roles:

### Portal del Cliente
* **Registro y Autenticación:** Registro seguro mediante correo/contraseña o integración con Google Auth, incluyendo validación de RUT chileno y teléfono.
* **Gestión de Membresías y Planes:** Visualización de planes disponibles (clases presenciales y asesorías online), proceso de compra integrado con términos de servicio y simulación interactiva de pasarela de pago (tarjeta de crédito).
* **Reservas de Clases:** Agenda en tiempo real de cupos en bloques de horarios específicos, validando la vigencia del plan y sesiones disponibles.
* **Cancelaciones transparentes:** Permite cancelar reservas liberando el cupo del bloque horario, de acuerdo con las políticas internas del gimnasio.
* **Perfil de Usuario:** Actualización de datos personales y credenciales de acceso de manera directa.

### Panel de Administración y Dashboard
* **Métricas en Tiempo Real:** KPI interactivos sobre total de reservas del día, cantidad de pagos pendientes, clientes con membresías activas y reportes financieros.
* **Gráficos Estadísticos:** Visualización de ocupación por horas y reservas semanales para la toma de decisiones.
* **Alertas del Sistema:** Panel inteligente para detectar planes prontos a expirar, inactividad de clientes y pagos pendientes antiguos.
* **Control de Asistencia:** Confirmación física de asistencia de los alumnos (Check-in) y cancelación de reservas.
* **Gestión de Planes:** Creación, personalización y eliminación de planes directamente reflejados en el portal del cliente.
* **Generación de Horarios:** Automatización del calendario mensual con bloques horarios configurados por defecto en un solo clic.

---

## Tecnologías Utilizadas

La solución está construida sobre una arquitectura moderna basada en componentes y tecnologías Cloud:

* **Frontend Framework:** [Angular 17](https://angular.io/) + [Ionic Framework 7](https://ionicframework.com/) para una interfaz híbrida, fluida y adaptativa (web y móvil).
* **Base de Datos y Backend:** [Firebase](https://firebase.google.com/) como plataforma de backend as a service (BaaS):
  * **Firebase Authentication:** Registro e inicio de sesión seguro (Email/Contraseña y Google).
  * **Cloud Firestore:** Base de datos NoSQL para almacenamiento en tiempo real de usuarios, pagos, reservas, planes y horarios.
  * **Firestore Security Rules:** Reglas de seguridad para control de lectura y escritura según el rol del usuario.
  * **Firebase Cloud Functions:** Lógica del lado del servidor para tareas automáticas.
* **Gestión del Estado y Reactividad:** [RxJS](https://rxjs.dev/) para el manejo de streams de datos asíncronos y reactivos en tiempo real.
* **Estilos:** Vanilla CSS y SCSS con el sistema de diseño nativo de Ionic.

---

## Estructura del Repositorio

El proyecto se encuentra organizado en las siguientes carpetas principales:

```bash
GymOlimpo/
├── Documentación/       # Manuales, requerimientos y casos de prueba detallados
│   ├── Casos_de_Prueba.md
│   ├── Informe_GYM OLIMPO.docx
│   └── Requerimientos GymOlimpo.xlsx
├── Gestión/             # Documentos administrativos y definición del proyecto
│   ├── 1.1.2 Documento de registro de definición e identificación del proyecto.docx
│   └── Integrantes.txt
└── Producto/            # Código fuente de la aplicación Angular/Ionic
    ├── src/             # Código de la app (components, services, guards, pages)
    ├── functions/       # Cloud Functions de Firebase para futura implementacion
    ├── angular.json
    ├── ionic.config.json
    ├── package.json
    └── firestore.rules  # Reglas de acceso a base de datos
```

---

## Estructura del Equipo

El desarrollo del proyecto GymOlimpo está conformado por los siguientes integrantes:

* **Abraham González** —  Lider / Desarrollador fullstack
* **Joscelynne Díaz** —  Desarrollador fullstack / Documentación / Análisis
* **Marcelo Mancilla** — Desarrollador fullstack / Documentación 
* **Joaquín Medina** — Desarrollador

---

##  Instalación y Ejecución Local

Para levantar el proyecto en un entorno de desarrollo local, sigue los siguientes pasos:

### Prerrequisitos
* Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
* Instalar la interfaz de comandos de Ionic globalmente:
  ```bash
  npm install -g @ionic/cli
  ```

### Pasos de Lanzamiento
1. Navega al directorio del producto:
   ```bash
   cd Producto
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo local:
   ```bash
   ionic serve
   ```
4. Abre la dirección `http://localhost:8100` en tu navegador web.
