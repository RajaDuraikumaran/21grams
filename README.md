# 21Grams - Open Source AI Portrait Studio

> **"The Weight of a Single Photo."**

21Grams is a free, open-source AI-powered portrait studio that transforms your selfies into professional headshots. Built with Next.js, Supabase, and Hugging Face, it's designed to be accessible, beautiful, and completely free—forever.

## ✨ Features

### 🎨 **AI-Powered Transformations**
- Generate professional headshots from a single selfie
- 20+ curated artistic styles (Studio Professional, Cinematic, Vintage, and more)
- Advanced enhancement filters (Smooth Skin, Reduce Circles, Gentle Smile, etc.)
- Powered by Stable Diffusion via Hugging Face Inference API

### ⏰ **Daily Credit System**
- **24 free credits** every day, automatically reset
- Each generation costs **4 credits** (6 headshots per day)
- No subscriptions, no hidden fees, no paywalls
- Credits refresh every 24 hours—use them or lose them!

### 🔐 **Secure & Private**
- Google OAuth authentication via Supabase
- All images stored securely in Supabase Storage
- Your data, your control

### 🎯 **Premium UX**
- Glassmorphic dark theme with cinematic animations
- Responsive design (mobile, tablet, desktop)
- Real-time progress tracking
- Instant download of generated images

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier works!)
- A Hugging Face account (free tier works!)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RajaDuraikumaran/21grams.git
   cd 21grams
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Hugging Face
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   ```

4. **Set up Supabase**
   
   Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     credits INTEGER DEFAULT 24,
     last_reset_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create generations table
   CREATE TABLE generations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     image_url TEXT NOT NULL,
     prompt_style TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create storage bucket
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('user-uploads', 'user-uploads', true);

   -- Set up storage policies
   CREATE POLICY "Users can upload their own files"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users can view their own files"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'user-uploads');
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🎨 Contributing

We welcome contributions from the community! Here's how you can help:

### Adding New Styles

Want to add a new artistic style? It's easy!

1. **Fork the repository**

2. **Add your style to `lib/styles.ts`**
   ```typescript
   {
     id: "your_style_id",
     label: "Your Style Name",
     prompt: "detailed prompt for Stable Diffusion, professional photography, high quality",
     src: "/styles/your-style-preview.jpg" // Add a preview image
   }
   ```

3. **Add a preview image**
   - Place a 512x512 preview image in `public/styles/`
   - Name it `your-style-preview.jpg`

4. **Test your style**
   - Run the app locally
   - Generate a few images with your new style
   - Ensure the results match your vision

5. **Submit a Pull Request**
   - Title: `feat: Add [Your Style Name] style`
   - Description: Explain the style and show example outputs

### Other Ways to Contribute
- 🐛 Report bugs via [GitHub Issues](https://github.com/RajaDuraikumaran/21grams/issues)
- 💡 Suggest new features or enhancements
- 📖 Improve documentation
- 🎨 Design new UI components
- 🧪 Write tests

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Framer Motion
- **Authentication:** Supabase Auth (Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **AI:** Hugging Face Inference API (Stable Diffusion)
- **Deployment:** Vercel

## 📝 License

This project is **open source** and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with ❤️ by [Raja Duraikumaran](https://github.com/RajaDuraikumaran)
- AI models powered by [Hugging Face](https://huggingface.co)
- Infrastructure by [Supabase](https://supabase.com) and [Vercel](https://vercel.com)

---

**⭐ If you like this project, please give it a star on GitHub!**

**🔗 Live Demo:** [https://21grams-app.vercel.app](https://21grams-app.vercel.app)
