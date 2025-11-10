import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Summarize a web page's content
 */
export async function summarizeTab(tab) {
  try {
    const { title, url, content, description } = tab;

    // Build the prompt
    const prompt = `You are summarizing a web page that someone saved from their browser.

Title: ${title}
URL: ${url}
${description ? `Description: ${description}` : ''}

Content:
${content ? content.slice(0, 8000) : 'No content available'}

Please provide a concise 2-3 sentence summary of what this page is about and why someone might have been interested in it. Focus on the key insights or information, not just describing what type of page it is.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const summary = message.content[0].text;
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

/**
 * Generate a digest from multiple tab summaries
 */
export async function generateDigest(tabs, startDate, endDate) {
  try {
    // Build summaries list
    const tabsList = tabs.map((tab, index) => {
      return `${index + 1}. [${tab.title}](${tab.url})
   Saved: ${new Date(tab.saved_at).toLocaleDateString()}
   ${tab.summary || 'No summary available'}`;
    }).join('\n\n');

    const prompt = `You are creating a personalized digest of someone's browsing activity.

Between ${new Date(startDate).toLocaleDateString()} and ${new Date(endDate).toLocaleDateString()}, they saved ${tabs.length} tabs:

${tabsList}

Please write a thoughtful, narrative digest (3-5 paragraphs) that:
1. Identifies the main themes and patterns in their browsing
2. Connects related ideas across different tabs
3. Reflects on what their browsing suggests about their current interests, questions, or projects
4. Is written in second person ("you") - make it personal and insightful

Be perceptive about implicit connections and subconscious patterns. This should feel like a mirror showing them what they've been thinking about.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const digest = message.content[0].text;
    return digest;
  } catch (error) {
    console.error('Error generating digest:', error);
    throw error;
  }
}
