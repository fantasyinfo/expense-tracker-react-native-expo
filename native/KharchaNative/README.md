# KharchaNative

KharchaNative is a modern, lightweight, and powerful expense tracker built with React Native and Expo. Designed for global usability, it supports multiple languages, custom currencies, and now features an **AI-powered OCR Receipt Scanner** and a **Subscription Management System**.

## 🚀 Features

- **AI OCR Receipt Scanner** (NEW): Instantly extract amount, date, and merchant from receipts.
- **Subscription Tracker** (NEW): Manage recurring bills and auto-generate transaction entries.
- **Multi-language Support**: Seamless switching between English and Hindi.
- **Custom Currency**: Support for any currency symbol and name (USD, EUR, INR, etc.).
- **Global Payment Methods**: Customizable digital payment labels (UPI, Card, Zelle, etc.).
- **Analytics**: Detailed breakdown of spending by category and payment method.
- **Data Export**: Export your data to CSV, JSON, or PDF for external record-keeping.
- **Backup & Restore**: Securely backup your data locally and restore when needed.
- **Savings Goals & Expense Limits**: Set and track financial targets.

## 🛠 Tech Stack

- **React Native** (v0.7x)
- **Vector Icons** (Ionicons)
- **Context API** for state management (Theme, Language, Currency, Preferences)
- **AsyncStorage** for local persistence
- **React Navigation** for fluid transitions

## 🌍 Internationalization (i18n)

KharchaNative is built from the ground up for internationalization. 
- All strings are externalized in `src/i18n/locales/`.
- Dynamic labels support parameters (e.g., `{{label}} Balance`).
- Regional preferences like date formats and currency symbols are fully customizable.

## ⚙️ Customization

You can customize the following in the **Settings** screen:
- **Language**: Choose between supported languages.
- **Currency**: Define your preferred currency symbol.
- **Digital Payment Label**: Define what "Digital" payment means in your region (e.g., set it to "UPI" in India, "Pix" in Brazil, or "Card" globally).
- **Initial Balances**: Set your starting bank and cash balances.

## 🌍 Global Vision & Roadmap

KharchaNative is evolving from an India-centric tracker to a universal financial companion. Here is how we address global differences:

### 🗺 Regional Insights
- **India**: Optimization for high-frequency UPI transactions and informal lending.
- **USA & Europe**: Focus on **Subscription Management** and Credit Card tracking.
- **Japan**: Precision tools for **Cash & IC Card** (Suica/Pasmo) users.
- **UAE & Middle East**: Support for **RTL (Right-to-Left)** layouts and multi-currency remittances.

### 🚀 Upcoming Features
1.  **Recurring Expenses**: Automate tracking for monthly subscriptions (Netflix, Rent, Gym).
2.  **RTL Support**: Full UI mirroring for Arabic and Hebrew languages.
3.  **Locale-Aware Formatting**: Auto-switching date (MM/DD vs DD/MM) and number formats.
4.  **Smart OCR**: Scan receipts to auto-populate entries.
5.  **Multi-User Sync**: Securely share ledgers with family members.

## 💻 Development

### Prerequisites
- Node.js (v18+)
- React Native Development Environment ([Setup Guide](https://reactnative.dev/docs/environment-setup))

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```

## 📄 License
This project is licensed under the MIT License.
