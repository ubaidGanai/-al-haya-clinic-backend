const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());

// This tells the server to host your HTML file from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); 

// This acts as our temporary Database
const appointmentsDB = {}; 

// --- EMAIL SETUP ---
// Using your provided email address
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ubaidshabir837@gmail.com', 
        pass: 'oxcw gmgl xija xane' // Generate this in Google Account Security
    }
});

// Route to receive the booking from the patient
app.post('/api/book', async (req, res) => {
    const data = req.body;
    // Generate a unique ID for this appointment
    const bookingId = 'APT-' + Math.floor(Math.random() * 1000000);
    
    // Save to database as "Waiting"
    appointmentsDB[bookingId] = { ...data, status: 'Waiting', id: bookingId };

    // Send Email to the Doctor
    const acceptLink = `http://localhost:3000/api/accept/${bookingId}`;
    
    const mailOptions = {
        from: 'ubaidshabir837@gmail.com',
        to: 'ubaidshabir837@gmail.com', // Sending the request to this email
        subject: `New Appointment Request: ${data.provider}`,
        html: `
            <h2>New Appointment Request</h2>
            <p><strong>Patient:</strong> ${data.fullName}</p>
            <p><strong>Age:</strong> ${data.age}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Date & Time:</strong> ${data.date} at ${data.time}</p>
            <br>
            <a href="${acceptLink}" style="padding: 10px 20px; background: #34C759; color: white; text-decoration: none; border-radius: 5px; font-family: sans-serif;">Accept Appointment</a>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, bookingId: bookingId });
    } catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ success: false, message: 'Email failed to send.' });
    }
});

// Route for the Doctor to click and accept
app.get('/api/accept/:id', (req, res) => {
    const id = req.params.id;
    if (appointmentsDB[id]) {
        appointmentsDB[id].status = 'Confirmed';
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #34C759;">✅ Appointment Accepted!</h1>
                <p>The patient's screen has been updated automatically.</p>
            </div>
        `);
    } else {
        res.status(404).send('Appointment not found.');
    }
});

// Route for the Patient's screen to check the status
app.get('/api/status/:id', (req, res) => {
    const id = req.params.id;
    if (appointmentsDB[id]) {
        res.json({ status: appointmentsDB[id].status });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running! Open http://localhost:${PORT} in your browser.`);
});
