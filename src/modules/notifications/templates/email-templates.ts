/**
 * Email Templates for VMP Booking System
 * 
 * Templates for:
 * - New booking notification (to admin)
 * - Booking confirmed (to customer)
 * - Driver assigned (to driver)
 * - Booking updated (to driver)
 */

export interface BookingEmailData {
  bookingId: string;
  bookingUrl?: string;
  driverLink?: string;
  // Passenger info
  passengerName: string;
  passengerEmail?: string;
  passengerPhone: string;
  // Trip details
  originName: string;
  destinationName: string;
  pickupAt: string; // Formatted date string
  flightNumber?: string;
  passengers: number;
  luggage: number;
  // Vehicle
  vehicleClass: string;
  vehicleName?: string;
  // Pricing
  total: number;
  currency: string;
  // Driver info (if assigned)
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  // Notes
  notes?: string;
  signText?: string;
}

/**
 * Base email layout wrapper
 */
function baseLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px 25px;
    }
    .booking-id {
      background: #e3f2fd;
      border-left: 4px solid #1e88e5;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .booking-id strong {
      color: #1e88e5;
      font-size: 18px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e88e5;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e3f2fd;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 500;
      color: #666;
      width: 140px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #333;
      flex: 1;
    }
    .highlight {
      background: #fff3e0;
      border: 1px solid #ff9800;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .highlight.success {
      background: #e8f5e9;
      border-color: #4caf50;
    }
    .highlight.info {
      background: #e3f2fd;
      border-color: #1e88e5;
    }
    .price-box {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .price-amount {
      font-size: 32px;
      font-weight: 700;
      color: #1e88e5;
    }
    .price-currency {
      font-size: 16px;
      color: #666;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 10px 0;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #1e88e5;
      text-decoration: none;
    }
    .route-box {
      background: #fafafa;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
    }
    .route-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .route-item:last-child {
      margin-bottom: 0;
    }
    .route-icon {
      width: 36px;
      height: 36px;
      background: #1e88e5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      color: white;
      font-weight: bold;
      flex-shrink: 0;
    }
    .route-icon.destination {
      background: #4caf50;
    }
    .route-text {
      flex: 1;
    }
    .route-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .route-value {
      font-size: 15px;
      color: #333;
      font-weight: 500;
      margin-top: 3px;
    }
    .arrow-down {
      margin-left: 18px;
      color: #ccc;
      font-size: 20px;
      padding: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-label {
        width: 100%;
        margin-bottom: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} Visit Mauritius Paradise. All rights reserved.</p>
      <p>
        <a href="https://visitmauritiusparadise.com">www.visitmauritiusparadise.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Format date for email display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Indian/Mauritius',
  });
}

/**
 * New Booking Email - Sent to Admin when a booking is confirmed/paid
 */
export function newBookingAdminTemplate(data: BookingEmailData): string {
  const content = `
    <div class="header">
      <h1>🚗 New Booking Received!</h1>
      <p>A new booking has been confirmed and paid</p>
    </div>
    <div class="content">
      <div class="booking-id">
        <strong>Booking ID: ${data.bookingId}</strong>
      </div>

      <div class="section">
        <div class="section-title">📍 Trip Details</div>
        <div class="route-box">
          <div class="route-item">
            <div class="route-icon">A</div>
            <div class="route-text">
              <div class="route-label">Pickup Location</div>
              <div class="route-value">${data.originName}</div>
            </div>
          </div>
          <div class="arrow-down">↓</div>
          <div class="route-item">
            <div class="route-icon destination">B</div>
            <div class="route-text">
              <div class="route-label">Drop-off Location</div>
              <div class="route-value">${data.destinationName}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🕐 Pickup Time</div>
        <div class="highlight info">
          <strong>${data.pickupAt}</strong>
          ${data.flightNumber ? `<br/>Flight: ${data.flightNumber}` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Passenger Information</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.passengerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${data.passengerPhone}</span>
        </div>
        ${data.passengerEmail ? `
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${data.passengerEmail}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${data.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Luggage:</span>
          <span class="detail-value">${data.luggage}</span>
        </div>
        ${data.signText ? `
        <div class="detail-row">
          <span class="detail-label">Sign Text:</span>
          <span class="detail-value">${data.signText}</span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">🚘 Vehicle</div>
        <div class="detail-row">
          <span class="detail-label">Class:</span>
          <span class="detail-value">${data.vehicleClass}</span>
        </div>
        ${data.vehicleName ? `
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${data.vehicleName}</span>
        </div>
        ` : ''}
      </div>

      <div class="price-box">
        <div class="price-currency">Total Paid</div>
        <div class="price-amount">${data.currency} ${data.total.toFixed(2)}</div>
      </div>

      <div class="highlight success">
        <strong>✅ Payment Confirmed</strong>
        <p style="margin: 5px 0 0;">Please assign a driver to this booking.</p>
      </div>

      ${data.bookingUrl ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${data.bookingUrl}" class="btn">View Booking Details</a>
      </div>
      ` : ''}
    </div>
  `;

  return baseLayout(content, 'New Booking - Visit Mauritius Paradise');
}

/**
 * Booking Confirmed Email - Sent to Customer when payment is successful
 */
export function bookingConfirmedCustomerTemplate(data: BookingEmailData): string {
  const content = `
    <div class="header">
      <h1>✅ Booking Confirmed!</h1>
      <p>Thank you for booking with Visit Mauritius Paradise</p>
    </div>
    <div class="content">
      <div class="booking-id">
        <strong>Booking Reference: ${data.bookingId}</strong>
      </div>

      <div class="highlight success">
        <strong>Your booking has been confirmed!</strong>
        <p style="margin: 5px 0 0;">We will assign a driver to your trip shortly. You will receive another email with driver details once assigned.</p>
      </div>

      <div class="section">
        <div class="section-title">📍 Your Trip</div>
        <div class="route-box">
          <div class="route-item">
            <div class="route-icon">A</div>
            <div class="route-text">
              <div class="route-label">Pickup</div>
              <div class="route-value">${data.originName}</div>
            </div>
          </div>
          <div class="arrow-down">↓</div>
          <div class="route-item">
            <div class="route-icon destination">B</div>
            <div class="route-text">
              <div class="route-label">Drop-off</div>
              <div class="route-value">${data.destinationName}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🕐 Pickup Details</div>
        <div class="highlight info">
          <strong>${data.pickupAt}</strong>
          ${data.flightNumber ? `<br/>Flight Number: ${data.flightNumber}` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">🚘 Vehicle</div>
        <div class="detail-row">
          <span class="detail-label">Vehicle Type:</span>
          <span class="detail-value">${data.vehicleName || data.vehicleClass}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${data.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Luggage:</span>
          <span class="detail-value">${data.luggage}</span>
        </div>
      </div>

      <div class="price-box">
        <div class="price-currency">Amount Paid</div>
        <div class="price-amount">${data.currency} ${data.total.toFixed(2)}</div>
      </div>

      ${data.bookingUrl ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${data.bookingUrl}" class="btn">View My Booking</a>
      </div>
      ` : ''}

      <div class="section" style="margin-top: 30px;">
        <div class="section-title">📞 Need Help?</div>
        <p>If you have any questions or need to make changes to your booking, please contact us:</p>
        <p>📧 Email: info@visitmauritiusparadise.com</p>
      </div>
    </div>
  `;

  return baseLayout(content, 'Booking Confirmed - Visit Mauritius Paradise');
}

/**
 * Driver Assigned Email - Sent to Driver when assigned to a booking
 */
export function driverAssignedTemplate(data: BookingEmailData): string {
  const content = `
    <div class="header">
      <h1>🚗 New Trip Assignment</h1>
      <p>You have been assigned to a new booking</p>
    </div>
    <div class="content">
      <div class="booking-id">
        <strong>Booking ID: ${data.bookingId}</strong>
      </div>

      <div class="highlight info">
        <strong>⏰ Pickup Time</strong>
        <p style="margin: 5px 0 0; font-size: 18px;">${data.pickupAt}</p>
        ${data.flightNumber ? `<p style="margin: 5px 0 0;">Flight: <strong>${data.flightNumber}</strong></p>` : ''}
      </div>

      <div class="section">
        <div class="section-title">📍 Route</div>
        <div class="route-box">
          <div class="route-item">
            <div class="route-icon">A</div>
            <div class="route-text">
              <div class="route-label">Pickup</div>
              <div class="route-value">${data.originName}</div>
            </div>
          </div>
          <div class="arrow-down">↓</div>
          <div class="route-item">
            <div class="route-icon destination">B</div>
            <div class="route-text">
              <div class="route-label">Drop-off</div>
              <div class="route-value">${data.destinationName}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Passenger</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.passengerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${data.passengerPhone}">${data.passengerPhone}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${data.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Luggage:</span>
          <span class="detail-value">${data.luggage}</span>
        </div>
        ${data.signText ? `
        <div class="detail-row">
          <span class="detail-label">Sign Text:</span>
          <span class="detail-value"><strong>${data.signText}</strong></span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">💰 Trip Value</div>
        <div class="price-box">
          <div class="price-amount">${data.currency} ${data.total.toFixed(2)}</div>
        </div>
      </div>

      ${data.driverLink ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${data.driverLink}" class="btn">Open Trip Dashboard</a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #666; margin-top: 10px;">
        Use this link to update trip status and navigate to pickup location
      </p>
      ` : ''}
    </div>
  `;

  return baseLayout(content, 'New Trip Assignment - Visit Mauritius Paradise');
}

/**
 * Booking Updated Email - Sent to Driver when booking details are updated
 */
export function bookingUpdatedDriverTemplate(data: BookingEmailData): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);">
      <h1>⚠️ Booking Updated</h1>
      <p>Important: Trip details have been modified</p>
    </div>
    <div class="content">
      <div class="booking-id">
        <strong>Booking ID: ${data.bookingId}</strong>
      </div>

      <div class="highlight">
        <strong>📢 Attention Required!</strong>
        <p style="margin: 5px 0 0;">The details for your assigned trip have been updated. Please review the changes below.</p>
      </div>

      <div class="section">
        <div class="section-title">⏰ Updated Pickup Time</div>
        <div class="highlight info">
          <strong>${data.pickupAt}</strong>
          ${data.flightNumber ? `<br/>Flight: <strong>${data.flightNumber}</strong>` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">📍 Route</div>
        <div class="route-box">
          <div class="route-item">
            <div class="route-icon">A</div>
            <div class="route-text">
              <div class="route-label">Pickup</div>
              <div class="route-value">${data.originName}</div>
            </div>
          </div>
          <div class="arrow-down">↓</div>
          <div class="route-item">
            <div class="route-icon destination">B</div>
            <div class="route-text">
              <div class="route-label">Drop-off</div>
              <div class="route-value">${data.destinationName}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Passenger Details</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.passengerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${data.passengerPhone}">${data.passengerPhone}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">${data.passengers}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Luggage:</span>
          <span class="detail-value">${data.luggage}</span>
        </div>
        ${data.signText ? `
        <div class="detail-row">
          <span class="detail-label">Sign Text:</span>
          <span class="detail-value"><strong>${data.signText}</strong></span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      ${data.driverLink ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${data.driverLink}" class="btn">View Updated Trip</a>
      </div>
      ` : ''}

      <div class="section" style="margin-top: 30px;">
        <p style="text-align: center; color: #666;">
          If you have any questions about these changes, please contact the dispatch team.
        </p>
      </div>
    </div>
  `;

  return baseLayout(content, 'Booking Updated - Visit Mauritius Paradise');
}

/**
 * Driver Assignment Email - Sent to Customer when driver is assigned
 */
export function driverAssignedCustomerTemplate(data: BookingEmailData): string {
  const content = `
    <div class="header">
      <h1>🚗 Driver Assigned!</h1>
      <p>Your driver details for your upcoming trip</p>
    </div>
    <div class="content">
      <div class="booking-id">
        <strong>Booking Reference: ${data.bookingId}</strong>
      </div>

      <div class="highlight success">
        <strong>✅ A driver has been assigned to your booking!</strong>
      </div>

      ${data.driverName ? `
      <div class="section">
        <div class="section-title">👨‍✈️ Your Driver</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.driverName}</span>
        </div>
        ${data.driverPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">⏰ Pickup Details</div>
        <div class="highlight info">
          <strong>${data.pickupAt}</strong>
          ${data.flightNumber ? `<br/>Flight: ${data.flightNumber}` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">📍 Your Trip</div>
        <div class="route-box">
          <div class="route-item">
            <div class="route-icon">A</div>
            <div class="route-text">
              <div class="route-label">Pickup</div>
              <div class="route-value">${data.originName}</div>
            </div>
          </div>
          <div class="arrow-down">↓</div>
          <div class="route-item">
            <div class="route-icon destination">B</div>
            <div class="route-text">
              <div class="route-label">Drop-off</div>
              <div class="route-value">${data.destinationName}</div>
            </div>
          </div>
        </div>
      </div>

      ${data.bookingUrl ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${data.bookingUrl}" class="btn">Track My Booking</a>
      </div>
      ` : ''}

      <div class="section" style="margin-top: 30px;">
        <div class="section-title">📞 Need Help?</div>
        <p>If you have any questions, please contact us:</p>
        <p>📧 Email: info@visitmauritiusparadise.com</p>
      </div>
    </div>
  `;

  return baseLayout(content, 'Driver Assigned - Visit Mauritius Paradise');
}

