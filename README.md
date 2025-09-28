# ServiceHub - Professional Home Services Platform

A comprehensive platform connecting customers with verified home service technicians for plumbing, electrical, HVAC, and gas services.

## 🚀 Features

### For Customers
- **Service Requests**: Submit detailed service requests with photos and scheduling preferences
- **Technician Search**: Find and filter technicians by service type, location, rating, and availability
- **Real-time Communication**: Chat and video call with technicians
- **Appointment Management**: Schedule, reschedule, and track appointments
- **Rating & Reviews**: Rate services and leave reviews
- **Dashboard**: Track service history and manage profile

### For Technicians
- **Profile Management**: Create detailed profiles with services, pricing, and availability
- **Job Management**: Accept, manage, and complete service requests
- **Customer Communication**: Direct communication tools
- **Earnings Tracking**: Monitor completed jobs and earnings
- **Verification System**: Get verified for increased trust

### For Administrators
- **User Management**: Manage customers and technicians
- **Verification**: Verify technician credentials and profiles
- **Analytics**: Comprehensive dashboard with business metrics
- **Service Monitoring**: Oversee all service requests and appointments
- **System Settings**: Configure platform settings and features

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Jest** for testing
- **Multer** for file uploads

### Frontend
- **React 18** with functional components
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time features
- **React Testing Library** for testing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/servicehub.git
cd servicehub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/servicehub
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

Start the frontend application:
```bash
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/ping

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:coverage      # Run tests with coverage report
```

## 👥 Demo Accounts

For testing purposes, you can create these demo accounts or seed the database:

### Admin Account
- **Email**: admin@servicehub.com
- **Password**: admin123
- **Role**: Administrator

### Technician Account
- **Email**: tech@servicehub.com
- **Password**: tech123
- **Role**: Technician

### Customer Account
- **Email**: user@servicehub.com
- **Password**: user123
- **Role**: User/Customer

## 🗂 Project Structure

```
servicehub/
├── backend/                    # Node.js/Express API
│   ├── controllers/           # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routes
│   ├── tests/               # Backend tests
│   ├── utils/               # Utility functions
│   ├── .env                 # Environment variables
│   ├── jest.config.js       # Jest configuration
│   ├── package.json
│   └── server.js           # Main server file
├── frontend/                  # React application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── tests/          # Frontend tests
│   │   └── assets/         # Static assets
│   ├── .env                # Environment variables
│   ├── package.json
│   └── README.md
└── docs/                     # Documentation
```

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **Public Routes**: Home, Login, Signup, Technician Listings
- **User Routes**: Dashboard, Service Requests, Appointments, Profile
- **Technician Routes**: Technician Dashboard, Job Management
- **Admin Routes**: Admin Dashboard, User Management, Analytics

## 📱 Key Features Implementation

### User Dashboard
- Service request history and status tracking
- Upcoming appointments management
- Rating and review system
- Profile management

### Admin Dashboard
- User and technician management
- Service request monitoring
- System analytics and reporting
- Verification management

### Real-time Features
- Socket.io integration for live chat
- WebRTC for video calling
- Real-time notifications
- Live status updates

### Search & Filtering
- Advanced technician search
- Location-based filtering
- Service type categorization
- Rating and availability filters

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file
   - Verify network connectivity

2. **JWT Authentication Error**
   ```
   Error: JsonWebTokenError: invalid token
   ```
   - Clear localStorage and login again
   - Check JWT_SECRET in backend .env
   - Ensure token format is correct

3. **CORS Error**
   ```
   Access to XMLHttpRequest at 'http://localhost:5000' blocked by CORS
   ```
   - Verify FRONTEND_URL in backend .env
   - Check CORS configuration in server.js

4. **Test Failures**
   - Ensure MongoDB Memory Server is installed
   - Check test environment setup
   - Verify mock configurations

### Development Tips

1. **Hot Reloading**: Both frontend (React) and backend (nodemon) support hot reloading
2. **API Testing**: Use tools like Postman or Thunder Client for API testing
3. **Database GUI**: Use MongoDB Compass for database visualization
4. **Debugging**: Use Chrome DevTools for frontend and Node.js debugger for backend

## 🔄 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update profile

### Users & Technicians
- `GET /technicians` - List technicians
- `GET /technicians/:id` - Get technician details
- `POST /technicians/me` - Create/update technician profile

### Service Requests
- `POST /service-requests` - Create service request
- `GET /service-requests/my` - Get user's requests
- `GET /service-requests/all` - Get all requests (admin)

### Admin
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/technicians` - Technician management
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

## 🚀 Deployment

### Backend Deployment (Node.js)
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment (React)
1. Build the production bundle: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, S3)
3. Configure environment variables for production API

### Database
- Use MongoDB Atlas for cloud hosting
- Set up proper indexes for performance
- Configure backup and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@servicehub.com
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `/docs` folder for detailed guides

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core platform functionality
- ✅ User authentication and authorization
- ✅ Service request management
- ✅ Admin dashboard
- ✅ Testing implementation

### Phase 2 (Next)
- 🔲 Payment integration (Stripe/PayPal)
- 🔲 Push notifications
- 🔲 Mobile app development
- 🔲 Advanced analytics
- 🔲 Multi-language support

### Phase 3 (Future)
- 🔲 AI-powered technician matching
- 🔲 IoT device integration
- 🔲 Subscription services
- 🔲 API marketplace
- 🔲 White-label solutions

---

**Built with ❤️ by the ServiceHub Team**