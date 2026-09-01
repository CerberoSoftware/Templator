import type { EmailDoc } from '../builder/model'

// Arctic colour palette
const P = '#2b7fe0'   // primary blue
const DARK = '#1a4f99' // darker blue for headings
const BG = '#f4f8fc'  // outer ice background
const WHITE = '#ffffff'
const INK = '#1a2a3a'  // dark ink
const MUTED = '#5c7793' // muted text
const DIVIDE = '#dce8f5' // divider colour
const FONT = 'Arial, Helvetica, sans-serif'

function id() {
  return `b-${Math.random().toString(36).slice(2, 10)}`
}

export interface QuickstartTemplate {
  id: string
  name: string
  description: string
  category: string
  doc: EmailDoc
}

// ─── 1. Welcome Email ────────────────────────────────────────────────────────
const welcome: QuickstartTemplate = {
  id: 'qs-welcome',
  name: 'Welcome Email',
  description: 'Onboard new users with a warm greeting and a single CTA.',
  category: 'Transactional',
  doc: {
    settings: { subject: 'Welcome aboard!', preheader: 'We\'re so glad you joined us.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: '', taglineColor: WHITE, taglineSize: 14, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Welcome to the team! 🎉', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 32, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: "Hi there,\n\nWe're thrilled to have you on board. Your account is ready and you can start exploring right away. If you ever need help, our support team is here for you.", fontSize: 16, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Get Started', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 200, height: 48, fontSize: 16, fontFamily: FONT, align: 'center', paddingY: 24, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 16, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 2. Monthly Newsletter ────────────────────────────────────────────────────
const newsletter: QuickstartTemplate = {
  id: 'qs-newsletter',
  name: 'Monthly Newsletter',
  description: 'A multi-section newsletter with heading, articles and a footer.',
  category: 'Newsletter',
  doc: {
    settings: { subject: 'Your monthly update', preheader: 'Here\'s what happened this month.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: 'Monthly Update', taglineColor: WHITE, taglineSize: 13, bgColor: DARK, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'What\'s new this month', level: 1, color: DARK, align: 'left', fontFamily: FONT, paddingY: 24, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: "Here's a round-up of our latest news, updates, and highlights from the past month. Scroll down to catch up on everything you may have missed.", fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Feature Spotlight', level: 2, color: DARK, align: 'left', fontFamily: FONT, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We launched a brand-new dashboard this month. The redesigned interface makes it faster to find what you need, with smarter search and personalised shortcuts.', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Read More', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 160, height: 44, fontSize: 15, fontFamily: FONT, align: 'left', paddingY: 16, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 3. Password Reset ────────────────────────────────────────────────────────
const passwordReset: QuickstartTemplate = {
  id: 'qs-password-reset',
  name: 'Password Reset',
  description: 'Simple, focused password reset email with expiry notice.',
  category: 'Transactional',
  doc: {
    settings: { subject: 'Reset your password', preheader: 'We received a request to reset your password.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: '', taglineColor: WHITE, taglineSize: 14, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'spacer', props: { height: 24, bg: 'transparent', blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Reset your password', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in 24 hours.', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 8, paddingX: 40, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Reset Password', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 220, height: 48, fontSize: 16, fontFamily: FONT, align: 'center', paddingY: 24, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: "If you didn't request this, you can safely ignore this email. Your password won't change.", fontSize: 13, lineHeight: 1.6, fontFamily: FONT, color: MUTED, align: 'center', linkColor: P, paddingY: 8, paddingX: 40, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'spacer', props: { height: 16, bg: 'transparent', blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 4. Product Launch ────────────────────────────────────────────────────────
const productLaunch: QuickstartTemplate = {
  id: 'qs-product-launch',
  name: 'Product Launch',
  description: 'Announce a new product with hero text, image and CTA.',
  category: 'Marketing',
  doc: {
    settings: { subject: 'Introducing our latest product', preheader: 'Something new is here — and it\'s built for you.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: 'New Arrival', taglineColor: WHITE, taglineSize: 12, bgColor: DARK, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'image', props: { src: '', alt: 'Product image', width: 600, align: 'center', link: '', paddingY: 0, paddingX: 0, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Meet [Product Name]', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We\'ve been working hard on something special, and today it\'s finally here. [Product Name] is designed to save you time, reduce friction and help you do your best work.', fontSize: 16, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Discover More', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 200, height: 48, fontSize: 16, fontFamily: FONT, align: 'center', paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 5. Order Confirmation ────────────────────────────────────────────────────
const orderConfirmation: QuickstartTemplate = {
  id: 'qs-order-confirm',
  name: 'Order Confirmation',
  description: 'Confirm a purchase with order summary and next-steps.',
  category: 'Transactional',
  doc: {
    settings: { subject: 'Your order is confirmed ✓', preheader: 'Thanks for your order. Here are the details.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: '', taglineColor: WHITE, taglineSize: 14, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Order confirmed! 🎊', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'Thank you for your purchase. We\'re preparing your order and will send you a shipping notification as soon as it\'s on its way.', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Order Summary', level: 2, color: DARK, align: 'left', fontFamily: FONT, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: '**Order #00000** · Placed on 1 Jan 2026\n\n[Item Name] × 1 — £00.00\n\n**Total: £00.00**', fontSize: 15, lineHeight: 1.8, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'View Order', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 180, height: 44, fontSize: 15, fontFamily: FONT, align: 'left', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 8, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 6. Event Invitation ──────────────────────────────────────────────────────
const eventInvite: QuickstartTemplate = {
  id: 'qs-event-invite',
  name: 'Event Invitation',
  description: 'Invite recipients to an event with date, details and RSVP.',
  category: 'Marketing',
  doc: {
    settings: { subject: 'You\'re invited!', preheader: 'Join us for a special event.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: 'You\'re Invited', taglineColor: WHITE, taglineSize: 13, bgColor: DARK, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: '[Event Name]', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: '📅 **Date:** Saturday, 1 January 2026\n📍 **Location:** 123 Example Street, London\n⏰ **Time:** 6:00 PM — 10:00 PM', fontSize: 15, lineHeight: 1.9, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 16, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We\'d love to see you there. Join us for an evening of [brief description of event]. Light refreshments will be provided.', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'RSVP Now', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 180, height: 48, fontSize: 16, fontFamily: FONT, align: 'center', paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 7. Promotional Offer ─────────────────────────────────────────────────────
const promo: QuickstartTemplate = {
  id: 'qs-promo',
  name: 'Promotional Offer',
  description: 'Discount or special offer email with bold hero and urgency copy.',
  category: 'Marketing',
  doc: {
    settings: { subject: 'Exclusive offer just for you 🎁', preheader: 'Don\'t miss out — limited time only.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: 'Limited Time Offer', taglineColor: WHITE, taglineSize: 12, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: '20% off everything', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 32, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'For this week only, enjoy 20% off your entire order. Use code **ARCTIC20** at checkout. Offer ends Sunday at midnight.', fontSize: 16, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Shop Now', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 200, height: 52, fontSize: 17, fontFamily: FONT, align: 'center', paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'Terms and conditions apply. Offer valid on full-price items only.', fontSize: 12, lineHeight: 1.5, fontFamily: FONT, color: MUTED, align: 'center', linkColor: P, paddingY: 4, paddingX: 40, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 12, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 8. Account Notification ──────────────────────────────────────────────────
const notification: QuickstartTemplate = {
  id: 'qs-notification',
  name: 'Account Notification',
  description: 'Alert users to an important change or activity on their account.',
  category: 'Transactional',
  doc: {
    settings: { subject: 'Important account notice', preheader: 'Action may be required on your account.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: '', taglineColor: WHITE, taglineSize: 14, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Account Notice', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We noticed some activity on your account that you should be aware of. Here are the details:', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: '**Action:** [Description of activity]\n**Date:** 1 January 2026, 12:00 PM\n**IP Address:** 000.000.000.000', fontSize: 14, lineHeight: 1.9, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 12, paddingX: 32, blockBg: BG, blockRadius: 8 } },
      { id: id(), type: 'text', props: { content: 'If this was you, no action is needed. If you don\'t recognise this activity, please secure your account immediately.', fontSize: 15, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 16, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Review Activity', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 200, height: 44, fontSize: 15, fontFamily: FONT, align: 'left', paddingY: 4, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'spacer', props: { height: 20, bg: 'transparent', blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 9. Re-engagement ─────────────────────────────────────────────────────────
const reEngage: QuickstartTemplate = {
  id: 'qs-re-engage',
  name: 'Re-engagement',
  description: 'Win back inactive subscribers with a friendly nudge.',
  category: 'Marketing',
  doc: {
    settings: { subject: 'We miss you 💙', preheader: 'It\'s been a while — come back and see what\'s new.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: '', taglineColor: WHITE, taglineSize: 14, bgColor: DARK, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'We miss you 💙', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: "It's been a while since we last saw you, and we wanted to check in. A lot has changed since your last visit — here's what you've been missing:", fontSize: 16, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: '✨ New features you\'ll love\n📊 Improved reports and insights\n🤝 A community ready to welcome you back', fontSize: 15, lineHeight: 2, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'button', props: { label: 'Come Back', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 180, height: 48, fontSize: 16, fontFamily: FONT, align: 'center', paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

// ─── 10. Team Announcement ────────────────────────────────────────────────────
const announcement: QuickstartTemplate = {
  id: 'qs-announcement',
  name: 'Team Announcement',
  description: 'Internal or external announcement with two-column layout.',
  category: 'Internal',
  doc: {
    settings: { subject: 'An important announcement', preheader: 'We have some exciting news to share.', contentWidth: 600, bodyBg: BG, containerBg: WHITE, fontFamily: FONT, textColor: INK, linkColor: P },
    blocks: [
      { id: id(), type: 'header', props: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, logoLink: '', tagline: 'Announcement', taglineColor: WHITE, taglineSize: 12, bgColor: P, align: 'center', paddingY: 24, paddingX: 24, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'heading', props: { text: 'Big news from [Company]', level: 1, color: DARK, align: 'center', fontFamily: FONT, paddingY: 28, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'text', props: { content: 'We\'re excited to share some important news with you. After months of hard work and planning, we\'re ready to announce [the news].', fontSize: 16, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'center', linkColor: P, paddingY: 0, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'divider', props: { color: DIVIDE, thickness: 1, paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      {
        id: id(), type: 'twocol',
        props: { ratio: '50-50', gap: 16, paddingY: 0, paddingX: 24, blockBg: 'transparent', blockRadius: 0 },
        columns: [
          [
            { id: id(), type: 'heading', props: { text: 'What this means', level: 3, color: DARK, align: 'left', fontFamily: FONT, paddingY: 8, paddingX: 8, blockBg: 'transparent', blockRadius: 0 } },
            { id: id(), type: 'text', props: { content: 'This change will help us serve you better and grow in the direction we all believe in.', fontSize: 14, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 4, paddingX: 8, blockBg: 'transparent', blockRadius: 0 } },
          ],
          [
            { id: id(), type: 'heading', props: { text: 'What happens next', level: 3, color: DARK, align: 'left', fontFamily: FONT, paddingY: 8, paddingX: 8, blockBg: 'transparent', blockRadius: 0 } },
            { id: id(), type: 'text', props: { content: 'We\'ll be in touch with more details over the coming weeks. In the meantime, feel free to reach out with any questions.', fontSize: 14, lineHeight: 1.7, fontFamily: FONT, color: INK, align: 'left', linkColor: P, paddingY: 4, paddingX: 8, blockBg: 'transparent', blockRadius: 0 } },
          ],
        ],
      },
      { id: id(), type: 'button', props: { label: 'Learn More', href: '#', bgColor: P, textColor: WHITE, radius: 8, fullWidth: false, width: 180, height: 44, fontSize: 15, fontFamily: FONT, align: 'center', paddingY: 24, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
      { id: id(), type: 'footer', props: { content: '© 2026 Your Company · <a href="#">Unsubscribe</a>', fontSize: 12, fontFamily: FONT, color: MUTED, align: 'center', bgColor: 'transparent', paddingY: 20, paddingX: 32, blockBg: 'transparent', blockRadius: 0 } },
    ],
  },
}

export const QUICKSTART_TEMPLATES: QuickstartTemplate[] = [
  welcome,
  newsletter,
  passwordReset,
  productLaunch,
  orderConfirmation,
  eventInvite,
  promo,
  notification,
  reEngage,
  announcement,
]

export const QUICKSTART_CATEGORIES = [...new Set(QUICKSTART_TEMPLATES.map((t) => t.category))]
