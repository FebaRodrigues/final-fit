const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const serverEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
  
  // Try root .env file
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`Loading .env from: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  } else {
    console.log(`Root .env file not found at: ${rootEnvPath}`);
  }
}

// Import SPA model
const { SpaService } = require('../models/Spa');

// Explicitly set MongoDB URI
const MONGO_URI = 'mongodb+srv://febarodrigues88:nhPqFzat4hq2crm1@cluster0.mvvdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initial SPA services data
const spaServices = [
  {
    name: 'Swedish Massage',
    description: 'A gentle full body massage designed to improve circulation, ease tension, and promote relaxation.',
    duration: 60,
    price: 499,
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2070&auto=format&fit=crop'
  },
  {
    name: 'Deep Tissue Massage',
    description: 'A therapeutic massage that focuses on realigning deeper layers of muscles and connective tissue.',
    duration: 60,
    price: 699,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1974&auto=format&fit=crop'
  },
  {
    name: 'Hot Stone Massage',
    description: 'A massage therapy that uses smooth, heated stones placed on specific points on the body to help relax muscles.',
    duration: 75,
    price: 899,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop'
  },
  {
    name: 'Aromatherapy Massage',
    description: 'A massage using essential oils derived from plants to enhance psychological and physical well-being.',
    duration: 60,
    price: 599,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop'
  },
  {
    name: 'Sports Massage',
    description: 'A massage designed to help athletes prepare for and recover from intense physical activity.',
    duration: 60,
    price: 799,
    image: 'https://images.unsplash.com/photo-1573045619003-b5a5b7517118?q=80&w=2070&auto=format&fit=crop'
  },
  {
    name: 'Facial Treatment',
    description: 'A skincare treatment that cleanses, exfoliates, and nourishes the skin to promote a clear, well-hydrated complexion.',
    duration: 45,
    price: 549,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop'
  }
];

// Function to create SPA services
const createSpaServices = async () => {
  try {
    // Check if services already exist
    const existingServices = await SpaService.find();
    if (existingServices.length > 0) {
      console.log(`${existingServices.length} SPA services already exist in the database.`);
      
      // Delete existing services without prompting
      await SpaService.deleteMany({});
      console.log('Existing SPA services deleted.');
      
      // Create new services
      await SpaService.insertMany(spaServices);
      console.log(`${spaServices.length} new SPA services created successfully.`);
      mongoose.disconnect();
    } else {
      // Create new services
      await SpaService.insertMany(spaServices);
      console.log(`${spaServices.length} SPA services created successfully.`);
      mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error creating SPA services:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the function
createSpaServices(); 