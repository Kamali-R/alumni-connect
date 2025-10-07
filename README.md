🎓 Alumni Connect
A web application to connect students and alumni through a verified registration system with email OTP authentication and secure login.
⚙️ Technologies Used
- Node.js & Express.js
- MongoDB & Mongoose
- Nodemailer (for OTP emails)
- dotenv (for environment variables)
- bcryptjs (for secure password hashing)
- jsonwebtoken (for login security)
- Postman (for API testing)
🚀 How to Run This Project (Backend Setup)
**Step 1:** Clone the Repository
    git clone https://github.com/Kamali-R/alumni-connect.git

**Step 2:** Move into Server Directory
    cd alumni-connect/server

**Step 3:** Initialize the Project (if not already)
    npm init -y

**Step 4:** Install Required Dependencies
    npm install express mongoose dotenv cors bcryptjs nodemailer jsonwebtoken

**Step 5:** Install Dev Dependency (Nodemon)
    npm install --save-dev nodemon
🗂 Folder Structure
server/
├── controllers/      # Business logic (e.g., authController.js)
├── models/           # MongoDB schemas (e.g., User.js)
├── routes/           # API routes (e.g., authRoutes.js)
├── utils/            # Helper functions (e.g., otpUtils.js)
├── .env              # Environment variables
├── server.js         # App entry point
└── package.json
🔐 .env File
MONGO_URI=your_mongo_uri_here
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
🧪 Step 7: Test the API with Postman
**Start the server**
    npm run dev

✅ Connected to MongoDB
🚀 Server running on port 5000
📮 Use Postman to Test APIs
**1. Health Check**
    GET http://localhost:5000/
    Response: { "message": "API is running" }

**2. Send OTP (Signup)**
    POST http://localhost:5000/api/send-otp
    Body:
    {
      "name": "JD",
      "email": "user@gmail.com",
      "password": "123456",
      "role": "student"
    }

**3. Verify OTP**
    POST http://localhost:5000/api/verify-otp
    Body:
    {
      "email": "user@gmail.com",
      "otp": "123456"
    }

**4. Login**
    POST http://localhost:5000/api/login
    Body:
    {
      "email": "user@gmail.com",
      "password": "123456"
    }
✍️ Frontend Flow (To Be Connected)
**Step 1: Signup Form**
  Fields: Name, Email, Password, Role
  Action: [Send OTP] → `/api/send-otp`

**Step 2: OTP Verification Form**
  Fields: 6 OTP input boxes
  Action: [Verify OTP] → `/api/verify-otp`


Google cloud console package install
npm install express-session




