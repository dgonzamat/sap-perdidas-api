# SAP Pérdidas API Simulator

Simulador de API SAP para Control de Pérdidas de CGE. This API simulator provides endpoints for managing work orders and confirmations.

## Features

- Work order creation and management
- Order status updates
- Order confirmations
- Authentication via Bearer token
- CORS protection
- Environment variable configuration

## Prerequisites

- Node.js 18.x
- npm 9.x

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=10000 # Port number for the server
CORS_ORIGINS=* # Allowed CORS origins
AUTH_TOKEN=your_auth_token # Authentication token for API access
```

## Development

```bash
npm run dev
```

## Production Deployment

1. Fork this repository
2. Connect your forked repository to Render
3. Create a new Web Service
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add the required environment variables in Render's dashboard
6. Deploy!

## API Endpoints

- `GET /sap/health` - Health check endpoint
- `GET /sap` - API information and available endpoints
- `POST /sap/ordentrabajo` - Create inspection orders
- `PUT /sap/actualizarorden` - Update order status
- `POST /sap/confirmacion` - Confirm order reception
- `GET /sap/ordenes` - List all orders
- `GET /sap/confirmaciones` - List all confirmations

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_auth_token
```

## License

ISC