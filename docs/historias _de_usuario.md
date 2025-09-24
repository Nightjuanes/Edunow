
Historia 1: Registro de cuenta con correo.
Como visitante, 
quiero crear mi cuenta con email y contraseña para aaceder a mi progreso desde cualquier dispositivo.

Criterios de aceptación

*   Given que ingreso email y contraseña validos, 
    When presiono "Crear cuenta", 
    Then el sistema crea la cuenta y retorna un "Bienvenido".

*   Given email ya registrado, 
    When intento crear la cuenta, 
    Then veo el mensaje "El email ya está en uso".

*   Given que el registro fue exitoso, 
    When se crea el usuario, 
    Then se envia un mensaje de verificación al correo.



Historia 2: Inicio de sesión offline con PIN
Como estudiante, 
quiero iniciar sesión sin conexión a internet usando un PIN local, 
para continuar aprendiendo sin internet.

Criterios de aceptación

*   Given que ya inicie sesión online por lo menos una vez, 
    When activo "Ingreso sin conexión" y defino un PIN,
    Then la app guarda credenciales cigradas para uso sin internet.

*   Given que no hay conexión, 
    When ingreso PIN correcto, 
    Then puedo acceder a mis cursos descargados.

*   Given 5 intentos fallidos, 
    When se excede el limite, 
    Then la app bloquea el acceso hasta que se inice sesión con conexción a internet.


Historia 3: Descarga de plantillas para usar la app sin conexión
Como estudiante, 
Quiero descargar plantillas interactivas por asginatura, 
para usarlas sin conexión.

Criterior de aceptación

*   Given que selecciono una plantilla, 
    When oprimo "Descargar este curso",
    Then la app muestra progreso y guarda el contenido en local.

*   Given almacenamiento insuficiente, 
    When intento descargar, 
    Then recibo "Espacio insuficiente, libere espacio y vuelvalo a intentar"

    