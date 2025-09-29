require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Technician = require('../models/Technician');
const ServiceRequest = require('../models/ServiceRequest');
const Appointment = require('../models/Appointment');

// Sample data
const users = [
  {
    name: 'John Admin',
    email: 'admin@servicehub.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Tom Plumber',
    email: 'tom.plumber@servicehub.com',
    password: 'tech123',
    role: 'technician'
  },
  {
    name: 'Lisa Electrician',
    email: 'lisa.electric@servicehub.com',
    password: 'tech123',
    role: 'technician'
  },
  {
    name: 'Bob HVAC',
    email: 'bob.hvac@servicehub.com',
    password: 'tech123',
    role: 'technician'
  },
  {
    name: 'Emma Gas',
    email: 'emma.gas@servicehub.com',
    password: 'tech123',
    role: 'technician'
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Technician.deleteMany({});
    await ServiceRequest.deleteMany({});
    await Appointment.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Find technician users
    const technicianUsers = createdUsers.filter(u => u.role === 'technician');
    const regularUsers = createdUsers.filter(u => u.role === 'user');

    // Create technician profiles
    console.log('🔧 Creating technician profiles...');
    const technicianProfiles = [
      {
        user: technicianUsers[0]._id, // Tom Plumber
        service: ['plumbing'],
        phone: '+1-416-555-0101',
        location: 'Toronto, ON',
        experience: {
          years: 8,
          description: 'Expert plumber with residential and commercial experience'
        },
        pricing: {
          hourlyRate: 85,
          calloutFee: 50
        },
        availability: {
          emergencyAvailable: true,
          workingHours: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
            wednesday: { start: '08:00', end: '18:00' },
            thursday: { start: '08:00', end: '18:00' },
            friday: { start: '08:00', end: '18:00' },
            saturday: { start: '09:00', end: '15:00' }
          }
        },
        certifications: ['Licensed Plumber', 'Gas Fitter'],
        averageRating: 4.8,
        totalRatings: 156,
        completedJobs: 230,
        isActive: true
      },
      {
        user: technicianUsers[1]._id, // Lisa Electrician
        service: ['electrical'],
        phone: '+1-416-555-0102',
        location: 'Mississauga, ON',
        experience: {
          years: 6,
          description: 'Certified electrician specializing in residential wiring'
        },
        pricing: {
          hourlyRate: 90,
          calloutFee: 60
        },
        availability: {
          emergencyAvailable: true,
          workingHours: {
            monday: { start: '07:00', end: '19:00' },
            tuesday: { start: '07:00', end: '19:00' },
            wednesday: { start: '07:00', end: '19:00' },
            thursday: { start: '07:00', end: '19:00' },
            friday: { start: '07:00', end: '19:00' }
          }
        },
        certifications: ['Master Electrician', 'ESA Licensed'],
        averageRating: 4.9,
        totalRatings: 189,
        completedJobs: 275,
        isActive: true
      },
      {
        user: technicianUsers[2]._id, // Bob HVAC
        service: ['hvac'],
        phone: '+1-416-555-0103',
        location: 'Brampton, ON',
        experience: {
          years: 10,
          description: 'HVAC specialist - heating, cooling, ventilation systems'
        },
        pricing: {
          hourlyRate: 95,
          calloutFee: 75
        },
        availability: {
          emergencyAvailable: true,
          workingHours: {
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '17:00' }
          }
        },
        certifications: ['HVAC Technician', 'Refrigeration Certified'],
        averageRating: 4.7,
        totalRatings: 142,
        completedJobs: 198,
        isActive: true
      },
      {
        user: technicianUsers[3]._id, // Emma Gas
        service: ['gas'],
        phone: '+1-416-555-0104',
        location: 'Oakville, ON',
        experience: {
          years: 7,
          description: 'Licensed gas fitter for appliance installation and repair'
        },
        pricing: {
          hourlyRate: 100,
          calloutFee: 80
        },
        availability: {
          emergencyAvailable: true,
          workingHours: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
            wednesday: { start: '08:00', end: '18:00' },
            thursday: { start: '08:00', end: '18:00' },
            friday: { start: '08:00', end: '18:00' }
          }
        },
        certifications: ['Gas Fitter 2', 'TSSA Licensed'],
        averageRating: 4.9,
        totalRatings: 98,
        completedJobs: 145,
        isActive: true
      }
    ];

    const createdTechnicians = await Technician.insertMany(technicianProfiles);
    console.log(`✅ Created ${createdTechnicians.length} technician profiles`);

    // Create service requests
    console.log('📋 Creating service requests...');
    const serviceRequests = [
      {
        user: regularUsers[0]._id,
        serviceType: 'plumbing',
        description: 'Kitchen sink is leaking under the cabinet',
        location: '123 Main St, Toronto, ON',
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        user: regularUsers[1]._id,
        serviceType: 'electrical',
        description: 'Need additional outlets installed in home office',
        location: '456 Oak Ave, Mississauga, ON',
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        user: regularUsers[0]._id,
        serviceType: 'hvac',
        description: 'Air conditioner not cooling properly',
        location: '123 Main St, Toronto, ON',
        preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'assigned',
        assignedTechnician: technicianUsers[2]._id
      },
      {
        user: regularUsers[1]._id,
        serviceType: 'plumbing',
        description: 'Bathroom toilet keeps running',
        location: '456 Oak Ave, Mississauga, ON',
        preferredDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
        assignedTechnician: technicianUsers[0]._id
      }
    ];

    const createdRequests = await ServiceRequest.insertMany(serviceRequests);
    console.log(`✅ Created ${createdRequests.length} service requests`);

    // Create appointments
    console.log('📅 Creating appointments...');
    const appointments = [
      {
        user: regularUsers[0]._id,
        technician: technicianUsers[2]._id,
        serviceRequest: createdRequests[2]._id,
        serviceType: 'hvac',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        timeSlot: 'morning',
        description: 'AC repair and maintenance',
        address: {
          street: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          zipCode: 'M5V 2T6'
        },
        status: 'confirmed',
        priority: 'high',
        pricing: {
          estimatedCost: 250
        }
      },
      {
        user: regularUsers[1]._id,
        technician: technicianUsers[0]._id,
        serviceRequest: createdRequests[3]._id,
        serviceType: 'plumbing',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        timeSlot: 'afternoon',
        description: 'Toilet repair completed',
        address: {
          street: '456 Oak Ave',
          city: 'Mississauga',
          state: 'ON',
          zipCode: 'L5B 1M2'
        },
        status: 'completed',
        priority: 'normal',
        pricing: {
          estimatedCost: 150,
          finalCost: 175
        },
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✅ Created ${createdAppointments.length} appointments`);

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📝 Sample credentials:');
    console.log('Admin: admin@servicehub.com / admin123');
    console.log('User: mike@example.com / user123');
    console.log('Technician: tom.plumber@servicehub.com / tech123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();