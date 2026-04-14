const emailTemplates = {
  welcomeEmail: (name, email) => ({
    subject: "Welcome to Our Platform 🎉",
    text: `Hi ${name}, your account is ready. Start exploring now!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome</title>
      </head>

      <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:20px;">
          <tr>
            <td align="center">
              
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
                
                <!-- HEADER -->
                <tr>
                  <td style="background:#4F46E5; padding:30px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0;">Welcome 🎉</h1>
                    <p style="color:#e0e7ff; margin:5px 0 0;">Your account is ready</p>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:30px;">
                    
                    <h2 style="margin:0 0 10px;">Hi ${name},</h2>
                    
                    <p style="color:#555; line-height:1.6;">
                      We're excited to have you on board! Your account has been successfully created.
                    </p>

                    <!-- FEATURES -->
                    <ul style="color:#555; line-height:1.8; padding-left:20px;">
                      <li>Explore premium plans</li>
                      <li>Manage subscriptions</li>
                      <li>Track your activity</li>
                      <li>Get personalized features</li>
                    </ul>

                    <!-- CTA -->
                    <div style="text-align:center; margin:30px 0;">
                      <a href="http://localhost:5173"
                        style="background:#4F46E5; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold;">
                        Go to Dashboard
                      </a>
                    </div>

                    <p style="color:#777; font-size:14px;">
                      If you have any questions, feel free to reply to this email.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#888;">
                    © 2026 Your Company <br/>
                    <a href="#" style="color:#4F46E5; text-decoration:none;">Privacy</a> | 
                    <a href="#" style="color:#4F46E5; text-decoration:none;">Support</a>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `
  })
};

module.exports = emailTemplates;