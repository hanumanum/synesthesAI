# Synesthesia

An interactive visual experiments project using p5.js and TypeScript. This project explores the relationship between different sensory experiences through creative coding.

## 🎨 Features

- Multiple interactive sketches
- Responsive canvas design
- Keyboard controls for interaction
- Particle systems and drawing tools
- TypeScript for type safety
- Modern development setup with Vite

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/synesthesia.git
cd synesthesia
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎮 Controls

Common controls across sketches:
- `r` - Reset sketch
- `p` - Pause/Play animation
- `f` - Toggle fullscreen
- `c` - Change colors (in drawing sketch)

## 📁 Project Structure

```
synesthesia/
├── src/
│   ├── sketches/        # Individual sketch files
│   │   ├── drawing.ts   # Drawing sketch
│   │   └── particles.ts # Particle system sketch
│   └── config/          # Global configuration
├── public/             # Static assets
├── index.html         # Main entry point
├── sketch1.html       # Additional sketch entry
└── vite.config.ts     # Vite configuration
```

## 🛠️ Development

### Adding a New Sketch

1. Create a new TypeScript file in `src/sketches/`
2. Create a corresponding HTML file in the root directory
3. Update `vite.config.ts` with the new entry point
4. Add navigation links in all HTML files
5. Implement basic controls and features

### Code Style

- Use TypeScript for all new code
- Follow p5.js best practices
- Implement responsive design
- Add helpful console messages
- Include proper cleanup in p.remove()

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [p5.js](https://p5js.org/) - Creative coding library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool and dev server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 