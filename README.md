# Clara - Finanzas personales

Aplicacion movil para controlar gastos, bolsillos y proyecciones de dinero. Esta preparada para desplegarse en Vercel con Neon Postgres y acceso limitado a una cuenta de Google.

## Incluye

- Registro rapido de ingresos y gastos.
- Saldo real calculado desde movimientos, con saldo inicial de `204.000 COP`.
- Presupuesto recurrente precargado: servicios, mercado, gato, transporte, higiene, acueducto e ingles.
- Ciclo de ingles de cuatro meses: `1.030.000 COP` en octubre de 2026 y cada nuevo ciclo; `700.000 COP` los demas meses.
- Acueducto bimensual desde agosto de 2026.
- Proyeccion de meses costosos, bolsillos recomendados y calculo del margen a solicitar.
- Google Login restringido a un unico correo.

## Desarrollo local

1. Copia `.env.example` como `.env.local` y completa las variables.
2. Crea una base de datos en Neon y pega su connection string pooled en `DATABASE_URL`.
3. Genera y aplica las migraciones:

```bash
npm run db:generate
npm run db:migrate
```

4. Inicia la aplicacion:

```bash
npm run dev
```

La primera vez que el correo autorizado entra, se crean automaticamente su configuracion y los gastos recurrentes. Las fechas de vencimiento iniciales son editables en el codigo y deben ajustarse a las fechas reales de cada factura en una siguiente iteracion.

## Google Login sin costo

1. En Google Cloud Console crea un OAuth Client de tipo **Web application**.
2. En desarrollo agrega `http://localhost:3000/api/auth/callback/google` como URI de redireccion autorizada.
3. Tras desplegar, agrega `https://TU-DOMINIO/api/auth/callback/google`.
4. Copia el client ID y secret a `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.
5. Define en `ALLOWED_EMAIL` exclusivamente el correo de la joven.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git.
2. Importa el repositorio en Vercel.
3. Crea las variables de `.env.example` en Vercel. En produccion, `NEXTAUTH_URL` debe ser la URL publica de Vercel.
4. Ejecuta `npm run db:generate` y `npm run db:migrate` una vez desde un entorno con `DATABASE_URL` configurada.
5. Despliega y agrega la URL final a las redirecciones autorizadas de Google.

## Referencias de presupuesto

Los gastos esenciales promedian `2.865.500 COP` al mes. El panel muestra `3.6M COP` como objetivo saludable mensual: cubre obligaciones, deja `200K` de gasto libre, `300K` de ahorro y un margen para formar colchon. El monto exacto a solicitar se recalcula con los ingresos y movimientos registrados.
