/**
 * @fileoverview Twilio Service for SMS OTP
 *
 * Handles SMS sending via Twilio for OTP authentication
 *
 * @module services/twilio
 */

const twilio = require('twilio');
const { config } = require('../../../shared/config');
const logger = require('../../../shared/utils/logger');

// Initialize Twilio client
const client = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

/**
 * Twilio Service for OTP operations
 */
class TwilioService {
  /**
   * Generate 6-digit OTP
   * @returns {string} 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via SMS
   * @param {string} phone - Phone number with country code (E.164 format)
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - Twilio response
   */
  static async sendOTP(phone, otp) {
    try {
      const message = `Your FoundingCircle verification code is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes. Do not share this code with anyone.`;

      const response = await client.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: phone,
      });

      logger.info(`OTP sent to ${phone}`, { messageId: response.sid });
      return response;
    } catch (error) {
      logger.error('Error sending OTP via Twilio:', error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param {string} phone - Phone number
   * @returns {boolean}
   */
  static validatePhoneNumber(phone) {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format phone number to E.164 format
   * Supports Indian (+91), US (+1), and UAE (+971) numbers
   * @param {string} phone - Phone number
   * @param {string} [countryCode='91'] - Default country code (India)
   * @returns {string} - Formatted phone number
   */
  static formatPhoneNumber(phone, countryCode = '91') {
    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If already in E.164 format, return as is
    if (cleaned.startsWith('+') && cleaned.length >= 10) {
      return cleaned;
    }

    // Remove leading + if present for processing
    cleaned = cleaned.replace(/^\+/, '');

    // If starts with 0, remove it (common in local formats)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If it's a 10-digit number without country code, add the default
    if (cleaned.length === 10 && !cleaned.startsWith('91') && !cleaned.startsWith('1') && !cleaned.startsWith('971')) {
      cleaned = countryCode + cleaned;
    }

    // If starts with country code but no +, check and format
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('971') && cleaned.length >= 12) {
      return '+' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Get country code from phone number
   * @param {string} phone - Phone number in E.164 format
   * @returns {string|null} - Country code or null
   */
  static getCountryCode(phone) {
    if (!phone.startsWith('+')) return null;

    // Check common country codes
    if (phone.startsWith('+91')) return '91';  // India
    if (phone.startsWith('+1')) return '1';    // US/Canada
    if (phone.startsWith('+971')) return '971'; // UAE
    if (phone.startsWith('+44')) return '44';  // UK

    return null;
  }
}

module.exports = TwilioService;
