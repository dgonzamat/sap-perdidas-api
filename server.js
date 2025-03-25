// Add this at the VERY TOP to ensure proper env loading
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Configuración del servidor
const app = express();
// Modify port configuration to include explicit host
const port = process.env.PORT || 3002;
const host = '0.0.0.0';  // Required for Render deployment

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Middleware
app.use(express.json());

// Update CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:3000', // Allow specific origins
  methods: ['GET', 'POST', 'PUT'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Explicit headers
  credentials: true // Allow cookies/authentication headers
}));

// Add health check endpoint
app.get('/sap/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Almacenamiento simulado
const ordenes = [];
const confirmaciones = [];

// Middleware de validación de token
const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }
    
    const token = authHeader.substring(7);
    
    if (token !== AUTH_TOKEN) {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    
    next();
};

// Endpoint raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Simulador SAP para CGE - Control de Pérdidas',
        version: '1.0.0'
    });
});

// Endpoint informativo de SAP
app.get('/sap', (req, res) => {
    res.json({
        success: true,
        message: 'API Simulador SAP para Control de Pérdidas',
        endpoints: [
            { método: 'POST', ruta: '/sap/ordentrabajo', descripción: 'Crear órdenes de inspección' },
            { método: 'PUT', ruta: '/sap/actualizarorden', descripción: 'Actualizar estado de órdenes' },
            { método: 'POST', ruta: '/sap/confirmacion', descripción: 'Confirmar recepción de órdenes' },
            { método: 'GET', ruta: '/sap/ordenes', descripción: 'Listar todas las órdenes' },
            { método: 'GET', ruta: '/sap/confirmaciones', descripción: 'Listar todas las confirmaciones' }
        ]
    });
});

// Endpoint para crear órdenes de inspección
app.post('/sap/ordentrabajo', validateToken, (req, res) => {
    try {
        const ordenData = req.body;
        
        // Validar datos mínimos requeridos
        if (!ordenData.avisoId || !ordenData.claseAviso || !ordenData.cliente) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requieren avisoId, claseAviso y cliente'
            });
        }
        
        // Generar orden
        const orden = {
            id: ordenData.avisoId,
            timestamp: new Date().toISOString(),
            estado: 'CREADO',
            ...ordenData
        };
        
        // Almacenar orden
        ordenes.push(orden);
        
        console.log(`Orden de trabajo creada: ${orden.id}`);
        
        // Responder exitosamente
        return res.status(201).json({
            success: true,
            message: 'Orden de trabajo creada exitosamente',
            data: {
                ordenId: orden.id,
                estado: orden.estado,
                timestamp: orden.timestamp
            }
        });
        
    } catch (error) {
        console.error('Error al procesar orden de trabajo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Endpoint para actualizar estado de una orden
app.put('/sap/actualizarorden', validateToken, (req, res) => {
    try {
        const { ordenId, nuevoEstado, informacionAdicional } = req.body;
        
        // Validar datos mínimos
        if (!ordenId || !nuevoEstado) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requieren ordenId y nuevoEstado'
            });
        }
        
        // Buscar la orden
        const ordenIndex = ordenes.findIndex(orden => orden.id === ordenId);
        
        if (ordenIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Orden ${ordenId} no encontrada`
            });
        }
        
        // Actualizar estado
        ordenes[ordenIndex].estado = nuevoEstado;
        ordenes[ordenIndex].ultimaActualizacion = new Date().toISOString();
        
        // Añadir información adicional si existe
        if (informacionAdicional) {
            ordenes[ordenIndex].informacionAdicional = informacionAdicional;
        }
        
        console.log(`Orden ${ordenId} actualizada a estado: ${nuevoEstado}`);
        
        // Responder exitosamente
        return res.status(200).json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: {
                ordenId: ordenId,
                estado: nuevoEstado,
                timestamp: ordenes[ordenIndex].ultimaActualizacion
            }
        });
        
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Endpoint para confirmación de recepción
app.post('/sap/confirmacion', validateToken, (req, res) => {
    try {
        const { ordenId, estado, mensaje } = req.body;
        
        // Validar datos mínimos
        if (!ordenId || !estado) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos. Se requieren ordenId y estado'
            });
        }
        
        // Registrar confirmación
        const confirmacion = {
            id: uuidv4(),
            ordenId,
            estado,
            mensaje: mensaje || '',
            timestamp: new Date().toISOString()
        };
        
        confirmaciones.push(confirmacion);
        
        console.log(`Confirmación recibida para orden ${ordenId}: ${estado}`);
        
        // Responder exitosamente
        return res.status(200).json({
            success: true,
            message: 'Confirmación registrada',
            data: {
                confirmacionId: confirmacion.id,
                ordenId: ordenId,
                estado: estado
            }
        });
        
    } catch (error) {
        console.error('Error al procesar confirmación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Endpoint para consultar órdenes (útil para debugging)
app.get('/sap/ordenes', validateToken, (req, res) => {
    res.json({
        success: true,
        count: ordenes.length,
        data: ordenes
    });
});

// Endpoint para consultar confirmaciones (útil para debugging)
app.get('/sap/confirmaciones', validateToken, (req, res) => {
    res.json({
        success: true,
        count: confirmaciones.length,
        data: confirmaciones
    });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Simulador de API SAP para Control de Pérdidas ejecutándose en puerto ${port}`);
  console.log(`URL base: http://localhost:${port}/sap`);
});