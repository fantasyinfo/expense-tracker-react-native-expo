# KharchaNative

KharchaNative is a modern, lightweight, and powerful expense tracker built with React Native and Expo. Designed for global usability, it supports multiple languages, custom currencies, and flexible payment method labels.

## 🚀 Features

- **Multi-language Support**: Seamless switching between English and Hindi, with architecture ready for more languages.
- **Custom Currency**: Support for any currency symbol and name (USD, EUR, INR, etc.).
- **Global Payment Methods**: Generalize "UPI" to "Digital" or any label of your choice (Card, Bank, Pix, Zelle, etc.).
- **Smart Tracking**: Categorize expenses and income with an intuitive UI.
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
