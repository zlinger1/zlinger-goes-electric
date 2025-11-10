# zlinger-goes-electric
a programmatic art installation memorializing the life of zlinger

## TabMemory

An AI-powered browser extension and web app that saves your tabs and generates thoughtful digests of your browsing patterns.

### The Concept

Unlike traditional "save for later" tools, TabMemory acknowledges the truth: you're probably not going to read those tabs. Instead, it uses AI to:

- **Summarize each tab** as you save it
- **Generate narrative digests** that reveal patterns in what you've been exploring
- **Reflect back your intellectual journey** - what were you thinking about this week?

Think of it as a mirror for your browsing habits, helping you understand your own curiosity and interests.

### Project Structure

```
├── extension/       # Chrome browser extension
├── backend/         # Node.js API server with Claude AI integration
├── dashboard/       # Web dashboard for viewing tabs and digests
└── shared/          # Shared types and utilities
```

### Quick Start

#### 1. Set up the Database

```bash
# Install PostgreSQL (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb tabmemory

# Initialize schema
cd backend
npm install
npm run init-db
```

#### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your Anthropic API key
```

#### 3. Start the Backend

```bash
npm start
# Server will run on http://localhost:3000
```

#### 4. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory
5. The TabMemory icon should appear in your toolbar

### Usage

1. **Save Tabs**: Click the extension icon and choose "Save All Tabs" or "Save Current Tab"
2. **View Archive**: Click "Open Dashboard" or visit `http://localhost:3000/dashboard`
3. **Generate Digests**: Go to the Digests tab and click "Generate New Digest"
4. **Reflect**: Read your digest to see patterns in your browsing

### Features

- ✅ One-click tab saving with AI summarization
- ✅ Real-time content extraction from pages
- ✅ Automatic AI-powered summaries using Claude
- ✅ Narrative digests that weave your tabs into a story
- ✅ Beautiful dashboard to browse your archive
- ✅ No email spam - pull-based, view when you want

### Tech Stack

- **Extension**: Chrome Manifest V3, vanilla JavaScript
- **Backend**: Node.js, Express, PostgreSQL
- **AI**: Anthropic Claude API
- **Dashboard**: HTML/CSS/JavaScript (vanilla, no build step)

### Future Ideas

- Firefox extension support
- Custom digest schedules
- Search and filtering
- Export functionality
- Multi-user support with authentication
- Mobile app
- Integration with note-taking tools

### Privacy

Your browsing data is stored in your local PostgreSQL database. Tab content is sent to Anthropic's Claude API for summarization. If privacy is a concern, you can modify the code to use a local LLM instead.

### License

Apache-2.0
