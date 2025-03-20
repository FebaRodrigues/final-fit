# Fitness Tracker Server

This is the backend server for the Fitness Tracker application.

## Environment Setup

The server requires several environment variables to function properly. These can be set in a `.env` file in the Server directory.

### Required Environment Variables

- `MONGO_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe API publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for verifying webhook events

### Optional Environment Variables

- `PORT`: Server port (default: 5050)
- `NODE_ENV`: Environment mode (development/production)
- `CLIENT_URL`: URL of the client application (default: http://localhost:5173)
- `SESSION_SECRET`: Secret for session management
- `EMAIL_USER`: Email for sending notifications
- `EMAIL_PASS`: Password for the email account

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Add your IP address to the IP whitelist
5. Get the connection string and add it to your `.env` file as `MONGO_URI`

## Stripe Setup

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Add the secret key to your `.env` file as `STRIPE_SECRET_KEY`
4. Add the publishable key to your `.env` file as `STRIPE_PUBLISHABLE_KEY`
5. Set up a webhook endpoint in the Stripe Dashboard pointing to `https://your-server-url/api/payments/webhook`
6. Get the webhook signing secret and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Running the Server

### Using Node.js directly

```bash
# Start the server using server.js (recommended)
node server.js

# Or start the server using index.js
node index.js
```

### Using the provided scripts

#### Windows (PowerShell)

```powershell
# Start the server with proper environment variable loading
./start-server.ps1

# To use index.js instead of server.js
./start-server.ps1 index
```

#### Windows (Command Prompt/Batch)

```batch
# Start the server with proper environment variable loading
start-server-with-env.bat

# To use index.js instead of server.js
start-server-with-env.bat index
```

#### Using Node.js script

```bash
# Start the server with proper environment variable loading
node start-server.js

# To use index.js instead of server.js
node start-server.js index
```

## Troubleshooting

### MongoDB Connection Issues

If you're having trouble connecting to MongoDB Atlas:

1. Check if your MongoDB Atlas cluster is running
2. Verify your MongoDB connection string in the `.env` file
3. Ensure your IP address is whitelisted in MongoDB Atlas
4. Check if your MongoDB Atlas username and password are correct

You can run the test script to check your MongoDB connection:

```bash
node scripts/test-connection.js
```

### Stripe Issues

If you're having trouble with Stripe:

1. Verify your Stripe API keys in the `.env` file
2. Ensure you are using the correct Stripe API version
3. Check if your Stripe account is active
4. Verify the webhook endpoint is correctly configured

## Environment Variable Loading

The server will attempt to load environment variables from the following locations:

1. `.env` file in the Server directory
2. `.env` file in the root directory (if variables are missing)

This ensures that the server can find the necessary configuration regardless of how it's started. 