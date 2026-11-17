# Demostración web · Field Service

Esta carpeta es un paquete independiente para publicar una **vista pública de demostración, de solo lectura**. La búsqueda, los filtros por Field Service y la navegación del calendario funcionan. Usa la lista real de obras, constructoras, contratos, Field Service y calendario para que el equipo pueda apreciar la app con sus datos. La página queda en modo de solo lectura: no permite cambiar visitas ni crear solicitudes. El archivo de datos incluido es una copia llamada `preview-data.json`, independiente del archivo operativo `data.json`.

## Publicar en Render

1. Sube únicamente el contenido de esta carpeta a un repositorio nuevo de GitHub.
2. En Render, crea un **Blueprint** conectado a ese repositorio.
3. Render leerá `render.yaml` y publicará la demo en una URL `onrender.com` con HTTPS.
4. Comparte esa URL para que otros puedan revisar la interfaz.

La URL será pública para cualquier persona que la reciba; no requerirá iniciar sesión. Mostrará los nombres de obras y Field Service, constructoras, números de contrato, comunas y las fechas del calendario. El acceso será solo lectura y las solicitudes estarán deshabilitadas. La página pide a buscadores que no la indexen, pero eso no impide que alguien con el enlace la abra.

La configuración usa el plan gratuito porque este paquete no guarda cambios. En ese plan Render puede suspender la página si no recibe visitas y tardar cerca de un minuto en volver a responder. Para una app operativa compartida se requiere almacenamiento persistente y control de acceso por usuario.

## Ejecutar localmente

Requiere Node.js 18 o superior:

```powershell
$env:PREVIEW_MODE = 'true'
$env:DATA_FILE = 'preview-data.json'
$env:PORT = '4174'
node server.js
```

Luego abre `http://localhost:4174`.
