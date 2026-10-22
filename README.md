# ⚔️ Survival RPG: Mundo Abierto 2D

Un videojuego 2D completo de supervivencia y RPG en mundo abierto para navegador desarrollado con **HTML5 Canvas**, **CSS3** y **JavaScript moderno (ES Modules)**, con síntesis procedural de audio mediante **Web Audio API**.

---

## 🎮 Características del Juego

1. **Mundo Abierto Extenso (120x120 tiles / 3840x3840 px)**:
   - **Pradera**: Punto de partida pacífico con recursos básicos y caminos transitables.
   - **Bosque Ancestral**: Arboleda densa con madera abundante, manzanos, bayas y lobos salvajes.
   - **Montañas Rocosas**: Terreno escarpado con canteras de piedra y vetas de hierro y oro.
   - **Lago Cristalino**: Fuente de agua pura para saciar la sed.
   - **Aldea Esperanza**: Asentamiento civilizado con NPCs interactivos (Anciano, Comerciante, Herrero, Curandera) y pozo de agua.
   - **Zona Peligrosa**: Tierras sombrías infestadas de zombis, bandidos y la guarida del Jefe.
   - **Cámara Dinámica**: Sigue suavemente al jugador con viewport culling para máximo rendimiento a 60 FPS.

2. **Sistema de Supervivencia Realista**:
   - **Vida**: Disminuye al recibir daño o por inanición/deshidratación prolongada.
   - **Hambre & Sed**: Caen progresivamente con el tiempo y más rápido al esprintar.
   - **Energía**: Se gasta al correr o atacar; se recarga al caminar o descansar.
   - **Alimentos y Bebidas**: Manzanas, carne cruda, carne asada, bayas y agua embotellada.

3. **Sistema RPG y Progresión**:
   - Puntos de Experiencia (XP) obtenidos por talar, minar, derrotar monstruos y misiones.
   - Al subir de nivel aumenta la vida máxima, el daño base, la defensa y se regenera la salud con fanfarria y partículas doradas.

4. **Combate en Tiempo Real**:
   - Ataque direccional con animación de arco de espada y partículas de impacto.
   - Sistema de daño, defensa de armadura, impactos críticos y números de combate flotantes (*Floating Combat Text*).
   - Retroceso (*knockback*) y barras de vida sobre los enemigos.

5. **Enemigos y Jefe Épico**:
   - **Lobo Salvaje**: Rápido, merodea el bosque, suelta carne y pieles.
   - **Zombi Errante**: Resistente, aparece en las tierras malditas y durante la noche.
   - **Bandido Furtivo**: Ágil y armado con dagas, suelta botín de monedas y pociones.
   - **Espíritu del Bosque**: Guardián menor de corteza y madera ancestral.
   - **Jefe: "Guardián del Bosque"**: Colosal golem arbóreo con 320 HP, barra de vida de jefe en pantalla, ataque sísmico de raíces en área, invocación de esbirros a mitad de vida y modo furia (*enrage*). Su derrota otorga la legendaria *Espada Silvana* y la *Corona del Bosque*.

6. **Sistema de Fabricación (Crafting) y Construcción**:
   - Fabricación dividida en Herramientas, Armas, Supervivencia, Construcción y Medicina/Comida.
   - Colocación de estructuras en el mundo: Fogata (calienta, ilumina y asa carne), Muros de madera, Cofres y Camas para dormir.

7. **Ciclo Día y Noche Dinámico**:
   - Reloj de 24 horas y transición gradual de luz.
   - Iluminación dinámica con halos de luz alrededor del jugador (antorcha), fogatas y farolas de la aldea.
   - Mayor dificultad y aparición de zombis durante la noche.

8. **Aldea y NPCs**:
   - **Anciano Eldrin**: Sabio del pueblo que ofrece consejos y guía en las misiones.
   - **Boran el Comerciante**: Tienda completa para comprar provisiones o vender materiales por monedas de oro.
   - **Thorgar el Herrero**: Forja armas de hierro y armaduras de placas.
   - **Lyra la Curandera**: Cura las heridas del jugador por 15 monedas y vende elixires medicinales.

9. **Sistema de Misiones (Quests)**:
   - Diario de misiones con objetivos en tiempo real, seguimiento en el HUD y recompensas automáticas de XP, oro e ítems.

10. **Guardado en LocalStorage**:
    - Guarda posición, nivel, atributos, inventario, equipo, misiones, estructuras construidas y ciclo horario.

11. **Efectos y Audio Procedural (Web Audio API)**:
    - Sonidos sintetizados dinámicamente en tiempo real (ataques, golpes, tala, minado, crafteo, consumo, fanfarria de nivel y música ambiental relajante).

---

## ⌨️ Controles

| Tecla / Acción | Función |
| :--- | :--- |
| **W, A, S, D** o **Flechas** | Mover al personaje |
| **Shift** | Correr / Esprintar (consume energía) |
| **Espacio** o **Clic Izquierdo** | Atacar / Golpear recursos / Colocar estructura |
| **E** | Interactuar (talar, picar, recoger, hablar con NPC, usar pozo/fogata) |
| **I** | Abrir / Cerrar Inventario y Equipo |
| **C** | Abrir / Cerrar Taller de Fabricación (Crafting) |
| **Q** | Abrir / Cerrar Diario de Misiones |
| **M** | Abrir / Cerrar Mapa General de la Región |
| **1 al 6** | Seleccionar y usar accesos directos de la barra rápida (*Hotbar*) |
| **ESC** | Pausar juego o cerrar menús activos |

---

## 📁 Estructura del Proyecto

```
mi-videojuego/
│
├── index.html               # Estructura principal, canvas y overlays del HUD/modales
├── package.json             # Scripts de ejecución (Vite) y configuración
├── README.md                # Documentación del proyecto
│
├── styles/
│   └── style.css            # Estilos modernos Glassmorphism, interfaz oscura y animaciones
│
├── src/
│   ├── main.js              # Punto de entrada y redimensionado del canvas
│   ├── game.js              # Motor principal, ciclo de juego, cámara y eventos
│   │
│   ├── audio/
│   │   └── SoundManager.js  # Síntesis procedural de sonido (Web Audio API)
│   │
│   ├── entities/
│   │   ├── Player.js        # Jugador, atributos, niveles, animaciones y combate
│   │   ├── Enemy.js         # IA de enemigos (Lobo, Zombi, Bandido, Monstruo)
│   │   ├── Boss.js          # Jefe "Guardián del Bosque" con ataques especiales
│   │   └── NPC.js           # Habitantes de la aldea (Comerciante, Herrero, Anciano, Médica)
│   │
│   ├── systems/
│   │   ├── Inventory.js     # Base de datos de ítems, mochila y equipo
│   │   ├── Crafting.js      # Catálogo de recetas y verificación de materiales
│   │   ├── Combat.js        # Detección de impacto, daño, críticos y drops
│   │   ├── Survival.js      # Decaimiento de hambre, sed, energía y regeneración
│   │   ├── QuestSystem.js   # Sistema de misiones progresivas y recompensas
│   │   ├── SaveSystem.js    # Guardado y carga con localStorage
│   │   ├── DayNight.js      # Ciclo día/noche y sistema de iluminación dinámica
│   │   ├── BuildingSystem.js# Construcción de fogatas, cofres, camas y muros
│   │   └── ParticleSystem.js# Partículas visuales y textos flotantes de daño
│   │
│   ├── world/
│   │   ├── Map.js           # Generación de cuadrícula, renderizado de tiles y colisiones
│   │   ├── Resources.js     # Nodos de recursos (árboles, rocas, vetas, agua) y drops
│   │   └── WorldGenerator.js# Creación procedural y distribución de biomas
│   │
│   └── ui/
│       ├── HUD.js           # Barras de estado, minimapa, hotbar y notificaciones
│       ├── InventoryUI.js   # Ventana visual del inventario y equipamiento
│       ├── CraftingUI.js    # Menú de recetas por categorías
│       ├── QuestUI.js       # Diario de misiones
│       ├── DialogueUI.js    # Cuadros de conversación con NPCs y tienda de compra/venta
│       ├── MapUI.js         # Mapa regional con leyenda de biomas
│       └── Menu.js          # Menú principal, pantalla de pausa y game over
```

---

## 🚀 Cómo Ejecutar el Proyecto

Puedes ejecutar el juego de cualquiera de estas tres formas:

### Opción 1: Con Node.js / Vite (Recomendada para desarrollo)
1. Abre la carpeta del proyecto en una terminal o en Visual Studio Code.
2. Ejecuta:
   ```bash
   npm run dev
   ```
3. Abre el enlace local mostrado en la terminal (usualmente `http://localhost:5173/`).

### Opción 2: Con XAMPP Apache
1. Asegúrate de tener la carpeta en `C:\xampp\htdocs\mi-videojuego`.
2. Inicia el módulo **Apache** desde el panel de control de XAMPP.
3. Abre tu navegador y navega a:
   ```
   http://localhost/mi-videojuego/
   ```

### Opción 3: Con la extensión Live Server de Visual Studio Code
1. Abre la carpeta `mi-videojuego` en **Visual Studio Code**.
2. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Canvas 2D**: Renderizado optimizado a 60 FPS con viewport culling.
- **CSS3 Moderno**: Efectos Glassmorphism, degradados, animaciones y diseño responsivo.
- **JavaScript ES6+ (Native Modules)**: Código limpio, modular, orientado a objetos y sin dependencias pesadas.
- **Web Audio API**: Síntesis procedural pura de sonido (sin necesidad de descargar archivos externos de audio).
