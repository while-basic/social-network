# AI Social Network

A mobile web application for sharing AI-generated images with a global community.

## Features

- User authentication with Supabase
- AI image generation
- Global feed of AI-generated images
- Mobile-first design
- Bottom navigation for easy access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project at https://supabase.com

4. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

- React + TypeScript
- Vite
- Supabase (Authentication & Database)
- Tailwind CSS
- React Router
- React Icons
- Replicate (AI Image Generation)

## Development

The application is structured as follows:

- `/src/components` - React components
- `/src/lib` - Utility functions and configurations
- `/src/assets` - Static assets

## License

MIT
