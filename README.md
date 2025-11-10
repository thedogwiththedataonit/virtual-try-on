# 🛍️ Virtual Try-On Catalog Generator

A powerful Next.js application that enables ecommerce companies to create AI-generated virtual try-on catalogs. Upload model photos and product images to automatically generate professional-looking try-on combinations using advanced AI technology.

![Virtual Try-On Preview](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## 🌟 Features

### Core Functionality
- **Multiple Model Upload**: Upload multiple model/mannequin photos at once
- **Multiple Product Upload**: Batch upload clothing, accessories, or any ecommerce items
- **Intelligent Combination Generation**: Automatically create all model × product combinations
- **AI-Powered Image Merging**: Uses FAL AI's Nanobanana to intelligently merge images
- **Real-Time Progress Tracking**: Monitor each generation with live progress bars
- **Responsive Catalog Grid**: Beautiful 2-4 column layout adapting to screen size

### Advanced Features
- **Bulk Export**: Download all generated images at once
- **Individual Downloads**: Hover over any image to download
- **Fullscreen Preview**: Click any image for detailed view
- **HEIC Support**: Automatic conversion of iPhone photos
- **Image Compression**: Optimizes images for faster API processing
- **Aspect Ratio Detection**: Auto-detects and suggests best aspect ratio
- **Rate Limiting**: Built-in protection with Redis-based rate limiting
- **Error Handling**: Graceful error states with retry logic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- FAL AI API key ([Get one here](https://fal.ai/))
- Upstash Redis account ([Sign up here](https://upstash.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd virtual_try_on
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   FAL_KEY=your_fal_api_key_here
   KV_REST_API_URL=your_upstash_redis_url_here
   KV_REST_API_TOKEN=your_upstash_redis_token_here
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How It Works

### 1. Upload Model Photos
- Click "Add Model" or drag & drop multiple photos
- Supports JPG, PNG, HEIC, and more formats
- Upload 1-10 model photos (people wearing similar base clothing)

### 2. Upload Product Images
- Click "Add Product" or drag & drop your product photos
- Upload clothing, accessories, or any items you want to try on
- Supports transparent backgrounds for best results

### 3. Configure Settings
- **Aspect Ratio**: Choose from 1:1, 9:16, 16:9, 21:9, or custom ratios
- **Generate All Combinations**: Toggle to create every model × product pair
  - ON: 3 models × 2 products = 6 images
  - OFF: 1 model × 2 products = 2 images (faster)

### 4. Customize the Prompt
- Default: `"Model wearing the product naturally, professional ecommerce photography"`
- Customize for your brand style:
  - `"Professional studio photography, white background, full body shot"`
  - `"Casual lifestyle shot, outdoor setting, natural lighting"`
  - `"Fashion editorial style, dramatic lighting, urban background"`

### 5. Generate & Download
- Click "Generate X Virtual Try-Ons"
- Watch real-time progress for each image
- Download individually or use "Download All" for batch export

## 🎯 Use Cases

### Fashion & Apparel
- Create lookbooks without physical photoshoots
- Test new designs on various body types
- Generate seasonal catalog variations

### Jewelry & Accessories
- Visualize watches, necklaces, earrings on models
- Create size comparison catalogs
- Test different styling combinations

### Footwear
- Show shoes on different model poses
- Create color variant catalogs quickly
- Test product placement and styling

### Eyewear & Cosmetics
- Demonstrate glasses/sunglasses on various face types
- Create makeup/hairstyle variations
- Build virtual try-on experiences

## 🔧 Customization Guide

### Branding

1. **Update the title and description**
   Edit `components/image-combiner.tsx`:
   ```tsx
   <h1 className="...">Your Brand - Virtual Try-On</h1>
   <p className="...">Your custom tagline here</p>
   ```

2. **Change color scheme**
   Edit the dithering background in `components/image-combiner.tsx`:
   ```tsx
   <Dithering
     colorBack="#00000000"
     colorFront="#614B00"  // Change to your brand color
     speed={0.43}
     shape="wave"
     type="4x4"
     pxSize={3}
     scale={1.13}
   />
   ```

3. **Update metadata**
   Edit `app/layout.tsx`:
   ```tsx
   export const metadata: Metadata = {
     title: "Your Company - Virtual Try-On",
     description: "Create stunning virtual try-on photos",
   }
   ```

### API Configuration

#### Rate Limiting
Adjust rate limits in `app/api/generate-image/route.ts`:
```typescript
const MAX_REQUESTS_PER_DAY = 2 // Change this number
```

#### Image Quality
Adjust compression settings in `components/image-combiner.tsx`:
```typescript
const compressImage = async (file: File, maxWidth = 1280, quality = 0.75) => {
  // Increase maxWidth for higher resolution
  // Increase quality (0.0-1.0) for better quality
}
```

### Prompt Templates

Create preset prompts for different use cases:
```typescript
const promptTemplates = {
  studio: "Professional studio photography, white background, full body shot",
  lifestyle: "Casual lifestyle shot, outdoor setting, natural lighting",
  editorial: "Fashion editorial style, dramatic lighting, urban background",
  ecommerce: "Clean product photography, neutral background, commercial use"
}
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI + Radix UI
- **AI Service**: FAL AI (Nanobanana)
- **Database**: Upstash Redis (Rate limiting)
- **Image Processing**: Browser-native + heic-to converter

### Project Structure
```
virtual_try_on/
├── app/
│   ├── api/
│   │   ├── generate-image/    # Main AI generation endpoint
│   │   └── proxy-image/       # CORS proxy for images
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Home page
├── components/
│   ├── ui/                    # Shadcn UI components
│   └── image-combiner.tsx     # Main virtual try-on component
├── lib/
│   └── utils.ts               # Utility functions
└── public/                    # Static assets
```

### API Endpoints

#### POST `/api/generate-image`
Generates virtual try-on images using AI.

**Request Body** (FormData):
```javascript
{
  mode: "virtual-try-on",
  prompt: "Model wearing the product naturally...",
  aspectRatio: "portrait",
  model: File,      // Model image file
  product: File     // Product image file
}
```

**Response**:
```json
{
  "url": "https://fal.media/...",
  "prompt": "Model wearing the product...",
  "description": "AI-generated description"
}
```

#### GET `/api/proxy-image?url=<image_url>`
Proxies FAL.media images to bypass CORS restrictions.

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables:
     - `FAL_KEY`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
   - Click "Deploy"

3. **Configure custom domain** (optional)
   - Go to Project Settings → Domains
   - Add your custom domain

### Other Platforms

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

## 📊 Performance & Optimization

### Image Size Limits
- Recommended: < 5MB per image
- Maximum: 10MB (API limit)
- Automatically compressed to 1280px max dimension

### Generation Times
- Single image: ~8-15 seconds
- Batch of 10: ~2-3 minutes (with delays)
- Can be parallelized (remove delays for faster processing)

### Rate Limits
- Default: 2 generations per day per IP
- Bypass for dev: Access via `/g` route
- Upgrade Upstash Redis for higher limits

## 🔒 Security & Privacy

### Data Handling
- Images are processed in-memory
- No images stored on server
- FAL AI stores images temporarily (30 days)
- Rate limiting prevents abuse

### Environment Variables
- Never commit `.env.local` to git
- Use Vercel/Netlify environment settings
- Rotate API keys regularly

### CORS & Proxying
- Image proxy validates FAL.media URLs only
- Prevents unauthorized external requests

## 🐛 Troubleshooting

### Common Issues

**"Rate limit exceeded"**
- Wait until the reset time (shown in error)
- Use `/g` route for development
- Increase limit in API route

**"Failed to generate image"**
- Check API key is valid
- Verify image file sizes < 10MB
- Check network connection
- Review browser console for details

**"HEIC conversion failed"**
- Try converting to JPG before upload
- Use online converter: heic.online
- Update to latest browser version

**Images not loading**
- Check CORS proxy is working
- Verify FAL API is responding
- Try refreshing the page

## 📚 Additional Resources

- [FAL AI Documentation](https://fal.ai/docs)
- [Nanobanana Model](https://fal.ai/models/fal-ai/nano-banana)
- [Next.js Documentation](https://nextjs.org/docs)
- [Upstash Redis Docs](https://docs.upstash.com/)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this template for commercial projects.

## 💬 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review the troubleshooting section

---

**Built with ❤️ for ecommerce innovation**

Transform your product photography workflow and create stunning virtual try-on experiences in minutes!

# virtual-try-on
