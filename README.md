# Scrum Time Management

A comprehensive daily scrum time management application designed to help teams efficiently organize speaking time during meetings.

## Features

- **Participant Management**: Add participants with allocated speaking time
- **Interactive Spin Wheel**: Randomly select speakers for fair participation
- **Real-time Timer**: Track speaking time with visual feedback and overtime alerts
- **Meeting History**: View detailed statistics and summaries of past meetings
- **Multi-language Support**: Available in French and English with persistent language switching
- **Import/Export**: Save and restore meeting data as JSON files
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started

This is a [Next.js](https://nextjs.org) project built with TypeScript and Tailwind CSS.

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ken-raf/scrum-time-management.git
cd scrum-time-management
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Icons**: Lucide React
- **Animation**: Framer Motion

## Usage

1. **Add Participants**: Use the participant form to add team members with their allocated speaking time
2. **Start Meeting**: Click "Start Meeting" to begin the session
3. **Spin the Wheel**: Use "Who's turn?" to randomly select the next speaker
4. **Track Time**: Monitor speaking time with the built-in timer and overtime alerts
5. **End Meeting**: Finish the meeting to save it to history with detailed statistics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
