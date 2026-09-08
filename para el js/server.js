const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ==========================
// CONFIGURACIÓN
// ==========================

app.use(express.json());

// Servir la carpeta public
app.use(express.static(path.join(__dirname, "../public")));

// Archivo de reservas
const archivoReservas = path.join(__dirname, "reservas.json");

// Crear reservas.json si no existe
if (!fs.existsSync(archivoReservas)) {
    fs.writeFileSync(archivoReservas, "[]");
}


// ==========================
// FUNCIONES
// ==========================

function obtenerReservas() {
    try {
        return JSON.parse(
            fs.readFileSync(archivoReservas, "utf8")
        );
    } catch (error) {
        return [];
    }
}

function guardarReservas(reservas) {
    fs.writeFileSync(
        archivoReservas,
        JSON.stringify(reservas, null, 2)
    );
}


// ==========================
// CREAR RESERVA
// ==========================

app.post("/reservar", (req, res) => {

    const {
        nombre,
        telefono,
        fecha,
        hora,
        personas,
        comentarios
    } = req.body;


    // Comprobar campos obligatorios

    if (
        !nombre ||
        !telefono ||
        !fecha ||
        !hora ||
        !personas
    ) {
        return res.status(400).json({
            ok: false,
            error: "Faltan datos obligatorios."
        });
    }


    // ==========================
    // COMPROBAR FECHA Y HORA
    // ==========================

    const ahora = new Date();

    const fechaHoraReserva =
        new Date(`${fecha}T${hora}:00`);

    if (isNaN(fechaHoraReserva.getTime())) {

        return res.status(400).json({
            ok: false,
            error: "La fecha o la hora no son válidas."
        });

    }


    if (fechaHoraReserva <= ahora) {

        return res.status(400).json({
            ok: false,
            error: "No puedes reservar una fecha u hora que ya ha pasado."
        });

    }


    // ==========================
    // GENERAR ID
    // ==========================

    let id;

    const reservasExistentes = obtenerReservas();

    do {

        id = Math.floor(
            1000 + Math.random() * 9000
        );

    } while (
        reservasExistentes.some(
            reserva => reserva.id === id
        )
    );


    // ==========================
    // NUEVA RESERVA
    // ==========================

    const nuevaReserva = {

        id: id,

        nombre: nombre.trim(),

        telefono: telefono.trim(),

        fecha: fecha,

        hora: hora,

        personas: Number(personas),

        comentarios:
            comentarios
                ? comentarios.trim()
                : "",

        estado: "pendiente",

        creadaEn:
            new Date().toISOString()

    };


    reservasExistentes.push(nuevaReserva);

    guardarReservas(reservasExistentes);


    console.log("");
    console.log("========== NUEVA RESERVA ==========");
    console.log("Reserva:", "#" + nuevaReserva.id);
    console.log("Nombre:", nuevaReserva.nombre);
    console.log("Teléfono:", nuevaReserva.telefono);
    console.log("Fecha:", nuevaReserva.fecha);
    console.log("Hora:", nuevaReserva.hora);
    console.log("Personas:", nuevaReserva.personas);
    console.log("Comentarios:", nuevaReserva.comentarios);
    console.log("===================================");
    console.log("");


    res.json({

        ok: true,

        id: nuevaReserva.id,

        mensaje:
            "Reserva recibida correctamente"

    });

});


// ==========================
// OBTENER RESERVAS
// ==========================

app.get("/reservas", (req, res) => {

    const reservas = obtenerReservas();

    res.json(reservas);

});


// ==========================
// ACEPTAR / RECHAZAR RESERVA
// ==========================

app.patch("/reservas/:id", (req, res) => {

    const id = Number(req.params.id);

    const { estado } = req.body;


    if (
        estado !== "aceptada" &&
        estado !== "rechazada"
    ) {

        return res.status(400).json({

            ok: false,

            error:
                "Estado no válido."

        });

    }


    const reservas = obtenerReservas();

    const reserva =
        reservas.find(
            r => r.id === id
        );


    if (!reserva) {

        return res.status(404).json({

            ok: false,

            error:
                "Reserva no encontrada."

        });

    }


    reserva.estado = estado;

    guardarReservas(reservas);


    console.log(
        `Reserva #${id} → ${estado}`
    );


    res.json({

        ok: true,

        reserva: reserva

    });

});


// ==========================
// ELIMINAR RESERVA
// ==========================

app.delete("/reservas/:id", (req, res) => {

    const id = Number(req.params.id);

    const reservas = obtenerReservas();

    const nuevasReservas =
        reservas.filter(
            reserva => reserva.id !== id
        );


    if (
        nuevasReservas.length ===
        reservas.length
    ) {

        return res.status(404).json({

            ok: false,

            error:
                "Reserva no encontrada."

        });

    }


    guardarReservas(nuevasReservas);


    res.json({

        ok: true

    });

});


// ==========================
// SERVIDOR
// ==========================

app.listen(PORT, () => {

    console.log(
        `Servidor funcionando en http://localhost:${PORT}`
    );

});