# TFTPad - TFT Note Taker

A comprehensive Teamfight Tactics (TFT) analysis tool that helps players track lobby compositions, analyze unit contestation, and access detailed TFT mechanics guides.

## Overview

TFTPad is a hobby project created by Micah (Moisturizar) to share TFT learnings and provide practical tools for TFT players. The application consists of a React frontend for the main interface and a PythonAnywhere backend for data processing.

## Features

### Main Application
- **Lobby Analysis**: Input predicted compositions from other players in your lobby
- **Unit Contestation Tracking**: See which units are contested based on lobby predictions
- **Composition Recommendations**: Get suggested comps based on your lobby analysis
- **Real-time Updates**: Dynamic filtering and sorting of data

### Blog Section
- **TFT Mechanics Guides**: Deep dives into game mechanics
- **Topics Covered**:
  - Defensive Stats (Armor, Magic Resist, Effective Health)
  - Champion Pool Mechanics
  - Economic Management
  - Positioning Fundamentals
  - Base Stats Comparison
  - Item Pool Analysis
  - Damage Mechanics
  - Mana Generation

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Google Analytics**: Page view and event tracking
- **SEO Optimized**: Meta tags, structured data, and sitemap
- **Modern UI**: Clean, intuitive interface with notebook-style background

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **PythonAnywhere** hosting
- **Python** for data processing
- **Flask** (likely) for API endpoints

## Project Structure

```
tftpad/
├── src/
│   ├── components/          # React components
│   │   ├── comp_holder.tsx  # Main lobby analysis
│   │   ├── units_holder.tsx # Unit contestation view
│   │   ├── comps_holder.tsx # Composition recommendations
│   │   ├── BlogPage.tsx     # Blog listing page
│   │   └── ContactPage.tsx  # Contact form
│   ├── contexts/            # React contexts
│   ├── services/            # API services
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── requirements.txt         # Python dependencies
└── package.json            # Node.js dependencies
```

## Setup Instructions

### Frontend Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tftpad
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Backend (PythonAnywhere)

The backend is hosted on PythonAnywhere and handles:
- Data processing for lobby analysis
- Unit contestation calculations
- Composition recommendation algorithms

**Backend Features:**
- RESTful API endpoints
- Data validation and processing
- Real-time calculations for TFT mechanics

## Deployment

### Frontend
The frontend is deployed as a static site, likely on:
- Vercel
- Netlify
- GitHub Pages

### Backend
- **Hosting**: PythonAnywhere
- **Domain**: Integrated with frontend via API calls
- **Database**: Likely SQLite or similar for data storage

## Google Analytics

The application includes comprehensive Google Analytics tracking:
- Page view tracking for all routes
- Custom events for user interactions
- Tab change tracking
- Blog post engagement metrics

## Contributing

This is a hobby project, but feedback and suggestions are welcome! You can:
- Report bugs or issues
- Suggest new features
- Provide feedback on blog content
- Request improvements to existing functionality

## Contact

- **Creator**: Micah (Moisturizar)
- **MetaTFT Profile**: [Moisturizar](https://www.metatft.com/player/na/moisturizar-NA1)
- **Contact Form**: Available on the website for feedback and suggestions

## License

This project is a personal hobby project. TFTPad isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.

## Acknowledgments

- Riot Games for Teamfight Tactics
- The TFT community for insights and feedback
- PythonAnywhere for backend hosting
- Various TFT content creators and analysts whose work informed the blog content
