# ⚡ Quick Start Guide

Get your Virtual Try-On Catalog Generator running in **5 minutes**.

## 🎯 Prerequisites

You need these three things:
1. **FAL AI API Key** - [Get it here](https://fal.ai/) (Free tier available)
2. **Upstash Redis** - [Sign up here](https://upstash.com/) (Free tier available)
3. **Node.js 18+** - [Download](https://nodejs.org/)

## 🚀 Setup (5 minutes)

### Step 1: Get your credentials (2 min)

**FAL AI**:
1. Go to https://fal.ai/
2. Sign up with GitHub or Google
3. Go to Dashboard → API Keys
4. Click "Create API Key"
5. Copy the key (starts with `fal_...`)

**Upstash Redis**:
1. Go to https://console.upstash.com/
2. Sign up (free, no credit card needed)
3. Click "Create Database"
4. Select any region (closer = faster)
5. Copy the `REST API URL` and `REST API TOKEN`

### Step 2: Clone & install (1 min)

```bash
# Clone the repo
git clone <your-repo-url>
cd virtual_try_on

# Install dependencies
pnpm install
# or: npm install
```

### Step 3: Configure environment (1 min)

```bash
# Copy the example file
cp env.example .env.local

# Edit .env.local with your favorite editor
nano .env.local
```

Paste your credentials:
```env
FAL_KEY=fal_xxxxxxxxxxxxxxxxxxxxx
KV_REST_API_URL=https://your-db.upstash.io
KV_REST_API_TOKEN=your_token_here
```

Save and close.

### Step 4: Run it! (1 min)

```bash
pnpm dev
# or: npm run dev
```

Open **http://localhost:3000** in your browser.

## 🎨 Your First Virtual Try-On

### Quick Test (30 seconds)

1. **Download test images** (or use your own):
   - Model: Professional photo of person in plain clothing
   - Product: Clear photo of clothing item

2. **Upload**:
   - Click "Add Model" → select model photo
   - Click "Add Product" → select product photo

3. **Generate**:
   - Click "Generate 1 Virtual Try-On"
   - Wait 10-15 seconds
   - Done! 🎉

### Full Catalog Test (2 minutes)

1. **Upload multiple images**:
   - Add 3 model photos (different people)
   - Add 2 product photos (different items)

2. **Check "Generate all combinations"**
   - This creates 3 models × 2 products = 6 images

3. **Click "Generate 6 Virtual Try-Ons"**
   - Watch progress for each image
   - Takes ~1-2 minutes total

4. **Download**:
   - Click "Download All" to get all 6 images
   - Or hover over any image to download individually

## 🎯 Pro Tips

### Best Results

**Models**:
- Use high-res photos (2000px+)
- Plain white or gray background
- Natural standing pose
- Good lighting

**Products**:
- PNG with transparent background works best
- Clean, wrinkle-free items
- Clear product details
- True-to-life colors

### Customize the Prompt

Default: `"Model wearing the product naturally, professional ecommerce photography"`

Try these:
```
"Professional studio shot, white background, full body"
"Lifestyle photo, casual outdoor setting, natural lighting"
"Fashion editorial, dramatic lighting, urban background"
```

### Aspect Ratios

- **Portrait (9:16)**: Best for full-body fashion
- **Square (1:1)**: Instagram-friendly
- **Landscape (16:9)**: Website banners
- **Wide (21:9)**: Hero images

## 🚨 Common Issues

**"Rate limit exceeded"**
- You hit the 2/day limit
- Use the `/g` route for dev: http://localhost:3000/g
- Or wait until reset time

**"Failed to generate"**
- Image too large? Try < 5MB
- Check your API key is correct
- Verify internet connection

**HEIC images not working**
- They should auto-convert
- If failing, convert to JPG first

## 📁 File Structure

Only edit these files to customize:

```
components/image-combiner.tsx  → Main app logic & UI
app/api/generate-image/route.ts → API endpoint
app/layout.tsx → Page title & meta
.env.local → Your secret keys
```

## 🚢 Deploy to Production

### Vercel (Easiest - 2 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# (same three variables from .env.local)
```

Visit your new URL!

### Other Options
- **Netlify**: `netlify deploy --prod`
- **Railway**: `railway up`
- **Your server**: `pnpm build && pnpm start`

## 💰 Pricing

**Development (Free tier is enough)**:
- FAL AI: ~$0.01 per image
- Upstash: 10,000 commands/day free
- Total: $0-5/month for testing

**Production (Small ecommerce)**:
- 100 products/month
- 5 model variations each = 500 images
- Cost: ~$5-10/month

**Enterprise**:
- Contact FAL AI for volume discounts
- Upgrade Upstash for higher rate limits

## 🆘 Need Help?

1. Check **README.md** for detailed docs
2. Check **ECOMMERCE_SETUP_GUIDE.md** for business use cases
3. Review browser console for errors
4. Check FAL AI dashboard for API status

## ✅ Checklist

Before going live:

- [ ] Test with 5-10 sample products
- [ ] Customize prompts for your brand
- [ ] Update page title and metadata
- [ ] Set up custom domain
- [ ] Review generated images for quality
- [ ] Update terms of service
- [ ] Train your team on the workflow

## 🎉 Success!

You now have a working Virtual Try-On Catalog Generator!

**Next Steps**:
1. Generate your first batch of images
2. Review quality and refine prompts
3. Integrate into your existing workflow
4. Scale up to full product catalog

**Happy generating!** 🚀

---

💡 **Pro tip**: Bookmark http://localhost:3000/g for unlimited dev testing

