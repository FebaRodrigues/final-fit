// controllers/paymentController.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const Membership = require('../models/Membership');
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const otpStore = new Map();

// Initialize Stripe with proper error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not defined in environment variables');
    throw new Error('STRIPE_SECRET_KEY is not configured. Please check your .env file.');
  }
  
  console.log('Initializing Stripe with key:', process.env.STRIPE_SECRET_KEY);
  
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  console.log('Stripe initialized successfully with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// Helper function to update user membership
const updateUserMembership = async (userId, membershipId) => {
  try {
    // First, expire any existing active memberships
    const expireResult = await Membership.updateMany(
      { userId: userId, status: 'Active', _id: { $ne: membershipId } },
      { status: 'Expired' }
    );
    console.log('Expired existing memberships:', expireResult);

    // Get the membership to update
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    // Calculate end date based on duration
    const endDate = new Date();
    if (membership.duration === 'Monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (membership.duration === 'Quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (membership.duration === 'Yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Default to 1 month if duration not recognized
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Then activate this membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { 
        status: 'Active',
        startDate: new Date(),
        endDate: endDate
      },
      { new: true }
    );
    
    console.log('Activated membership:', updatedMembership);
    return updatedMembership;
  } catch (error) {
    console.error('Error in updateUserMembership:', error);
    throw error;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Gmail
const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'TrackFit - Payment Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Verification</h2>
        <p>Your one-time password (OTP) for payment verification is:</p>
        <h1 style="color: #007bff; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPaymentOTP = async (req, res) => {
  const { userId, email } = req.body;
  try {
    console.log('Sending OTP with data:', req.body);
    const sessionInfo = {
      hasSession: !!req.session,
      sessionID: req.session?.id || 'none'
    };
    console.log('Session info:', sessionInfo);
    
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use provided email or fall back to user's email
    const emailToUse = email || user.email;
    if (!emailToUse) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp, 'for user:', userId);
    
    // Set expiry time (15 minutes)
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000);
    
    // Save OTP in database with stringified objectId to ensure exact matching
    let dbOtpSaved = false;
    let dbOtpId = null;
    try {
      // First, invalidate any existing OTPs for this user
      const invalidateResult = await OTP.updateMany(
        { userId: { $in: [userId.toString(), userId] }, isUsed: false },
        { isUsed: true }
      );
      console.log('Invalidated existing OTPs:', invalidateResult);
      
      // Create new OTP record with string versions of userId and OTP code
      const otpRecord = new OTP({
        userId: userId.toString(), // Explicitly use string format
        code: otp.toString(),
        expires: expiryDate,
        purpose: 'payment',
        email: emailToUse
      });
      
      const savedOTP = await otpRecord.save();
      dbOtpId = savedOTP._id;
      dbOtpSaved = true;
      console.log('OTP saved to database:', savedOTP._id);
      
      // Verify the OTP was saved correctly by looking it up
      const verifyOtp = await OTP.findOne({ 
        userId: userId.toString(),
        code: otp.toString(),
        isUsed: false 
      });
      
      console.log('OTP verification lookup result:', verifyOtp ? {
        id: verifyOtp._id,
        code: verifyOtp.code,
        userId: verifyOtp.userId,
        expires: verifyOtp.expires,
        isExpired: verifyOtp.expires < new Date() 
      } : 'Not found');
    } catch (dbError) {
      console.error('Failed to save OTP to database:', dbError);
      // Continue with session-based OTP as fallback
    }
    
    // Also store OTP in session as backup
    let sessionOtpSaved = false;
    if (req.session) {
      req.session.otp = { 
        code: otp.toString(), 
        expires: expiryDate, 
        userId: userId.toString() 
      };
      
      console.log('OTP session data before save:', JSON.stringify(req.session.otp, null, 2));
      
      // Save session explicitly to ensure it's stored
      try {
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('Error saving session:', err);
              reject(err);
            } else {
              console.log('OTP session saved successfully');
              sessionOtpSaved = true;
              resolve();
            }
          });
        });
      } catch (sessionError) {
        console.error('Failed to save session:', sessionError);
        // Continue since we have DB storage as primary
      }
    }

    // Send OTP via email
    let emailSent = false;
    try {
      await sendOTP(emailToUse, otp);
      console.log('OTP email sent successfully to:', emailToUse);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again.',
        debug: {
          dbOtpSaved,
          sessionOtpSaved
        }
      });
    }
    
    return res.status(200).json({ 
      message: 'OTP sent successfully',
      expiresAt: expiryDate.toISOString(),
      debug: {
        dbOtpSaved,
        dbOtpId: dbOtpId ? dbOtpId.toString() : null,
        sessionOtpSaved,
        emailSent,
        sessionInfo
      }
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: error.message || 'Failed to send OTP',
      errorType: error.name
    });
  }
};

const verifyPaymentOTP = async (req, res) => {
  const { otp, userId } = req.body;
  
  try {
    console.log(`[${new Date().toISOString()}] === OTP VERIFICATION ATTEMPT ===`);
    console.log(`Request body:`, JSON.stringify(req.body));
    console.log(`Headers:`, JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin'],
      'host': req.headers['host']
    }));
    
    // Enhanced logging for debugging
    const sessionDebug = {
      hasSession: !!req.session,
      hasOTPinSession: !!(req.session && req.session.otp),
      sessionID: req.session?.id || 'none'
    };
    console.log('Session debug info:', sessionDebug);
    
    // Validate input
    if (!otp || !userId) {
      console.error('OTP verification failed: Missing required fields', { otp: !!otp, userId: !!userId });
      return res.status(400).json({ 
        message: 'OTP and userId are required',
        debug: { 
          sessionDebug,
          timestamp: new Date().toISOString(),
          requiredFields: { otp: !!otp, userId: !!userId }
        }
      });
    }

    // Convert values to strings to ensure consistent comparison
    const otpString = otp.toString();
    const userIdString = userId.toString();
    const currentTime = new Date();
    
    console.log(`Looking for OTP in database for userId: "${userIdString}" with code: "${otpString}"`);
    
    // Directly check the database for valid OTPs
    try {
      // First log all OTPs for this user for debugging purposes
      const allUserOTPs = await OTP.find({ 
        userId: { $in: [userIdString, userId] } // Search for both string and ObjectId formats
      });
      
      console.log(`Found ${allUserOTPs.length} OTPs in database for user:`, 
        allUserOTPs.map(o => ({
          id: o._id, 
          code: o.code, 
          userId: o.userId,
          userIdType: typeof o.userId,
          isUsed: o.isUsed, 
          expires: o.expires,
          isExpired: o.expires < currentTime
        }))
      );
      
      // If no OTPs found at all, try checking with a loose match on userId
      if (allUserOTPs.length === 0) {
        console.log('No exact OTPs found, checking with loose userId match...');
        
        // Try with a regex pattern on the string form of userId
        const looseUserOTPs = await OTP.find({});
        
        console.log('All OTPs in database:', looseUserOTPs.map(o => ({
          id: o._id,
          code: o.code,
          userId: o.userId,
          userIdType: typeof o.userId,
          userIdMatches: o.userId.toString().includes(userIdString) || userIdString.includes(o.userId.toString()),
          isUsed: o.isUsed,
          expires: o.expires
        })));
        
        // If still no OTPs found, return error
        if (looseUserOTPs.length === 0) {
          console.error('No OTPs found in the entire database');
          return res.status(400).json({ 
            message: 'No OTP records found in the system. Please request a new OTP.',
            debug: {
              sessionDebug,
              databaseCheck: 'No OTPs found in database',
              userId: userIdString,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      // Now look for a valid, unused OTP
      const dbOTP = await OTP.findOne({
        userId: { $in: [userIdString, userId] }, // Search for both string and ObjectId formats
        code: otpString,
        isUsed: false,
        expires: { $gt: currentTime }
      });
      
      // If no valid OTP found
      if (!dbOTP) {
        // Check if there was an OTP but it's expired or used
        const expiredOrUsedOTP = await OTP.findOne({
          userId: { $in: [userIdString, userId] },
          code: otpString
        });
        
        let errorMessage = 'Invalid OTP. Please request a new OTP.';
        let errorReason = 'not_found';
        
        if (expiredOrUsedOTP) {
          if (expiredOrUsedOTP.expires < currentTime) {
            errorMessage = 'OTP has expired. Please request a new OTP.';
            errorReason = 'expired';
          } else if (expiredOrUsedOTP.isUsed) {
            errorMessage = 'OTP has already been used. Please request a new OTP.';
            errorReason = 'already_used';
          }
        }
        
        console.error(`OTP verification failed: ${errorReason}`);
        return res.status(400).json({ 
          message: errorMessage,
          errorReason,
          debug: {
            sessionDebug,
            databaseCheck: errorReason,
            expiredOrUsed: !!expiredOrUsedOTP,
            userId: userIdString,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      console.log('Valid OTP found in database:', dbOTP._id);
      
      // Mark OTP as used
      dbOTP.isUsed = true;
      await dbOTP.save();
      console.log('OTP marked as used in database');
      
      // Find any pending membership for this user
      const pendingMembership = await Membership.findOne({ 
        userId: { $in: [userIdString, userId] }, 
        status: 'Pending' 
      }).sort({ createdAt: -1 });

      if (pendingMembership) {
        console.log('Found pending membership:', pendingMembership);
        
        // Return success response with membership info
        return res.status(200).json({ 
          message: 'OTP verified successfully',
          pendingMembership: pendingMembership,
          verificationMethod: 'database',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('No pending membership found for user');
        // Return success response without membership info
        return res.status(200).json({ 
          message: 'OTP verified successfully',
          verificationMethod: 'database',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.error('Database error during OTP verification:', dbError);
      return res.status(500).json({ 
        message: 'Error verifying OTP: Database error',
        error: dbError.message,
        debug: {
          timestamp: new Date().toISOString(),
          errorType: dbError.name,
          errorStack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
        }
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    
    return res.status(500).json({ 
      message: 'Failed to verify OTP: ' + error.message,
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error.name,
        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const { amount, type, membershipId, userId, planType, paymentId, bookingId, description } = req.body;

    console.log('=== Payment Creation Debug ===');
    console.log('1. Received payment request with data:', {
      amount,
      type,
      membershipId,
      userId,
      planType,
      paymentId,
      bookingId,
      description
    });
    
    // Validate Stripe initialization
    if (!stripe) {
      console.error('2. ERROR: Stripe is not properly initialized');
      return res.status(500).json({ message: 'Payment service is not available' });
    }
    console.log('2. Stripe initialization check passed');

    // Validate required fields
    if (!type || !userId) {
      console.error('3. ERROR: Missing required payment fields:', { type, userId });
      return res.status(400).json({ message: 'Missing required payment information' });
    }
    console.log('3. Required fields validation passed');

    // Set default amount for SPA services if missing or invalid
    let paymentAmount = amount;
    if (type === 'SpaService' && (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0)) {
      console.log('4. Using default amount (499) for SPA service payment');
      paymentAmount = 499;
    } else if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      console.error('4. ERROR: Invalid amount value:', amount);
      return res.status(400).json({ message: 'Invalid amount value' });
    }
    console.log('4. Payment amount validation passed:', paymentAmount);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('5. ERROR: User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('5. User found:', user.email);

    // Only check for membership if membershipId is provided and type is Membership
    let membership = null;
    if (type === 'Membership' && membershipId) {
      membership = await Membership.findById(membershipId);
      if (!membership) {
        console.error(`6. ERROR: Membership with ID ${membershipId} not found`);
        return res.status(404).json({ message: 'Membership not found' });
      }
      console.log('6. Found membership:', membership);
    }
    
    // Check for SPA booking if type is SpaService and bookingId is provided
    let spaBooking = null;
    if (type === 'SpaService' && bookingId) {
      // Import the SpaBooking model dynamically to avoid circular dependencies
      const { SpaBooking } = require('../models/Spa');
      spaBooking = await SpaBooking.findById(bookingId);
      if (!spaBooking) {
        console.error(`SPA booking with ID ${bookingId} not found`);
        return res.status(404).json({ message: 'SPA booking not found' });
      } else {
        console.log('Found SPA booking:', spaBooking);
      }
    }

    // Format amount properly
    const amountInCents = Math.round(Number(paymentAmount) * 100);
    console.log('7. Amount in cents:', amountInCents);
    
    // Verify client URL is set
    if (!process.env.CLIENT_URL) {
      console.error('8. ERROR: CLIENT_URL environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error: CLIENT_URL not set' });
    }
    console.log('8. CLIENT_URL check passed:', process.env.CLIENT_URL);
    
    try {
      // Check if we're retrying an existing payment
      let existingPayment = null;
      if (paymentId) {
        existingPayment = await Payment.findById(paymentId);
        if (existingPayment) {
          console.log('Found existing payment to retry:', existingPayment);
          
          // If this is a SPA service payment, make sure we have the booking ID
          if (existingPayment.type === 'SpaService' && !bookingId && existingPayment.bookingId) {
            console.log('Using booking ID from existing payment:', existingPayment.bookingId);
            bookingId = existingPayment.bookingId;
            
            // Verify the booking exists
            const { SpaBooking } = require('../models/Spa');
            spaBooking = await SpaBooking.findById(bookingId);
            if (!spaBooking) {
              console.error(`SPA booking with ID ${bookingId} not found`);
              return res.status(404).json({ message: 'SPA booking not found' });
            } else {
              console.log('Found SPA booking from existing payment:', spaBooking);
            }
          }
          
          // If the payment has a temporary session ID, clear it so we create a new one
          if (existingPayment.stripeSessionId && existingPayment.stripeSessionId.startsWith('pending-')) {
            console.log('Payment has a temporary session ID, will create a new one');
            existingPayment.stripeSessionId = null;
          }
        }
      }
      
      // Check if there's already a pending payment for this membership or booking
      if (!existingPayment) {
        if (membershipId && type === 'Membership') {
          const pendingPayment = await Payment.findOne({
            membershipId,
            status: 'Pending'
          });
          
          if (pendingPayment) {
            console.log('Found existing pending membership payment:', pendingPayment);
            
            // If there's an existing Stripe session, use it
            if (pendingPayment.stripeSessionId) {
              // Check if the session is still valid
              try {
                const session = await stripe.checkout.sessions.retrieve(pendingPayment.stripeSessionId);
                if (session && session.status !== 'expired') {
                  return res.status(200).json({
                    sessionId: pendingPayment.stripeSessionId,
                    payment: pendingPayment
                  });
                }
              } catch (sessionError) {
                console.log('Session no longer valid, creating a new one');
              }
            }
            
            // If we're not explicitly retrying this payment, use it as our existing payment
            if (!existingPayment) {
              existingPayment = pendingPayment;
            }
          }
        } else if (bookingId && type === 'SpaService') {
          const pendingPayment = await Payment.findOne({
            bookingId,
            status: 'Pending'
          });
          
          if (pendingPayment) {
            console.log('Found existing pending SPA payment:', pendingPayment);
            
            // If there's an existing Stripe session, use it
            if (pendingPayment.stripeSessionId) {
              // Check if the session is still valid
              try {
                const session = await stripe.checkout.sessions.retrieve(pendingPayment.stripeSessionId);
                if (session && session.status !== 'expired') {
                  return res.status(200).json({
                    sessionId: pendingPayment.stripeSessionId,
                    payment: pendingPayment
                  });
                }
              } catch (sessionError) {
                console.log('Session no longer valid, creating a new one');
              }
            }
            
            // If we're not explicitly retrying this payment, use it as our existing payment
            if (!existingPayment) {
              existingPayment = pendingPayment;
            }
          }
        }
      }
      
      // Prepare product name and description based on payment type
      let productName = `${planType || 'Fitness'} ${type}`;
      let productDescription = `${planType || 'Standard'} ${type.toLowerCase()} for TrackFit`;
      
      // For SPA services, use the provided description or a default
      if (type === 'SpaService') {
        productName = description || 'SPA Service';
        productDescription = 'SPA service booking at TrackFit';
      }
      
      // Create Stripe checkout session
      console.log('9. Creating Stripe session with data:', {
        amount: amountInCents,
        currency: 'inr',
        productName,
        productDescription,
        userId,
        type,
        membershipId: membershipId || '',
        planType: planType || '',
        bookingId: bookingId || ''
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: productName,
                description: productDescription,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        metadata: {
          userId,
          type,
          membershipId: membershipId || '',
          planType: planType || '',
          bookingId: bookingId || '',
          paymentId: existingPayment ? existingPayment._id.toString() : ''
        }
      }).catch(error => {
        console.error('ERROR in Stripe session creation:', error);
        throw error;
      });

      console.log('10. Stripe session created successfully:', {
        sessionId: session.id,
        url: session.url
      });

      // Update existing payment or create a new one
      let payment;
      if (existingPayment) {
        // Update the existing payment with the new session ID
        existingPayment.stripeSessionId = session.id;
        await existingPayment.save();
        payment = existingPayment;
        console.log('Updated existing payment with new session ID:', payment);
      } else {
        // Create a new payment record
        payment = new Payment({
          userId,
          amount: paymentAmount,
          type,
          status: 'Pending',
          stripeSessionId: session.id,
          membershipId: type === 'Membership' ? membershipId : null,
          bookingId: type === 'SpaService' ? bookingId : null,
          planType: planType || null,
          description: description || null
        });

        await payment.save();
        console.log('Created new payment record:', payment);
        
        // If this is a SPA booking payment, update the booking with the payment ID
        if (type === 'SpaService' && bookingId && spaBooking) {
          spaBooking.paymentId = payment._id;
          await spaBooking.save();
          console.log('Updated SPA booking with payment ID:', payment._id);
        }
      }

      // Return the session ID to the client
      return res.status(200).json({ 
        sessionId: session.id,
        payment: payment
      });
    } catch (stripeError) {
      console.error('ERROR in Stripe session creation:', stripeError);
      return res.status(500).json({ 
        message: 'Payment processing error', 
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('ERROR in payment creation:', error);
    return res.status(500).json({ 
      message: 'Server error creating payment', 
      error: error.message 
    });
  }
};

const verifyStripeSession = async (req, res) => {
  const { session_id } = req.query;
  
  try {
    console.log('Verifying Stripe session:', session_id);
    
    // Check if payment was already processed
    const existingPayment = await Payment.findOne({ 
      stripeSessionId: session_id,
      status: 'Completed'
    });
    
    if (existingPayment) {
      console.log('Payment was already processed:', existingPayment);
      return res.status(200).json({ 
        message: 'Payment was already processed',
        alreadyProcessed: true,
        payment: existingPayment
      });
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Retrieved Stripe session:', session);
    
    if (!session) {
      throw new Error('No session found');
    }
    
    // Find the pending payment
    const pendingPayment = await Payment.findOne({ 
      stripeSessionId: session_id,
      status: 'Pending'
    });
    
    if (!pendingPayment) {
      throw new Error('No pending payment found for this session');
    }
    
    console.log('Found pending payment:', pendingPayment);
    
    // Update payment status based on Stripe session
    if (session.payment_status === 'paid') {
      console.log('Payment is paid, updating status to Completed');
      pendingPayment.status = 'Completed';
      pendingPayment.paymentDate = new Date();
      await pendingPayment.save();
      
      // If this is a membership payment, activate the membership
      if (pendingPayment.type === 'Membership' && pendingPayment.membershipId) {
        console.log('Activating membership:', pendingPayment.membershipId);
        
        try {
          // First expire any existing active memberships
          await Membership.updateMany(
            { userId: pendingPayment.userId, status: 'Active' },
            { status: 'Expired' }
          );
          
          // Then activate the new membership
          const membership = await Membership.findById(pendingPayment.membershipId);
          if (membership) {
            membership.status = 'Active';
            membership.startDate = new Date();
            membership.endDate = new Date();
            membership.endDate.setMonth(membership.endDate.getMonth() + 1); // Add one month
            await membership.save();
            
            console.log('Successfully activated membership:', membership);
            
            return res.status(200).json({
              message: 'Payment completed and membership activated',
              payment: pendingPayment,
              membership: membership
            });
          }
        } catch (membershipError) {
          console.error('Error activating membership:', membershipError);
          // Still return success for payment but include error
          return res.status(200).json({
            message: 'Payment completed but membership activation failed',
            payment: pendingPayment,
            membershipError: membershipError.message
          });
        }
      }
      
      // For non-membership payments or if membership update failed
      return res.status(200).json({
        message: 'Payment completed successfully',
        payment: pendingPayment
      });
    } else {
      console.log('Payment is not paid, status:', session.payment_status);
      return res.status(400).json({
        message: 'Payment not completed',
        status: session.payment_status
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Get payments for a specific user
const getUserPayments = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .populate('membershipId', 'name description');
    
    // Always return an array of payments, even if empty
    res.status(200).json({ 
      message: payments.length ? 'User payment records retrieved successfully' : 'No payment records found',
      payments: payments || []
    });
  } catch (error) {
    console.error('Error retrieving user payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      payments: []
    });
  }
};

// Get payments for a specific trainer
const getTrainerPayments = async (req, res) => {
  const { trainerId } = req.params;
  
  try {
    const payments = await Payment.find({ trainerId })
      .sort({ createdAt: -1 });
    
    if (!payments.length) {
      return res.status(200).json({ message: 'No payment records found', payments: [] });
    }
    
    res.status(200).json({ 
      message: 'Trainer payment records retrieved successfully',
      payments
    });
  } catch (error) {
    console.error('Error retrieving trainer payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all payments (admin only)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('membershipId', 'name description');
    
    res.status(200).json({ 
      message: 'All payment records retrieved successfully',
      payments
    });
  } catch (error) {
    console.error('Error retrieving all payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;
  
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.status(200).json({ 
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      message: 'Failed to update payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('Received webhook event:', event.type);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Extract metadata
        const { userId, membershipId, planType, paymentId, bookingId, type } = session.metadata || {};
        
        console.log('Webhook metadata - userId:', userId, 'membershipId:', membershipId, 'paymentId:', paymentId, 'bookingId:', bookingId, 'type:', type);
        
        try {
          // Update or create payment
          let payment;
          
          // First try to find by paymentId if provided
          if (paymentId) {
            payment = await Payment.findById(paymentId);
            if (payment) {
              console.log('Found payment by ID:', payment);
            }
          }
          
          // If not found by ID, try to find by stripeSessionId
          if (!payment) {
            payment = await Payment.findOne({ stripeSessionId: session.id });
            if (payment) {
              console.log('Found payment by stripeSessionId:', payment);
            }
          }
          
          if (!payment) {
            console.log('No payment found, creating a new one');
            
            // Handle based on payment type
            if (type === 'SpaService' && bookingId) {
              // Import the SpaBooking model dynamically to avoid circular dependencies
              const { SpaBooking } = require('../models/Spa');
              const booking = await SpaBooking.findById(bookingId);
              
              if (booking) {
                console.log('Found SPA booking for webhook payment:', booking);
                
                // Create new payment for SPA service
                payment = new Payment({
                  userId,
                  bookingId,
                  amount: booking.price || 50, // Default to 50 if price not set
                  type: 'SpaService',
                  status: 'Completed',
                  stripeSessionId: session.id,
                  transactionId: session.payment_intent,
                  description: 'SPA Service Booking',
                  paymentDate: new Date()
                });
                
                await payment.save();
                console.log('Created new SPA payment via webhook:', payment);
                
                // Update the booking status to Confirmed
                booking.status = 'Confirmed';
                booking.paymentId = payment._id;
                await booking.save();
                console.log('SPA booking automatically confirmed via webhook:', booking._id.toString());
                
                // Send notification to admin about the new confirmed booking
                try {
                  const Notification = require('../models/Notification');
                  const adminUsers = await User.find({ role: 'admin' });
                  
                  if (adminUsers && adminUsers.length > 0) {
                    // Create notifications for all admin users
                    const notifications = adminUsers.map(admin => ({
                      recipientId: admin._id,
                      type: 'SpaBookingConfirmed',
                      title: 'New SPA Booking Confirmed',
                      message: `A new SPA booking has been confirmed with payment ID: ${payment._id}`,
                      relatedId: booking._id,
                      isRead: false
                    }));
                    
                    await Notification.insertMany(notifications);
                    console.log('Webhook: Notifications sent to admins about confirmed SPA booking');
                  }
                } catch (notificationError) {
                  console.error('Webhook: Error sending notifications to admins:', notificationError);
                  // Continue execution even if notification fails
                }
              } else {
                console.error('SPA booking not found for webhook payment:', bookingId);
              }
            } else if (type === 'Membership' || membershipId) {
              // Get membership details if membershipId is provided
              let membershipDetails = null;
              if (membershipId) {
                const membership = await Membership.findById(membershipId);
                if (membership) {
                  membershipDetails = membership;
                } else {
                  console.error('Membership not found:', membershipId);
                }
              }
              
              // Create new payment for membership
              payment = new Payment({
                userId,
                membershipId,
                amount: membershipDetails?.price || 0,
                type: 'Membership',
                status: 'Completed',
                stripeSessionId: session.id,
                transactionId: session.payment_intent,
                planType: membershipDetails?.planType || planType,
                paymentDate: new Date()
              });
              
              await payment.save();
              console.log('Created new membership payment via webhook:', payment);
              
              // Handle membership activation
              if (membershipId) {
                // First, set all existing active memberships for this user to expired
                await Membership.updateMany(
                  { userId, status: 'Active' },
                  { status: 'Expired' }
                );
                console.log('Set all existing active memberships to expired via webhook');
                
                // Then activate the new membership
                const updatedMembership = await Membership.findByIdAndUpdate(
                  membershipId,
                  { 
                    status: 'Active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                  },
                  { new: true, runValidators: true }
                );
                
                if (!updatedMembership) {
                  console.error('Failed to update membership via webhook');
                } else {
                  console.log('Activated membership via webhook:', updatedMembership);
                }
              }
            } else {
              console.error('Webhook: Unknown payment type or missing required IDs');
            }
          } else {
            // Update existing payment
            payment.status = 'Completed';
            payment.transactionId = session.payment_intent;
            payment.paymentDate = new Date();
            await payment.save();
            console.log('Updated payment via webhook:', payment);
            
            // Handle SPA booking if this is a SPA payment
            if (payment.type === 'SpaService' && payment.bookingId) {
              const { SpaBooking } = require('../models/Spa');
              const booking = await SpaBooking.findById(payment.bookingId);
              
              if (booking && booking.status === 'Pending') {
                booking.status = 'Confirmed';
                await booking.save();
                console.log('SPA booking automatically confirmed via webhook:', booking._id.toString());
                
                // Send notification to admin
                try {
                  const Notification = require('../models/Notification');
                  const adminUsers = await User.find({ role: 'admin' });
                  
                  if (adminUsers && adminUsers.length > 0) {
                    const notifications = adminUsers.map(admin => ({
                      recipientId: admin._id,
                      type: 'SpaBookingConfirmed',
                      title: 'New SPA Booking Confirmed',
                      message: `A new SPA booking has been confirmed with payment ID: ${payment._id}`,
                      relatedId: booking._id,
                      isRead: false
                    }));
                    
                    await Notification.insertMany(notifications);
                    console.log('Webhook: Notifications sent to admins about confirmed SPA booking');
                  }
                } catch (notificationError) {
                  console.error('Webhook: Error sending notifications to admins:', notificationError);
                }
              }
            } else if (payment.type === 'Membership' && payment.membershipId) {
              // Handle membership activation
              // First, set all existing active memberships for this user to expired
              await Membership.updateMany(
                { userId: payment.userId, status: 'Active', _id: { $ne: payment.membershipId } },
                { status: 'Expired' }
              );
              console.log('Set all existing active memberships to expired via webhook');
              
              // Then activate the new membership
              const updatedMembership = await Membership.findByIdAndUpdate(
                payment.membershipId,
                { 
                  status: 'Active',
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                },
                { new: true, runValidators: true }
              );
              
              if (!updatedMembership) {
                console.error('Failed to update membership via webhook');
              } else {
                console.log('Activated membership via webhook:', updatedMembership);
              }
            }
          }
        } catch (error) {
          console.error('Error processing webhook payment:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createPendingPayment = async (req, res) => {
  try {
    const { amount, type, membershipId, userId, planType, bookingId, description } = req.body;

    console.log('Creating pending payment with data:', req.body);
    
    // Validate required fields
    if (!type || !userId) {
      console.error('Missing required payment fields:', { type, userId });
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Set default amount for SPA services if missing or invalid
    let paymentAmount = amount;
    if (type === 'SpaService' && (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0)) {
      console.log('Using default amount (499) for SPA service payment');
      paymentAmount = 499;
    } else if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      console.error('Invalid amount value:', amount);
      return res.status(400).json({ message: 'Invalid amount value' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for SPA booking if type is SpaService and bookingId is provided
    if (type === 'SpaService' && bookingId) {
      // Import the SpaBooking model dynamically to avoid circular dependencies
      const { SpaBooking } = require('../models/Spa');
      const spaBooking = await SpaBooking.findById(bookingId);
      if (!spaBooking) {
        console.error(`SPA booking with ID ${bookingId} not found`);
        return res.status(404).json({ message: 'SPA booking not found' });
      } else {
        console.log('Found SPA booking for pending payment:', spaBooking);
      }
    }

    // Generate a unique temporary ID for stripeSessionId to avoid null value issues
    const tempSessionId = 'pending-' + crypto.randomBytes(16).toString('hex');
    console.log('Generated temporary session ID:', tempSessionId);

    // Create a new payment record
    const payment = new Payment({
      userId,
      amount: paymentAmount,
      type,
      status: 'Pending',
      membershipId: type === 'Membership' ? membershipId : null,
      bookingId: type === 'SpaService' ? bookingId : null,
      planType: planType || null,
      description: description || null,
      stripeSessionId: tempSessionId // Set a unique temporary ID
    });

    await payment.save();
    console.log('Created pending payment record:', payment);
    
    // Return the payment record
    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating pending payment:', error);
    return res.status(500).json({ 
      message: 'Server error creating pending payment', 
      error: error.message 
    });
  }
};

// Export functions
module.exports = {
  createPayment,
  createPendingPayment,
  sendPaymentOTP,
  verifyPaymentOTP,
  verifyStripeSession,
  getUserPayments,
  getTrainerPayments,
  getAllPayments,
  updatePaymentStatus,
  handleStripeWebhook
};

